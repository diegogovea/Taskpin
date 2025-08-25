import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity 
} from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Contenedor del mensaje central */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            No tienes ningún plan,{'\n'}crea uno nuevo para{'\n'}empezar.
          </Text>
        </View>
        
        {/* Botón crear hábito */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push("/seccion_planes/tiposPlanes")}
        >
          <Text style={styles.createButtonText}>Crear plan nuevo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  
  // Contenedor del contenido
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  
  // Contenedor del mensaje
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  
  messageText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  
  // Botón crear hábito (ahora morado)
  createButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});