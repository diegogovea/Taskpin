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

export default function TiposPlanesScreen() {
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

  // Función para navegar a cada categoría
  const navigateToCategory = (categoria: string, ruta: string) => {
    console.log(`Navegando a: ${categoria}`);
    // Navegar a la ruta específica
    router.push(ruta as any);
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
          <Text style={styles.mainTitle}>Selecciona el tipo de plan</Text>
          <Text style={styles.subtitle}>Elige la categoría que mejor se adapte a tus objetivos</Text>
        </View>

        {/* LISTA DE CATEGORÍAS DE PLANES */}
        <View style={styles.categoriesContainer}>
          
          {/* SALUD Y BIENESTAR - Gradiente verde */}
          <TouchableOpacity 
            style={styles.categoryButton} 
            activeOpacity={0.8}
            onPress={() => navigateToCategory('salud-bienestar', 'seccion_planes/bienestarYSalud')}
          >
            <LinearGradient
              colors={['#D1FAE5', '#A7F3D0', '#6EE7B7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.categoryContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="fitness-outline" size={28} color="#059669" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.categoryTitle, { color: '#059669' }]}>Salud y Bienestar</Text>
                  <Text style={[styles.categoryDescription, { color: '#047857' }]}>
                    Ejercicio, alimentación, sueño y bienestar mental
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#059669" />
            </LinearGradient>
          </TouchableOpacity>

          {/* FINANZAS PERSONALES - Gradiente azul */}
          <TouchableOpacity 
            style={styles.categoryButton} 
            activeOpacity={0.8}
            onPress={() => navigateToCategory('finanzas', '/')}
          >
            <LinearGradient
              colors={['#DBEAFE', '#BFDBFE', '#93C5FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.categoryContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="wallet-outline" size={28} color="#1D4ED8" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.categoryTitle, { color: '#1D4ED8' }]}>Finanzas Personales</Text>
                  <Text style={[styles.categoryDescription, { color: '#1E40AF' }]}>
                    Ahorro, presupuesto, inversiones y control de gastos
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1D4ED8" />
            </LinearGradient>
          </TouchableOpacity>

          {/* DESARROLLO PERSONAL - Gradiente naranja */}
          <TouchableOpacity 
            style={styles.categoryButton} 
            activeOpacity={0.8}
            onPress={() => navigateToCategory('desarrollo-personal', '/')}
          >
            <LinearGradient
              colors={['#FED7AA', '#FDBA74', '#FB923C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.categoryContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="school-outline" size={28} color="#C2410C" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.categoryTitle, { color: '#C2410C' }]}>Desarrollo Personal</Text>
                  <Text style={[styles.categoryDescription, { color: '#DC2626' }]}>
                    Educación, carrera, hobbies y relaciones personales
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C2410C" />
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* BOTÓN PERSONALIZAR CON GRADIENTE ESPECIAL */}
        <View style={styles.customButtonContainer}>
          <TouchableOpacity 
            style={styles.customButton} 
            activeOpacity={0.8}
            onPress={() => navigateToCategory('personalizado', '/')}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A855F7', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.customGradient}
            >
              <Ionicons name="create-outline" size={24} color="white" style={styles.customIcon} />
              <Text style={styles.customButtonText}>Crear plan personalizado</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Contenedor de categorías
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Botones de categoría flotantes
  categoryButton: {
    marginBottom: 20,
    borderRadius: 20,
    // Sombra flotante dramática
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  // Card con gradiente
  gradientCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Contenido de la categoría
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Contenedor del icono
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  // Contenedor del texto
  textContainer: {
    flex: 1,
  },

  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
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