import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BienvenidaScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("Usuario");

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.log('Error loading username:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Icono/Logo con elementos decorativos */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Text style={styles.bookIcon}>📖</Text>
          </View>
          {/* Elementos decorativos flotantes */}
          <Text style={styles.decorativeElement1}>✨</Text>
          <Text style={styles.decorativeElement2}>⭐</Text>
          <Text style={styles.decorativeElement3}>💫</Text>
          <Text style={styles.decorativeElement4}>🔢</Text>
        </View>

        {/* Título de la app */}
        <Text style={styles.appTitle}>MATE APP</Text>

        {/* Mensaje de bienvenida */}
        <Text style={styles.welcomeMessage}>¡Bienvenido de nuevo {username}!</Text>
      </View>

      {/* Botón de navegación al menú */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.buttonText}>IR AL MENÚ DE INICIO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 40,
  },
  iconBackground: {
    width: 100,
    height: 100,
    backgroundColor: "#FFC043",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  bookIcon: {
    fontSize: 48,
  },
  // Elementos decorativos posicionados alrededor del logo
  decorativeElement1: {
    position: "absolute",
    top: -15,
    left: -15,
    fontSize: 20,
  },
  decorativeElement2: {
    position: "absolute",
    top: -10,
    right: -20,
    fontSize: 16,
  },
  decorativeElement3: {
    position: "absolute",
    bottom: -15,
    left: -20,
    fontSize: 18,
  },
  decorativeElement4: {
    position: "absolute",
    bottom: -10,
    right: -15,
    fontSize: 22,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFC043",
    letterSpacing: 3,
    marginBottom: 20,
  },
  welcomeMessage: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
    lineHeight: 28,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  menuButton: {
    backgroundColor: "#FFC043",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});