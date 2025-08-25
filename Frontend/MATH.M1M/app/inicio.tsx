import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validaciones básicas
    if (!correo.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }
    
    if (!contraseña.trim()) {
      Alert.alert("Error", "Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);
    
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", {
        correo: correo.trim().toLowerCase(),
        contraseña,
      });
      
      const { access_token, user_id, nombre } = res.data;
      
      // Guardar información del usuario en AsyncStorage
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('user_id', user_id.toString());
      await AsyncStorage.setItem('nombre', nombre);
      
      Alert.alert("Éxito", "Login correcto. Token: " + access_token);
      router.replace("/bienvenida");
      
    } catch (err) {
      const error = err as any;
      console.error("Error de login:", error);
      
      let errorMessage = "Algo salió mal";
      
      if (error.response?.status === 401) {
        errorMessage = "Correo electrónico o contraseña incorrectos";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      {/* Logo */}
      <Image
        source={require("../components/images/logo.png")} // Ajusta el nombre de tu archivo
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Formulario */}
      <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
      <TextInput
        style={styles.input}
        placeholder="hola@taskpineresawesome.co"
        placeholderTextColor="#9CA3AF" // Placeholder gris original
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.label}>CONTRASEÑA</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••"
        placeholderTextColor="#9CA3AF" // Placeholder gris original
        secureTextEntry
        value={contraseña}
        onChangeText={setContraseña}
        autoCapitalize="none"
      />
      
      {/* Link de registro */}
      <TouchableOpacity 
        style={styles.registerLink}
        onPress={() => router.push("/pantallaSignIn")} 
      >
        <Text style={styles.registerLinkText}>
          ¿No tienes cuenta? Crea una aquí
        </Text>
      </TouchableOpacity>
      
      {/* Botón de login */}
      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Iniciando..." : "INICIAR SESIÓN"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    backgroundColor: "#F9FAFB", // Fondo gris claro original
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981", // Verde original
    textAlign: "center",
    marginBottom: 24,
  },
  logo: { 
    width: 150, 
    height: 150, 
    alignSelf: "center", 
    marginBottom: 40,
  },
  label: { 
    fontSize: 12, 
    color: "#9CA3AF", // Gris medio original
    marginBottom: 8, 
    marginTop: 16,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#F3F4F6", // Gris muy claro original
    borderRadius: 8,
    padding: 16,
    marginBottom: 4,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  registerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#6B7280", // Gris medio original
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#8B5CF6", // Morado original
    padding: 18,
    borderRadius: 25,
    marginTop: 32,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: "#D1D5DB", // Gris claro cuando está deshabilitado
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: { 
    color: "#FFFFFF", 
    fontWeight: "600", 
    fontSize: 16,
  },
});