import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

export default function SignUpScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para llenar datos de prueba
  const fillTestData = () => {
    setName("María Elena González");
    setEmail("maria.gonzalez@gmail.com");
    setUsername("marielena123");
    setPassword("123456");
    setConfirmPassword("123456");
    setBirthdate("15/03/1998");
  };

  // Función para validar formato de fecha
  const validateDateFormat = (dateStr: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    return regex.test(dateStr);
  };

  // Función para convertir DD/MM/AAAA a AAAA-MM-DD
  const formatDateForAPI = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Función para validar que la fecha sea válida
  const isValidDate = (dateString: string) => {
    if (!validateDateFormat(dateString)) return false;
    
    const [day, month, year] = dateString.split('/');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return dateObj.getFullYear() == parseInt(year) && 
           dateObj.getMonth() == parseInt(month) - 1 && 
           dateObj.getDate() == parseInt(day);
  };

  const handleRegister = async () => {
    // Validaciones
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre completo");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre de usuario");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Por favor ingresa una contraseña");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (!birthdate.trim()) {
      Alert.alert("Error", "Por favor ingresa tu fecha de nacimiento");
      return;
    }

    if (!validateDateFormat(birthdate)) {
      Alert.alert("Error", "El formato de fecha debe ser DD/MM/AAAA");
      return;
    }

    if (!isValidDate(birthdate)) {
      Alert.alert("Error", "Por favor ingresa una fecha válida");
      return;
    }

    // Validar que el usuario sea mayor de edad (opcional)
    const [day, month, year] = birthdate.split('/');
    const birthYear = parseInt(year);
    const currentYear = new Date().getFullYear();
    
    if (currentYear - birthYear < 13) {
      Alert.alert("Error", "Debes tener al menos 13 años para registrarte");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        nombre_completo: name.trim(),
        correo_electronico: email.trim().toLowerCase(),
        usuario: username.trim(),
        contraseña: password,
        fecha_nacimiento: formatDateForAPI(birthdate)
      };

      const response = await axios.post("http://127.0.0.1:8000/register", userData);

      Alert.alert(
        "¡Registro exitoso!", 
        "Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.",
        [
          {
            text: "Ir al Login",
            onPress: () => router.replace("/")
          }
        ]
      );

    } catch (error: any) {
      console.error("Error de registro:", error);
      
      let errorMessage = "Error al crear la cuenta";
      
      if (error.response?.status === 400) {
        errorMessage = "El correo electrónico o nombre de usuario ya están registrados";
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

        {/* Nombre completo */}
        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Jimena Martinez"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Correo electrónico */}
        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Usuario */}
        <Text style={styles.label}>USUARIO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Jimejime"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Contraseña */}
        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        {/* Confirmar contraseña */}
        <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />

        {/* Fecha de nacimiento */}
        <Text style={styles.label}>FECHA DE NACIMIENTO</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#aaa"
          value={birthdate}
          onChangeText={setBirthdate}
          keyboardType="numeric"
        />

        {/* Botón de registro */}
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? "Registrando..." : "Registrarme"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 32,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },
  loginLink: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  nextButton: {
    backgroundColor: "#ffb703",
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#ccc",
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  testButton: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: "center",
  },
  testButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});