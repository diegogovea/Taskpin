import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Imagen de perfil y nombre */}
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>Juanito Lopez</Text>

      {/* Menú de pestañas */}
      <View style={styles.tabMenu}>
        <TouchableOpacity>
          <Text style={[styles.tabItem, styles.activeTab]}>Progreso</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.tabItem}>Ejercicios</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.tabItem}>Puntajes</Text>
        </TouchableOpacity>
      </View>

      {/* Progreso */}
      <Text style={styles.progressText}>Progreso de curso</Text>
      <CircularProgress
        value={90}
        radius={80}
        activeStrokeWidth={16}
        inActiveStrokeWidth={10}
        inActiveStrokeColor={"#d9e0d9"}
        activeStrokeColor={"#6cc24a"}
        valueSuffix={"%"}
        titleColor={"#000"}
        progressValueColor={"white"}
        titleStyle={{ fontWeight: "bold" }}
        circleBackgroundColor={"#6cc24a"}
      />
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
