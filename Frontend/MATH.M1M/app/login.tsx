import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      {/* 🔽 LOGO LOCAL - Cambia por tu ruta 🔽 */}
      <Image
        source={require("../components/images/iconoLogo.png")} // Ajusta el nombre de tu archivo
        style={styles.logo}
        resizeMode="contain"
      />
      {/* 🔼 LOGO LOCAL 🔼 */}

      {/* Título */}
      <Text style={styles.title}>Taskpin</Text>

      {/* Botones */}
      <TouchableOpacity 
        style={styles.buttonPrimary} 
        onPress={() => router.replace("/pantallaSignIn")}
      >
        <Text style={styles.buttonPrimaryText}>Crear Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.buttonSecondary} 
        onPress={() => router.replace("/inicio")}
      >
        <Text style={styles.buttonSecondaryText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB', // Fondo gris muy claro
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: '#1F2937', // Gris oscuro como en la imagen
    marginBottom: 80,
  },
  buttonPrimary: {
    backgroundColor: '#A78BFA', // Morado principal
    paddingVertical: 16,
    width: 240,
    borderRadius: 25,
    marginTop: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: '#E0E7FF', // Morado claro
    paddingVertical: 16,
    width: 240,
    borderRadius: 25,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#6366F1', // Morado oscuro para contraste
    fontWeight: '600',
    fontSize: 16,
  },
});