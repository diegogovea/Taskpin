/**
 * API Configuration
 * Centraliza la URL del backend para toda la aplicación
 */

// En Expo, las variables de entorno deben tener prefijo EXPO_PUBLIC_
// Se acceden con process.env.EXPO_PUBLIC_*
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || '').trim() || 'http://localhost:8000';

/**
 * Base ws/wss al mismo host que el API (Render = https → wss).
 * Opcional: EXPO_PUBLIC_WS_URL si el proxy de WS difiere del HTTP.
 */
export function getWebSocketBaseUrl(): string {
  const explicit = (process.env.EXPO_PUBLIC_WS_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const base = API_BASE_URL.replace(/\/$/, '');
  if (base.startsWith('https://')) {
    return 'wss://' + base.slice('https://'.length);
  }
  if (base.startsWith('http://')) {
    return 'ws://' + base.slice('http://'.length);
  }
  return 'ws://localhost:8000';
}

// Endpoints comunes (opcional, para referencia)
export const ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  CURRENT_USER: '/api/current-user',
  
  // Usuarios
  USUARIO: (id: number) => `/api/usuario/${id}`,
  
  // Hábitos
  CATEGORIAS_HABITOS: '/api/categorias-habitos',
  HABITOS: '/api/habitos',
  HABITOS_BY_CATEGORIA: (categoriaId: number) => `/api/habitos/categoria/${categoriaId}`,
  USER_HABITOS: (userId: number) => `/api/usuario/${userId}/habitos`,
  USER_HABITOS_HOY: (userId: number) => `/api/usuario/${userId}/habitos/hoy`,
  TOGGLE_HABITO: (userId: number, habitoUsuarioId: number) => 
    `/api/usuario/${userId}/habito/${habitoUsuarioId}/toggle`,
  ADD_HABITO: (userId: number) => `/api/usuario/${userId}/habitos`,
  ADD_HABITOS_MULTIPLE: (userId: number) => `/api/usuario/${userId}/habitos/multiple`,
  
  // Planes
  CATEGORIAS_PLANES: '/api/planes/categorias',
  PLANES_BY_CATEGORIA: (categoriaId: number) => `/api/planes/categoria/${categoriaId}`,
  PLAN_DETALLE: (planId: number) => `/api/planes/detalle/${planId}`,
  MIS_PLANES: (userId: number) => `/api/planes/mis-planes/${userId}`,
  AGREGAR_PLAN: '/api/planes/agregar',
  TAREAS_DIARIAS: (planUsuarioId: number) => `/api/planes/tareas-diarias/${planUsuarioId}`,
  MARCAR_TAREA: '/api/planes/marcar-tarea',
};
