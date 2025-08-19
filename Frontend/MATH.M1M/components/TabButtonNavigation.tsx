import React from "react";
import { TouchableOpacity, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";

// Define los props que el componente espera recibir
interface TabButtonProps {
  title: string; // Texto que se mostrará dentro del botón
  to: string; // Ruta a la que se debe navegar cuando se presione
}

// Define el componente TabButton como una función de React
export default function TabButton({ title, to }: TabButtonProps) {
  // Obtiene el router para poder navegar a otra pantalla
  const router = useRouter();

  return (
    // Botón táctil que se puede presionar
    <TouchableOpacity
      style={styles.button} // Aplica los estilos del botón
      onPress={() => router.push(to)} // Navega a la ruta especificada cuando se presiona
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

// Define los estilos para el botón y el texto
const styles = StyleSheet.create({
  button: {
    backgroundColor: "#0024D3", // Azul primario
    paddingVertical: 12, // Espaciado vertical
    paddingHorizontal: 20, // Espaciado lateral
    borderRadius: 8, // Bordes redondeados
    marginVertical: 8, // Espacio entre botones si hay varios
  },
  text: {
    color: "white", // Texto blanco
    fontWeight: "bold", // Negritas
    fontSize: 16, // Tamaño de letra
  },
});
