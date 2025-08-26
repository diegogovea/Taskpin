import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import CircularProgress from "react-native-circular-progress-indicator";

const bgColors = ["#6cc24a", "#10B981", "#8B5CF6", "#EF4444", "#F59E0B"];

export default function PerfilScreen() {
  const router = useRouter();

  const [userData, setUserData] = useState({
    nombre: "",
    correo: "",
  });

  const [loading, setLoading] = useState(true);
  const [bgColorIndex, setBgColorIndex] = useState(0);

  const [progresoHabito] = useState(65); // Progreso ficticio

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [nombre, correo] = await AsyncStorage.multiGet([
          "nombre",
          "correo",
        ]);
        setUserData({
          nombre: nombre[1] || "Usuario",
          correo: correo[1] || "correo@ejemplo.com",
        });
      } catch (error) {
        console.error("Error cargando datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const changeBgColor = () => {
    setBgColorIndex((prevIndex) => (prevIndex + 1) % bgColors.length);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión? Se limpiarán todos tus datos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await AsyncStorage.clear();
              router.replace("/inicio");
            } catch (error) {
              console.error("Error cerrando sesión:", error);
              Alert.alert("Error", "No se pudo cerrar sesión.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={bgColors[bgColorIndex]} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Botón configuración */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/configuracion")}
        accessibilityLabel="Ir a configuración"
      >
        <Ionicons name="settings-outline" size={28} color={bgColors[bgColorIndex]} />
      </TouchableOpacity>

      {/* Ícono de monito con fondo circular colorido que cambia al tocar */}
      <TouchableOpacity
        style={[styles.avatarContainer, { backgroundColor: bgColors[bgColorIndex] }]}
        onPress={changeBgColor}
        accessibilityLabel="Cambiar color de fondo del icono de perfil"
      >
        <Ionicons name="person-circle-outline" size={120} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.iconColorText}>
        Toca el icono para cambiar el color de fondo
      </Text>

      {/* Información personal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.label}>NOMBRE COMPLETO</Text>
            <Text style={styles.value}>{userData.nombre}</Text>
          </View>
        </View>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <Text style={styles.value}>{userData.correo}</Text>
          </View>
        </View>
      </View>

      {/* Progreso de hábito circular */}
      <View style={styles.progressSection}>
        <CircularProgress
          value={progresoHabito}
          radius={70}
          inActiveStrokeColor="#E5E7EB"
          activeStrokeColor={bgColors[bgColorIndex]}
          inActiveStrokeOpacity={0.3}
          progressValueColor="#fff"
          maxValue={100}
          title="Progreso de hábito"
          titleColor="#fff"
          titleStyle={{ fontWeight: "600", fontSize: 14 }}
          valueSuffix="%"
          duration={1000}
        />
        <Text style={styles.progressText}>
          Has completado {progresoHabito}% de tu hábito actual
        </Text>
      </View>

      {/* Botones rápidos interactivos */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: bgColors[bgColorIndex] }]}
          onPress={() => router.push("/(tabs)/habitos")}
          accessibilityLabel="Ir a mis hábitos"
        >
          <Text style={styles.quickActionIcon}>✅</Text>
          <Text style={styles.quickActionText}>Mis Hábitos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: bgColors[bgColorIndex] }]}
          onPress={() => router.push("/(tabs)/planes")}
          accessibilityLabel="Ir a mis planes"
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>Mis Planes</Text>
        </TouchableOpacity>
      </View>

      {/* Botón cerrar sesión */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  settingsButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  iconColorText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  progressSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  progressText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  quickActionIcon: {
    fontSize: 28,
    color: "white",
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  logoutSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#EF4444",
    marginLeft: 8,
  },
});
