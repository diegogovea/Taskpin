import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Definir tipos para TypeScript
interface HabitoHoy {
  habito_usuario_id: number;
  user_id: number;
  habito_id: number;
  nombre: string;
  descripcion: string | null;
  puntos_base: number;
  categoria_nombre: string;
  frecuencia_personal: string;
  fecha_agregado: string;
  completado_hoy: boolean;
  hora_completado: string | null;
  notas: string | null;
}

interface Estadisticas {
  total: number;
  completados: number;
  pendientes: number;
  fecha: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    habitos: HabitoHoy[];
    estadisticas: Estadisticas;
  };
}

export default function HabitosScreen() {
  const router = useRouter();
  
  // Estados
  const [habitos, setHabitos] = useState<HabitoHoy[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    completados: 0,
    pendientes: 0,
    fecha: 'today'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // URL base de tu API
  const API_BASE_URL = 'http://localhost:8000';

  // Obtener fecha actual formateada
  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('es', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  // Función para obtener el usuario actual
  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/current-user`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentUserId(data.data.user_id);
        return data.data.user_id;
      } else {
        console.log('No se pudo obtener el usuario actual');
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  // Función para cargar hábitos de hoy
  const loadHabitosHoy = async (userId?: number) => {
    try {
      const userIdToUse = userId || currentUserId;
      if (!userIdToUse) {
        const fetchedUserId = await getCurrentUser();
        if (!fetchedUserId) return;
      }

      const response = await fetch(`${API_BASE_URL}/api/usuario/${userIdToUse || currentUserId}/habitos/hoy`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setHabitos(data.data.habitos);
        setEstadisticas(data.data.estadisticas);
      } else {
        console.log('Error al cargar hábitos');
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  // Función para alternar completado de hábito
  const toggleHabitCompletion = async (habitoUsuarioId: number) => {
    if (!currentUserId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/usuario/${currentUserId}/habito/${habitoUsuarioId}/toggle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Actualizar el estado local inmediatamente
        setHabitos(prevHabitos => 
          prevHabitos.map(habito => 
            habito.habito_usuario_id === habitoUsuarioId
              ? { ...habito, completado_hoy: result.data.completado }
              : habito
          )
        );

        // Recalcular estadísticas localmente
        const updatedHabitos = habitos.map(habito => 
          habito.habito_usuario_id === habitoUsuarioId
            ? { ...habito, completado_hoy: result.data.completado }
            : habito
        );
        
        const completados = updatedHabitos.filter(h => h.completado_hoy).length;
        const pendientes = updatedHabitos.length - completados;
        
        setEstadisticas(prev => ({
          ...prev,
          completados,
          pendientes
        }));

      } else {
        Alert.alert('Error', 'No se pudo actualizar el hábito');
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabitosHoy();
    setRefreshing(false);
  };

  // Inicializar datos al cargar la pantalla
  const initializeData = async () => {
    setLoading(true);
    const userId = await getCurrentUser();
    if (userId) {
      await loadHabitosHoy(userId);
    }
    setLoading(false);
  };

  // Recargar cuando se enfoca la pantalla (volver de agregar hábitos)
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        loadHabitosHoy();
      } else {
        initializeData();
      }
    }, [currentUserId])
  );

  // Cargar datos iniciales
  useEffect(() => {
    initializeData();
  }, []);

  const { day, month } = getCurrentDate();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Contenedor de estadísticas */}
        <View style={styles.statsContainer}>
          {/* Fecha */}
          <View style={styles.dateCard}>
            <Text style={styles.dateNumber}>{day}</Text>
            <Text style={styles.dateText}>{month}</Text>
          </View>
          
          {/* Hábitos completados */}
          <View style={[styles.statCard, styles.completedCard]}>
            <Text style={styles.statLabel}>Hábitos{'\n'}completados</Text>
            <Text style={styles.statNumber}>{estadisticas.completados}</Text>
          </View>
          
          {/* Hábitos pendientes */}
          <View style={[styles.statCard, styles.pendingCard]}>
            <Text style={styles.statLabel}>Hábitos{'\n'}Pendientes</Text>
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
          </View>
        </View>
        
        {/* Lista de hábitos o mensaje de vacío */}
        {habitos.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              No tienes ningún hábito,{'\n'}crea uno nuevo para{'\n'}empezar.
            </Text>
            
            {/* Botón crear hábito */}
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <Text style={styles.createButtonText}>Crear hábito nuevo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {/* Título de la lista */}
            <Text style={styles.habitsTitle}>Mis hábitos de hoy</Text>
            
            {/* Lista de hábitos */}
            {habitos.map((habito) => (
              <TouchableOpacity
                key={habito.habito_usuario_id}
                style={styles.habitItem}
                onPress={() => toggleHabitCompletion(habito.habito_usuario_id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    habito.completado_hoy
                      ? ['#10B981', '#059669'] // Verde cuando completado
                      : ['#F3F4F6', '#E5E7EB'] // Gris cuando pendiente
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.habitGradient}
                >
                  <View style={styles.habitContent}>
                    {/* Información del hábito */}
                    <View style={styles.habitInfo}>
                      <Text style={[
                        styles.habitName,
                        habito.completado_hoy && styles.habitNameCompleted
                      ]}>
                        {habito.nombre}
                      </Text>
                      <Text style={[
                        styles.habitCategory,
                        habito.completado_hoy && styles.habitCategoryCompleted
                      ]}>
                        {habito.categoria_nombre} • {habito.puntos_base} puntos
                      </Text>
                      {habito.completado_hoy && habito.hora_completado && (
                        <Text style={styles.habitTime}>
                          Completado a las {habito.hora_completado.slice(0, 5)}
                        </Text>
                      )}
                    </View>

                    {/* Checkbox */}
                    <View style={[
                      styles.checkbox,
                      habito.completado_hoy && styles.checkedBox
                    ]}>
                      {habito.completado_hoy && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}

            {/* Botón para agregar más hábitos */}
            <TouchableOpacity 
              style={styles.addMoreButton}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <Ionicons name="add" size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
              <Text style={styles.addMoreText}>Agregar más hábitos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  
  // Loading
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
    marginBottom: 30,
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
  
  // Contenedor del mensaje cuando no hay hábitos
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 50,
  },
  
  messageText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  
  // Botón crear hábito
  createButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
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

  // Lista de hábitos
  habitsList: {
    paddingBottom: 20,
  },

  habitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },

  habitItem: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  habitGradient: {
    borderRadius: 16,
    padding: 16,
  },

  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  habitInfo: {
    flex: 1,
    marginRight: 16,
  },

  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },

  habitNameCompleted: {
    color: 'white',
  },

  habitCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },

  habitCategoryCompleted: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  habitTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
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
    backgroundColor: '#047857',
    borderColor: '#047857',
  },

  // Botón para agregar más hábitos
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },

  addMoreText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});