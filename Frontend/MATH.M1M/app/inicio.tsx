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
  const [correo_electronico, setCorreoElectronico] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validaciones básicas
    if (!correo_electronico.trim()) {
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
        correo_electronico,
        contraseña,
      });
      
      const { access_token, username } = res.data;
      
      // Guardar solo el username
      await AsyncStorage.setItem('username', username);
      
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
      {/* 🔽 LOGO LOCAL - Cambia por tu ruta 🔽 */}
      <Image
        source={require("../components/images/logo.png")} // Ajusta el nombre de tu archivo
        style={styles.logo}
        resizeMode="contain"
      />
      {/* 🔼 LOGO LOCAL 🔼 */}
      
    
      
      {/* Formulario */}
      <Text style={styles.label}>NICKNAME</Text>
      <TextInput
        style={styles.input}
        placeholder="hola@taskpineresawesome.co"
        placeholderTextColor="#9CA3AF"
        value={correo_electronico}
        onChangeText={setCorreoElectronico}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.label}>CONTRASEÑA</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••"
        placeholderTextColor="#9CA3AF"
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
          {loading ? "Iniciando sesión..." : "Regístrate"}
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
    backgroundColor: "#F9FAFB", // Fondo gris claro
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981", // Verde como en la imagen
    textAlign: "center",
    marginBottom: 24,
  },
  logo: { 
    width: 150, 
    height: 150, 
    alignSelf: "center", 
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937", // Gris oscuro
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  label: { 
    fontSize: 12, 
    color: "#9CA3AF", // Gris medio
    marginBottom: 8, 
    marginTop: 16,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#F3F4F6", // Gris muy claro
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
    color: "#6B7280", // Gris medio
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#8B5CF6", // Morado como en la imagen
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
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: { 
    color: "#FFFFFF", 
    fontWeight: "600", 
    fontSize: 16,
  },
});