import React from "react";
import { View, Text, SafeAreaView, StyleSheet, ScrollView } from "react-native";

// Datos "mock" para mostrar
const datos = {
  usuario: "Juanito Taskpin",
  racha: 7,
  gemas: 35,
  progreso: [
    { label: "Hábitos", value: 78 },
    { label: "Planes", value: 43 },
    { label: "Tests", value: 92 },
  ],
  habitosSemana: [
    { dia: "Lun", completados: 2 },
    { dia: "Mar", completados: 4 },
    { dia: "Mié", completados: 3 },
    { dia: "Jue", completados: 5 },
    { dia: "Vie", completados: 6 },
  ],
  planesCompletados: [
    { nombre: "Estudio", valor: 8 },
    { nombre: "Ejercicio", valor: 3 },
    { nombre: "Lectura", valor: 6 },
    { nombre: "Ahorro", valor: 2 },
    { nombre: "Otro", valor: 5 },
  ],
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER BONITO */}
        <View style={styles.header}>
          <Text style={styles.helloText}>¡Bienvenido/a de nuevo!</Text>
          <Text style={styles.userName}>{datos.usuario}</Text>
        </View>

        {/* Racha y gemas */}
        <View style={styles.rachaBox}>
          <Text style={styles.rachaText}>🔥 Racha: <Text style={styles.highlight}>{datos.racha} días</Text></Text>
          <Text style={styles.rachaText}>💎 Gemas: <Text style={styles.highlight}>{datos.gemas}</Text></Text>
        </View>

        {/* Barra de progreso por apartado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu avance general</Text>
          {datos.progreso.map((item, idx) => (
            <View key={idx} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{item.label}</Text>
              <View style={styles.progressBarBox}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${item.value}%`, backgroundColor: idx === 0 ? "#8B5CF6" : idx === 1 ? "#10B981" : "#F59E0B" },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarTrack,
                    { backgroundColor: "#E5E7EB" }
                  ]}
                />
              </View>
              <Text style={styles.progressValue}>{item.value}%</Text>
            </View>
          ))}
        </View>

        {/* Tabla de hábitos semanales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hábitos esta semana</Text>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={styles.tableCellHeader}>Día</Text>
              <Text style={styles.tableCellHeader}>Completados</Text>
            </View>
            {datos.habitosSemana.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.dia}</Text>
                <Text style={styles.tableCell}>{item.completados}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabla de planes completados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planes completados</Text>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={styles.tableCellHeader}>Plan</Text>
              <Text style={styles.tableCellHeader}>Veces</Text>
            </View>
            {datos.planesCompletados.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.nombre}</Text>
                <Text style={styles.tableCell}>{item.valor}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TOP HÁBITO Y FRASE MOTIVACIONAL */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteTitle}>💪 Mejor hábito semanal</Text>
          <Text style={styles.quoteHighlight}>Lectura (6 veces)</Text>
          <Text style={styles.quoteText}>
            “Cada día cuenta. Sigue sumando pequeños logros y pronto ¡alcanzarás lo grande!”
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    marginBottom: 8,
  },
  helloText: {
    fontSize: 18,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  userName: {
    fontSize: 26,
    color: "#1F2937",
    fontWeight: "bold",
  },
  rachaBox: {
    marginTop: 12,
    marginHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#e0e7ff",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rachaText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  highlight: {
    color: "#8B5CF6",
    fontWeight: "bold",
  },
  section: {
    marginTop: 26,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B5CF6",
    marginBottom: 8,
    marginHorizontal: 6,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: 6,
  },
  progressLabel: {
    width: 80,
    fontWeight: "600",
    color: "#6B7280",
    fontSize: 15,
  },
  progressBarBox: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 12,
    position: "relative",
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressBarTrack: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  progressBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    zIndex: 2,
    height: 12,
  },
  progressValue: {
    minWidth: 40,
    textAlign: "right",
    color: "#6366F1",
    fontWeight: "700",
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#8B5CF6",
  },
  tableCellHeader: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    padding: 8,
    fontSize: 15,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  tableCell: {
    flex: 1,
    color: "#6B7280",
    padding: 8,
    fontSize: 15,
    textAlign: "center",
  },
  quoteBox: {
    marginTop: 24,
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 20,
    backgroundColor: "#10B98111",
    alignItems: "center",
  },
  quoteTitle: {
    fontSize: 15,
    color: "#6366F1",
    fontWeight: "600",
    marginBottom: 4,
  },
  quoteHighlight: {
    fontSize: 18,
    color: "#10B981",
    fontWeight: "bold",
    marginBottom: 9,
  },
  quoteText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
});
