import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  // Componente para renderizar las estrellas
  const StarRating = ({ rating = 0 }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#FFD700" : "#C0C0C0"}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Componente para cada item de la lista
  const ListItem = ({ progress = 0.7 }) => {
    return (
      <View style={styles.itemContainer}>
        {/* Imagen placeholder */}
        <View style={styles.imageContainer}>
          <Ionicons name="image-outline" size={30} color="#888" />
        </View>
        
        {/* Contenido del item */}
        <View style={styles.contentContainer}>
          {/* Barra de progreso */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          {/* Calificación con estrellas */}
          <StarRating rating={0} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.listContainer}>
        {/* Renderiza 3 items como en la imagen */}
        <ListItem progress={0.7} />
        <ListItem progress={0.8} />
        <ListItem progress={0.6} />
      </View>
      
      {/* Botón morado al final */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Crear plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  listContainer: {
    marginBottom: 30,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#d0d0d0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#c0c0c0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4169E1',
    borderRadius: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#8A2BE2',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});