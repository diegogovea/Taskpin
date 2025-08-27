import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Definir los tipos para TypeScript
interface Habito {
  habito_id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  frecuencia_recomendada: string;
  puntos_base: number;
  categoria_nombre?: string;
}

interface ApiResponse {
  success: boolean;
  data: Habito[];
}

export default function CatH3Screen() {
  const router = useRouter();
  
  // Estados para manejar los datos
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // URL base de tu API
  const API_BASE_URL = 'http://localhost:8000';

  // Función para obtener el usuario actual desde la BD
  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/current-user`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentUserId(data.data.user_id);
        return data.data.user_id;
      } else {
        Alert.alert('Error', 'No se pudo obtener el usuario actual');
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      Alert.alert('Error', 'Error de conexión al obtener usuario');
      return null;
    }
  };

  // Función para obtener los hábitos de la categoría 3 (Mente y Enfoque)
  const fetchHabitos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/habitos/categoria/3`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setHabitos(data.data);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los hábitos');
      }
    } catch (error) {
      console.error('Error fetching habitos:', error);
      Alert.alert('Error', 'Error de conexión con el servidor');
    }
  };

  // Función para inicializar datos
  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Cargar hábitos (siempre se debe mostrar)
      await fetchHabitos();
      
      // Intentar obtener usuario actual (para agregar hábitos después)
      await getCurrentUser();
      
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    initializeData();
  }, []);

  // Función para retroceder
  const goBack = () => {
    console.log('Intentando retroceder...');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/home');
    }
  };

  // Función para alternar la selección de un hábito
  const toggleHabitSelection = (habitId: number) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  // Función para agregar los hábitos seleccionados
  const agregarHabitos = async () => {
    if (selectedHabits.length === 0) {
      Alert.alert('Atención', 'Debes seleccionar al menos un hábito');
      return;
    }

    if (!currentUserId) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    try {
      setAdding(true);

      const response = await fetch(`${API_BASE_URL}/api/usuario/${currentUserId}/habitos/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
          habito_ids: selectedHabits,
          frecuencia_personal: 'diario'
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          '¡Éxito!', 
          `Se agregaron ${result.data.added_habitos.length} hábitos correctamente`,
          [
            {
              text: 'OK', 
              onPress: () => {
                // Resetear selecciones y volver atrás
                setSelectedHabits([]);
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudieron agregar los hábitos');
      }

    } catch (error) {
      console.error('Error adding habitos:', error);
      Alert.alert('Error', 'Error de conexión al agregar hábitos');
    } finally {
      setAdding(false);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando hábitos...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
          <Text style={styles.mainTitle}>Mente y Enfoque</Text>
          <Text style={styles.subtitle}>Hábitos para desarrollo mental y concentración 🧠</Text>
        </View>

        {/* LISTA DE HÁBITOS CON CHECKBOXES */}
        <View style={styles.habitsContainer}>
          {habitos.map((habito) => (
            <TouchableOpacity 
              key={habito.habito_id}
              style={styles.habitButton} 
              activeOpacity={0.8}
              onPress={() => toggleHabitSelection(habito.habito_id)}
            >
              <LinearGradient
                colors={
                  selectedHabits.includes(habito.habito_id)
                    ? ['#10B981', '#059669'] // Verde cuando está seleccionado
                    : ['#DDD6FE', '#C4B5FD'] // Morado suave cuando no está seleccionado
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.habitContent}>
                  <View style={styles.habitTextContainer}>
                    <Text style={[
                      styles.habitTitle,
                      selectedHabits.includes(habito.habito_id) && styles.selectedText
                    ]}>
                      {habito.nombre}
                    </Text>
                    {habito.descripcion && (
                      <Text style={[
                        styles.habitDescription,
                        selectedHabits.includes(habito.habito_id) && styles.selectedText
                      ]}>
                        {habito.descripcion}
                      </Text>
                    )}
                    <Text style={[
                      styles.habitPoints,
                      selectedHabits.includes(habito.habito_id) && styles.selectedText
                    ]}>
                      {habito.puntos_base} puntos • {habito.frecuencia_recomendada}
                    </Text>
                  </View>
                  
                  {/* CHECKBOX PERSONALIZADO */}
                  <View style={[
                    styles.checkbox,
                    selectedHabits.includes(habito.habito_id) && styles.checkedBox
                  ]}>
                    {selectedHabits.includes(habito.habito_id) && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* BOTÓN FLOTANTE PARA AGREGAR HÁBITOS */}
      {selectedHabits.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={agregarHabitos}
            disabled={adding}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingGradient}
            >
              {adding ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.floatingButtonText}>
                    Agregar {selectedHabits.length} hábito{selectedHabits.length > 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ESTILOS DEL COMPONENTE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  scrollView: {
    flex: 1,
  },

  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },

  mainTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  habitsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Espacio para el botón flotante
  },

  habitButton: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  gradientCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },

  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  habitTextContainer: {
    flex: 1,
    marginRight: 16,
  },

  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },

  habitDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },

  habitPoints: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  selectedText: {
    color: '#FFFFFF',
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkedBox: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },

  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },

  floatingButton: {
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },

  floatingGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  floatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});