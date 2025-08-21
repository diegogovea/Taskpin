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
        {/* Contenedor de estadísticas */}
        <View style={styles.statsContainer}>
          {/* Fecha */}
          <View style={styles.dateCard}>
            <Text style={styles.dateNumber}>12</Text>
            <Text style={styles.dateText}>AGO</Text>
          </View>
          
          {/* Hábitos completados */}
          <View style={[styles.statCard, styles.completedCard]}>
            <Text style={styles.statLabel}>Hábitos completados</Text>
            <Text style={styles.statNumber}>0</Text>
          </View>
          
          {/* Hábitos pendientes */}
          <View style={[styles.statCard, styles.pendingCard]}>
            <Text style={styles.statLabel}>Hábitos Pendientes</Text>
            <Text style={styles.statNumber}>0</Text>
          </View>
        </View>
        
        {/* Contenedor del mensaje central */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            No tienes ningún hábito,{'\n'}crea uno nuevo para{'\n'}empezar.
          </Text>
        </View>
        
        {/* Botón crear hábito */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push("/seccion_habitos/tiposHabitos")}
        >
          <Text style={styles.createButtonText}>Crear hábito nuevo</Text>
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
    paddingTop: 20,
  },
  
  // Contenedor de las estadísticas
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 60,
  },
  
  // Tarjeta de fecha (morada)
  dateCard: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  dateNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  
  dateText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  
  // Tarjetas de estadísticas (verde y amarillo)
  statCard: {
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  statLabel: {
    fontSize: 12,
    color: "white",
    textAlign: "center",
    marginBottom: 5,
    fontWeight: "500",
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  
  // Tarjeta de hábitos completados (verde)
  completedCard: {
    backgroundColor: "#10B981",
  },
  
  // Tarjeta de hábitos pendientes (amarillo)
  pendingCard: {
    backgroundColor: "#F59E0B",
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
  
  // Botón crear hábito
  createButton: {
    backgroundColor: "#10B981",
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