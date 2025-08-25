import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CircularProgress from "react-native-circular-progress-indicator";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Botón de configuración (engranaje) */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/configuracion")}
      >
        <Ionicons name="settings-outline" size={28} color="#333" />
      </TouchableOpacity>

      {/* Imagen de perfil y nombre */}
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>Juanito Lopez</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    top: 40,   // para que no choque con el notch
    right: 20,
    zIndex: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  tabMenu: {
    flexDirection: "row",
    marginBottom: 30,
  },
  tabItem: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTab: {
    color: "#6cc24a",
    textDecorationLine: "underline",
    textDecorationColor: "#6cc24a",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
});
