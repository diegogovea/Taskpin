// Frontend/MATH.M1M/app/seccion_planes/seguimientoPlan.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// Interfaces
interface Tarea {
  tarea_id: number;
  titulo: string;
  descripcion: string;
  tipo: 'diaria' | 'semanal' | 'única';
  es_diaria: boolean;
  completada: boolean;
  hora_completada: string | null;
  tarea_usuario_id: number | null;
}

interface FaseActual {
  objetivo_id: number;
  titulo: string;
  descripcion: string;
  orden_fase: number;
  duracion_dias: number;
}

interface TareasDiarias {
  plan_usuario_id: number;
  meta_principal: string;
  dificultad: 'fácil' | 'intermedio' | 'difícil';
  fecha: string;
  dias_transcurridos: number;
  fase_actual: FaseActual;
  tareas: Tarea[];
}

export default function SeguimientoPlanScreen() {
  const router = useRouter();
  const { planUsuarioId, titulo } = useLocalSearchParams();
  
  const [tareasDiarias, setTareasDiarias] = useState<TareasDiarias | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marcandoTarea, setMarcandoTarea] = useState<number | null>(null);

  // Cargar tareas del día
  const fetchTareasDiarias = async () => {
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/planes/tareas-diarias/${planUsuarioId}`);
      const data = await response.json();
      
      if (data.success) {
        setTareasDiarias(data.tareas_diarias);
      } else {
        setError('Error al cargar las tareas del día');
      }
    } catch (error) {
      console.error('Error fetching tareas diarias:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Marcar/desmarcar tarea
  const toggleTarea = async (tareaId: number) => {
    if (marcandoTarea === tareaId) return;
    
    try {
      setMarcandoTarea(tareaId);
      
      const response = await fetch('http://localhost:8000/api/planes/marcar-tarea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_usuario_id: parseInt(planUsuarioId as string),
          tarea_id: tareaId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local
        setTareasDiarias(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            tareas: prev.tareas.map(tarea => 
              tarea.tarea_id === tareaId 
                ? { ...tarea, completada: !tarea.completada }
                : tarea
            )
          };
        });
      } else {
        Alert.alert('Error', data.message || 'No se pudo actualizar la tarea');
      }
    } catch (error) {
      console.error('Error toggling tarea:', error);
      Alert.alert('Error', 'Error de conexión al actualizar la tarea');
    } finally {
      setMarcandoTarea(null);
    }
  };

  useEffect(() => {
    if (planUsuarioId) {
      fetchTareasDiarias();
    }
  }, [planUsuarioId]);

  // Función para retroceder
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/planes' as any);
    }
  };

  // Obtener color por dificultad
  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case 'fácil': return '#10B981';
      case 'intermedio': return '#F59E0B';
      case 'difícil': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Obtener icono por tipo de tarea
  const getTaskIcon = (tipo: string) => {
    switch (tipo) {
      case 'diaria': return 'calendar-outline';
      case 'semanal': return 'calendar-number-outline';
      case 'única': return 'checkmark-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  // Componente para renderizar una tarea
  const TareaItem = ({ tarea }: { tarea: Tarea }) => {
    const isLoading = marcandoTarea === tarea.tarea_id;
    
    return (
      <TouchableOpacity
        style={[
          styles.tareaItem,
          tarea.completada && styles.tareaCompletada
        ]}
        activeOpacity={0.7}
        onPress={() => toggleTarea(tarea.tarea_id)}
        disabled={isLoading}
      >
        <View style={styles.tareaContent}>
          {/* Checkbox animado */}
          <View style={[
            styles.checkbox,
            tarea.completada && styles.checkboxCompleted
          ]}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : tarea.completada ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : null}
          </View>
          
          {/* Información de la tarea */}
          <View style={styles.tareaInfo}>
            <View style={styles.tareaHeader}>
              <Text style={[
                styles.tareaTitle,
                tarea.completada && styles.tareaTitleCompleted
              ]}>
                {tarea.titulo}
              </Text>
              <View style={[styles.tipoBadge, { 
                backgroundColor: tarea.es_diaria ? '#DBEAFE' : '#FEF3C7' 
              }]}>
                <Text style={[styles.tipoText, {
                  color: tarea.es_diaria ? '#1D4ED8' : '#D97706'
                }]}>
                  {tarea.tipo}
                </Text>
              </View>
            </View>
            
            <Text style={[
              styles.tareaDescription,
              tarea.completada && styles.tareaDescriptionCompleted
            ]}>
              {tarea.descripcion}
            </Text>
            
            {tarea.hora_completada && (
              <View style={styles.horaCompletada}>
                <Ionicons name="time-outline" size={12} color="#10B981" />
                <Text style={styles.horaCompletadaText}>
                  Completada a las {tarea.hora_completada.slice(0, 5)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando tareas del día...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tareasDiarias) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTareasDiarias}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyColor = getDifficultyColor(tareasDiarias.dificultad);
  const tareasCompletadas = tareasDiarias.tareas.filter(t => t.completada).length;
  const totalTareas = tareasDiarias.tareas.length;
  const progresoHoy = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titulo || tareasDiarias.meta_principal}
          </Text>
          <Text style={styles.headerSubtitle}>
            Día {tareasDiarias.dias_transcurridos} • {tareasDiarias.fase_actual.titulo}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* PROGRESO DEL DÍA */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progreso de hoy</Text>
              <Text style={styles.progressPercentage}>{progresoHoy}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[
                  styles.progressBarFill,
                  { width: `${progresoHoy}%` }
                ]} />
              </View>
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressStatsText}>
                {tareasCompletadas} de {totalTareas} tareas completadas
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* INFORMACIÓN DE LA FASE ACTUAL */}
        <View style={styles.faseCard}>
          <View style={styles.faseHeader}>
            <View style={styles.faseNumber}>
              <Text style={styles.faseNumberText}>{tareasDiarias.fase_actual.orden_fase}</Text>
            </View>
            <View style={styles.faseInfo}>
              <Text style={styles.faseTitle}>{tareasDiarias.fase_actual.titulo}</Text>
              <Text style={styles.faseDescription}>{tareasDiarias.fase_actual.descripcion}</Text>
            </View>
          </View>
        </View>

        {/* TAREAS DEL DÍA */}
        <View style={styles.tareasSection}>
          <Text style={styles.sectionTitle}>
            Tareas de hoy ({new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })})
          </Text>
          
          {tareasDiarias.tareas.length === 0 ? (
            <View style={styles.noTareasContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text style={styles.noTareasText}>
                ¡No tienes tareas para hoy! Día libre 🎉
              </Text>
            </View>
          ) : (
            tareasDiarias.tareas.map((tarea) => (
              <TareaItem key={tarea.tarea_id} tarea={tarea} />
            ))
          )}
        </View>

        {/* MOTIVACIÓN */}
        {progresoHoy === 100 && (
          <View style={styles.motivacionCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.motivacionGradient}
            >
              <Ionicons name="trophy" size={32} color="white" />
              <Text style={styles.motivacionTitle}>¡Excelente trabajo!</Text>
              <Text style={styles.motivacionText}>
                Completaste todas las tareas de hoy. ¡Sigue así! 💪
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
    color: '#64748B',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },

  // Progress Card
  progressCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressGradient: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressStats: {
    alignItems: 'center',
  },
  progressStatsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Fase Card
  faseCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  faseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faseNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  faseInfo: {
    flex: 1,
  },
  faseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  faseDescription: {
    fontSize: 14,
    color: '#64748B',
  },

  // Tareas Section
  tareasSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },

  // No tareas
  noTareasContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 8,
  },
  noTareasText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 12,
    textAlign: 'center',
  },

  // Tarea Item
  tareaItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tareaCompletada: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tareaContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },

  // Tarea Info
  tareaInfo: {
    flex: 1,
  },
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  tareaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  tareaTitleCompleted: {
    color: '#059669',
  },
  tipoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tipoText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  tareaDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
  tareaDescriptionCompleted: {
    color: '#16A34A',
  },
  horaCompletada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  horaCompletadaText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  // Motivación
  motivacionCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  motivacionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  motivacionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  motivacionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});