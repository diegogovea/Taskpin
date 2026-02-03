/**
 * AuthContext.tsx
 * 
 * Este archivo maneja TODA la autenticación de la app:
 * - Guarda el usuario y token en un solo lugar
 * - Proporciona funciones de login, logout, register
 * - Persiste la sesión con AsyncStorage
 * - Cualquier pantalla puede acceder con useAuth()
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

// ============================================
// TIPOS (TypeScript)
// ============================================

// Datos del usuario que guardamos
interface User {
  user_id: number;
  nombre: string;
  correo: string;
}

// Lo que el contexto expone a toda la app
interface AuthContextType {
  // Estado
  user: User | null;           // Usuario actual (null si no hay sesión)
  token: string | null;        // JWT token para requests
  isLoggedIn: boolean;         // true si hay usuario autenticado
  isLoading: boolean;          // true mientras carga la sesión inicial
  
  // Funciones
  login: (correo: string, contraseña: string) => Promise<{ success: boolean; message?: string }>;
  register: (nombre: string, correo: string, contraseña: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  
  // Función auxiliar para hacer requests autenticados
  authFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

// ============================================
// CREAR EL CONTEXTO
// ============================================

// Creamos el contexto con valor inicial undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HOOK PERSONALIZADO: useAuth()
// ============================================

// Este hook permite a cualquier componente acceder al contexto
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  // Si se usa fuera del Provider, lanzamos error
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}

// ============================================
// PROVIDER: Envuelve toda la app
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Estado del contexto
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inicia cargando
  
  // Derivado: ¿está logueado?
  const isLoggedIn = user !== null && token !== null;
  
  // ============================================
  // CARGAR SESIÓN AL INICIAR
  // ============================================
  
  useEffect(() => {
    loadStoredSession();
  }, []);
  
  /**
   * Carga la sesión guardada en AsyncStorage
   * Se ejecuta cuando la app inicia
   */
  async function loadStoredSession() {
    try {
      console.log('[Auth] Cargando sesión guardada...');
      
      // Leer datos guardados
      const [storedToken, storedUser] = await AsyncStorage.multiGet([
        'auth_token',
        'auth_user'
      ]);
      
      const tokenValue = storedToken[1];
      const userValue = storedUser[1];
      
      if (tokenValue && userValue) {
        // Hay sesión guardada, restaurarla
        setToken(tokenValue);
        setUser(JSON.parse(userValue));
        console.log('[Auth] Sesión restaurada');
      } else {
        console.log('[Auth] No hay sesión guardada');
      }
    } catch (error) {
      console.error('[Auth] Error cargando sesión:', error);
    } finally {
      // Ya terminamos de cargar (haya o no sesión)
      setIsLoading(false);
    }
  }
  
  // ============================================
  // FUNCIÓN: LOGIN
  // ============================================
  
  async function login(correo: string, contraseña: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[Auth] Intentando login...');
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contraseña }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Error del servidor (401, 400, etc.)
        return { 
          success: false, 
          message: data.detail || 'Credenciales incorrectas' 
        };
      }
      
      // Login exitoso - guardar datos
      const userData: User = {
        user_id: data.user_id,
        nombre: data.nombre,
        correo: correo,
      };
      
      // Guardar en estado
      setUser(userData);
      setToken(data.access_token);
      
      // Guardar en AsyncStorage (persistencia)
      await AsyncStorage.multiSet([
        ['auth_token', data.access_token],
        ['auth_user', JSON.stringify(userData)],
        // También guardamos por compatibilidad con código existente
        ['nombre', userData.nombre],
        ['correo', userData.correo],
        ['user_id', String(userData.user_id)],
      ]);
      
      console.log('[Auth] Login exitoso');
      return { success: true };
      
    } catch (error) {
      console.error('[Auth] Error en login:', error);
      return { 
        success: false, 
        message: 'Error de conexión. Verifica tu internet.' 
      };
    }
  }
  
  // ============================================
  // FUNCIÓN: REGISTER
  // ============================================
  
  async function register(nombre: string, correo: string, contraseña: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[Auth] Intentando registro...');
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, correo, contraseña }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: data.detail || 'Error al registrar' 
        };
      }
      
      console.log('[Auth] Registro exitoso, haciendo login automático...');
      
      // Después de registrar, hacer login automático
      return await login(correo, contraseña);
      
    } catch (error) {
      console.error('[Auth] Error en registro:', error);
      return { 
        success: false, 
        message: 'Error de conexión. Verifica tu internet.' 
      };
    }
  }
  
  // ============================================
  // FUNCIÓN: LOGOUT
  // ============================================
  
  async function logout(): Promise<void> {
    try {
      console.log('[Auth] Cerrando sesión...');
      
      // Limpiar estado
      setUser(null);
      setToken(null);
      
      // Limpiar AsyncStorage
      await AsyncStorage.multiRemove([
        'auth_token',
        'auth_user',
        'nombre',
        'correo',
        'user_id',
      ]);
      
      console.log('[Auth] Sesión cerrada');
      
    } catch (error) {
      console.error('[Auth] Error al cerrar sesión:', error);
    }
  }
  
  // ============================================
  // FUNCIÓN: authFetch (requests autenticados)
  // ============================================
  
  /**
   * Hace un fetch incluyendo el token de autenticación
   * Úsalo en lugar de fetch() normal para endpoints protegidos
   */
  async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    console.log('[authFetch] endpoint:', endpoint, 'token exists:', !!token);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };
    
    return fetch(url, {
      ...options,
      headers,
    });
  }
  
  // ============================================
  // VALOR DEL CONTEXTO
  // ============================================
  
  const value: AuthContextType = {
    // Estado
    user,
    token,
    isLoggedIn,
    isLoading,
    
    // Funciones
    login,
    register,
    logout,
    authFetch,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export por defecto del Provider
export default AuthProvider;
