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
      <Text style={styles.title}>Iniciar Sesión</Text>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/201/201623.png",
        }}
        style={styles.logo}
      />
      
      <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
      <TextInput
        style={styles.input}
        placeholder="ejemplo@correo.com"
        value={correo_electronico}
        onChangeText={setCorreoElectronico}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.label}>CONTRASEÑA</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••••••"
        secureTextEntry
        value={contraseña}
        onChangeText={setContraseña}
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.registerLink}
        onPress={() => router.push("/pantallaSignIn")} 
      >
        <Text style={styles.registerLinkText}>
          ¿No tienes cuenta? Regístrate aquí
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
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },
  logo: { 
    width: 100, 
    height: 100, 
    alignSelf: "center", 
    marginBottom: 20 
  },
  label: { 
    fontSize: 12, 
    color: "#999", 
    marginBottom: 5, 
    marginTop: 10 
  },
  input: {
    backgroundColor: "#eee",
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: "#ffb703",
    padding: 16,
    borderRadius: 8,
    marginTop: 40,
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loginButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#007bff",
    fontSize: 14,
  },
});