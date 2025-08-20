import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView 
} from "react-native";

export default function SubjectsHomeScreen() {
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Aquí puedes agregar tu contenido */}
        <Text style={styles.placeholder}>Pantalla de materias</Text>
      </View>
    </SafeAreaView>
  );
}

// ESTILOS DEL COMPONENTE
const styles = StyleSheet.create({
  // Contenedor principal - ocupa toda la pantalla
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Fondo gris muy claro
  },
  
  // Contenedor del contenido
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  
  // Texto de placeholder
  placeholder: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});