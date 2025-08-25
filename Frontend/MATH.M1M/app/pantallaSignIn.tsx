import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

export default function SignInScreen() {
  const router = useRouter();
  
  // Estados simplificados - solo campos básicos
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para llenar datos de prueba
  const fillTestData = () => {
    setNombre("Juan Pérez");
    setCorreo("juan@test.com");
    setContraseña("123456");
    setConfirmarContraseña("123456");
  };

  // Validaciones simplificadas
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validaciones básicas
    if (!nombre.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre");
      return;
    }

    if (!correo.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    if (!validateEmail(correo)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    if (!contraseña.trim()) {
      Alert.alert("Error", "Por favor ingresa una contraseña");
      return;
    }

    if (contraseña.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (contraseña !== confirmarContraseña) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        contraseña: contraseña
      };

      const response = await axios.post("http://127.0.0.1:8000/register", userData);

      Alert.alert(
        "¡Registro exitoso!", 
        "Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.",
        [
          {
            text: "Ir al Login",
            onPress: () => router.replace("/inicio")
          }
        ]
      );

    } catch (error: any) {
      console.error("Error de registro:", error);
      
      let errorMessage = "Error al crear la cuenta";
      
      if (error.response?.status === 400) {
        errorMessage = "El correo electrónico ya está registrado";
      } else if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Si es un array de errores de validación de Pydantic
          errorMessage = error.response.data.detail.map((err: any) => err.msg).join('\n');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Crea tu cuenta</Text>

        <TouchableOpacity onPress={() => router.replace("/inicio")}>
          <Text style={styles.loginLink}>¿Ya tienes cuenta? Inicia sesión aquí.</Text>
        </TouchableOpacity>

        {/* Botón para datos de prueba */}
        <TouchableOpacity style={styles.testButton} onPress={fillTestData}>
          <Text style={styles.testButtonText}>🧪 Llenar datos de prueba</Text>
        </TouchableOpacity>

        {/* Nombre */}
        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Juan Pérez"
          placeholderTextColor="#9CA3AF" // Placeholder gris original
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />

        {/* Correo electrónico */}
        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Contraseña */}
        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={contraseña}
          onChangeText={setContraseña}
          autoCapitalize="none"
        />

        {/* Confirmar contraseña */}
        <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={confirmarContraseña}
          onChangeText={setConfirmarContraseña}
          autoCapitalize="none"
        />

        {/* Botón de registro */}
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? "Registrando..." : "CREAR CUENTA"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F9FAFB", // Fondo gris claro original
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937", // Gris oscuro original
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  loginLink: {
    color: "#6B7280", // Gris medio original
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },
  testButton: {
    backgroundColor: "#E0E7FF", // Morado claro
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  testButtonText: {
    color: "#6366F1", // Morado oscuro
    fontSize: 14,
    fontWeight: "500",
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
  nextButton: {
    backgroundColor: "#8B5CF6", // Morado original
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 32,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});