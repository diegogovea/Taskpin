import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Cuenta</Text>

        <View style={styles.itemRow}>
          <View>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.info}>Juanito Lopez</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.edit}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemRow}>
          <View style={styles.photoSection}>
            <Text style={styles.label}>Foto</Text>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
              style={styles.avatar}
            />
          </View>
          <TouchableOpacity>
            <Text style={styles.edit}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemRow}>
          <View>
            <Text style={styles.label}>Sobre mí</Text>
            <Text style={styles.placeholder}>Escribe algo aquí sobre ti</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.edit}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemRow}>
          <View>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.info}>apapa@gmail.com</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.edit}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemRow}>
          <View>
            <Text style={styles.label}>País/Región</Text>
            <Text style={styles.info}>México</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.edit}>Editar</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>General</Text>

        <View style={styles.itemRow}>
          <View>
            <Text style={styles.label}>Notificaciones</Text>
            <Text style={styles.placeholder}>Escribe algo aquí sobre ti</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.edit}>Editar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ marginTop: 30 }}>
          <Text style={styles.logout}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "green",
    fontSize: 16,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  info: {
    color: "#888",
  },
  placeholder: {
    color: "#bbb",
  },
  edit: {
    color: "#007bff",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 5,
  },
  photoSection: {
    flexDirection: "column",
  },
  logout: {
    color: "red",
    fontWeight: "bold",
  },
});
