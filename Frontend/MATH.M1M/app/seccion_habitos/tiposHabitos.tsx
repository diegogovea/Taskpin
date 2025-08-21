// Importaciones necesarias de React Native y Expo Router
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();

  // Función para retroceder
  const goBack = () => {
    console.log('Intentando retroceder...');
    if (router.canGoBack()) {
      router.back();
    } else {
      // Si no puede retroceder, navegar a home
      router.push('/(tabs)/home');
    }
  };
  
  // RENDERIZADO PRINCIPAL DEL COMPONENTE
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER CON FLECHA ATRÁS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* TÍTULO PRINCIPAL */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Agrega un nuevo hábito</Text>
        </View>

        {/* LISTA DE CATEGORÍAS CON GRADIENTES */}
        <View style={styles.categoriesContainer}>
          
          {/* Hábitos comunes - Morado clarito */}
          <TouchableOpacity style={styles.categoryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#DDD6FE', '#C4B5FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.categoryText}>Hábitos comunes</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B46C1" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Categoría 2 - Morado clarito */}
          <TouchableOpacity style={styles.categoryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#DDD6FE', '#C4B5FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.categoryText}>Categoría 2</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B46C1" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Categoría 3 - Morado clarito */}
          <TouchableOpacity style={styles.categoryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#DDD6FE', '#C4B5FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.categoryText}>Categoría 3</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B46C1" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Categoría 4 - Morado clarito */}
          <TouchableOpacity style={styles.categoryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#DDD6FE', '#C4B5FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.categoryText}>Categoría 4</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B46C1" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Categoría 5 - Morado clarito */}
          <TouchableOpacity style={styles.categoryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#DDD6FE', '#C4B5FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.categoryText}>Categoría 5</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B46C1" />
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* BOTÓN PERSONALIZAR CON GRADIENTE ESPECIAL */}
        <View style={styles.customButtonContainer}>
          <TouchableOpacity style={styles.customButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#8B5CF6', '#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.customGradient}
            >
              <Ionicons name="create-outline" size={24} color="white" style={styles.customIcon} />
              <Text style={styles.customButtonText}>Personalizar hábito</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS DEL COMPONENTE
const styles = StyleSheet.create({
  // Contenedor principal con fondo degradado suave
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Fondo gris muy claro
  },

  // Header elegante
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    // Sombra flotante
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Contenedor del título
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Contenedor de categorías
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Botones de categoría flotantes
  categoryButton: {
    marginBottom: 16,
    borderRadius: 20,
    // Sombra flotante dramática
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  // Card con gradiente
  gradientCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B46C1', // Morado más oscuro para el texto
    textShadowColor: 'rgba(107, 70, 193, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Contenedor del botón personalizar
  customButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Botón personalizar flotante
  customButton: {
    borderRadius: 20,
    // Sombra flotante especial
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },

  // Gradiente del botón personalizar
  customGradient: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  customIcon: {
    marginRight: 8,
  },

  customButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});