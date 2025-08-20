import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView 
} from "react-native";

export default function HomeScreen() {
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Aquí puedes agregar tu contenido */}
        <Text style={styles.placeholder}>Pantalla de perfil</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal - ocupa toda la pantalla
  container: {
    flex: 1,
    backgroundColor: "white",
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