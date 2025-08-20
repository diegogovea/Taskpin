// Importa React, necesario para crear componentes funcionales en React Native
import React from "react";
import { View, Text } from "react-native";

// Define el componente funcional HomeScreen, que representa una pantalla
export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Iniciar sesión o Registrar</Text>
    </View>
  );
}
