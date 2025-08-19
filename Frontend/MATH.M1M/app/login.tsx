import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/3004/3004298.png',
        }}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Título */}
      <Text style={styles.title}>MATE APP</Text>

      {/* Botones */}
      <TouchableOpacity style={styles.button} onPress={() => router.replace("/inicio")}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.replace("/pantallaSignIn")}>
        <Text style={styles.buttonText}>Registro</Text>
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
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#F4B400',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#A4D96C',
    paddingVertical: 15,
    // Elimina paddingHorizontal y usa width fijo para igualar tamaño
    width: 200,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    justifyContent: 'center', // centrar texto horizontalmente
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
