import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BienvenidaScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState("Usuario");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Cargar el nombre del usuario desde AsyncStorage
      const savedNombre = await AsyncStorage.getItem('nombre');
      if (savedNombre) {
        setNombre(savedNombre);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Limpiar todos los datos del usuario
      await AsyncStorage.multiRemove(['access_token', 'user_id', 'nombre']);
      router.replace("/inicio"); // Regresar al login
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Contenido principal */}
      <View style={styles.content}>
        
        {/* Logo de la app */}
        <Image 
          source={require("../components/images/logo.png")} 
          style={styles.logo} 
          resizeMode="contain"
        />

        {/* Título de la app */}
        <Text style={styles.appTitle}>TASKPIN</Text>

        {/* Mensaje de bienvenida personalizado */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeMessage}>¡Bienvenido de nuevo!</Text>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.subtitle}>
            Estás listo para continuar construyendo tus hábitos y alcanzar tus metas
          </Text>
        </View>
      </View>

      {/* Botones de navegación */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.buttonText}>IR AL MENÚ DE INICIO</Text>
        </TouchableOpacity>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Fondo gris claro original
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1F2937", // Gris oscuro
    letterSpacing: 3,
    marginBottom: 40,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: "600",
    color: "#10B981", // Verde original
    textAlign: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8B5CF6", // Morado original
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280", // Gris medio
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  menuButton: {
    backgroundColor: "#8B5CF6", // Morado original
    paddingVertical: 18,
    borderRadius: 25,
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
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: "#E0E7FF", // Morado claro para botón secundario
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  logoutButtonText: {
    color: "#6366F1", // Morado oscuro
    fontSize: 14,
    fontWeight: "500",
  },
});