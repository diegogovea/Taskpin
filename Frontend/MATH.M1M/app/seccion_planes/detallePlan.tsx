// Frontend/MATH.M1M/app/seccion_planes/detallePlan.tsx

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
  TextInput,
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
  orden: number;
  es_diaria: boolean;
}

interface Fase {
  objetivo_id: number;
  titulo: string;
  descripcion: string;
  orden_fase: number;
  duracion_dias: number;
  tareas: Tarea[];
}

interface PlanCompleto {
  plan_id: number;
  meta_principal: string;
  descripcion: string;
  plazo_dias_estimado: number;
  dificultad: 'fácil' | 'intermedio' | 'difícil';
  imagen: string | null;
  categoria_nombre: string;
  fases: Fase[];
  total_fases: number;
  total_tareas: number;
}

export default function DetallePlanScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams();
  
  const [plan, setPlan] = useState<PlanCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diasPersonalizados, setDiasPersonalizados] = useState<string>("");
  const [agregandoPlan, setAgregandoPlan] = useState(false);

  // Cargar detalle completo del plan
  const fetchPlanDetalle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/planes/detalle/${planId}`);
      const data = await response.json();
      
      if (data.success) {
        setPlan(data.plan);
        setDiasPersonalizados(data.plan.plazo_dias_estimado.toString());
      } else {
        setError('Plan no encontrado');
      }
    } catch (error) {
      console.error('Error fetching plan detail:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Agregar plan a usuario (hardcoded user_id = 1 por ahora)
  const agregarPlan = async () => {
    if (!plan) return;
    
    try {
      setAgregandoPlan(true);
      
      const payload = {
        user_id: 1, // TODO: Obtener del contexto de usuario real
        plan_id: plan.plan_id,
        dias_personalizados: parseInt(diasPersonalizados) || plan.plazo_dias_estimado
      };

      const response = await fetch('http://localhost:8000/api/planes/agregar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          '¡Éxito!',
          'Plan agregado correctamente a tus planes',
          [
            {
              text: 'Ver mis planes',
              onPress: () => {
                // TODO: Navegar a la pantalla de "Mis planes"
                router.push('/(tabs)/home' as any);
              }
            },
            {
              text: 'Continuar',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'No se pudo agregar el plan');
      }
    } catch (error) {
      console.error('Error adding plan:', error);
      Alert.alert('Error', 'Error de conexión al agregar el plan');
    } finally {
      setAgregandoPlan(false);
    }
  };

  useEffect(() => {
    if (planId) {
      fetchPlanDetalle();
    }
  }, [planId]);

  // Función para retroceder
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/seccion_planes/bienestarYSalud' as any);
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
  const TaskItem = ({ tarea }: { tarea: Tarea }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Ionicons 
          name={getTaskIcon(tarea.tipo) as any} 
          size={16} 
          color="#8B5CF6" 
        />
        <Text style={styles.taskTitle}>{tarea.titulo}</Text>
        <View style={[styles.taskTypeBadge, { 
          backgroundColor: tarea.es_diaria ? '#DBEAFE' : '#FEF3C7' 
        }]}>
          <Text style={[styles.taskTypeText, {
            color: tarea.es_diaria ? '#1D4ED8' : '#D97706'
          }]}>
            {tarea.tipo}
          </Text>
        </View>
      </View>
      <Text style={styles.taskDescription}>{tarea.descripcion}</Text>
    </View>
  );

  // Componente para renderizar una fase
  const FaseItem = ({ fase, index }: { fase: Fase; index: number }) => (
    <View style={styles.faseCard}>
      <View style={styles.faseHeader}>
        <View style={styles.faseNumber}>
          <Text style={styles.faseNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.faseInfo}>
          <Text style={styles.faseTitle}>{fase.titulo}</Text>
          <Text style={styles.faseDescription}>{fase.descripcion}</Text>
          <View style={styles.faseDuration}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.faseDurationText}>
              {fase.duracion_dias} días
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tasksContainer}>
        <Text style={styles.tasksTitle}>
          Tareas ({fase.tareas.length})
        </Text>
        {fase.tareas.map((tarea) => (
          <TaskItem key={tarea.tarea_id} tarea={tarea} />
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando detalles del plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlanDetalle}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyColor = getDifficultyColor(plan.dificultad);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* INFO PRINCIPAL DEL PLAN */}
        <View style={styles.planHeader}>
          <Text style={styles.categoryTag}>{plan.categoria_nombre}</Text>
          <Text style={styles.planTitle}>{plan.meta_principal}</Text>
          <Text style={styles.planDescription}>{plan.descripcion}</Text>
          
          <View style={styles.planStats}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.statText}>{plan.plazo_dias_estimado} días</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flag-outline" size={16} color={difficultyColor} />
              <Text style={[styles.statText, { color: difficultyColor }]}>
                {plan.dificultad}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={16} color="#64748B" />
              <Text style={styles.statText}>{plan.total_fases} fases</Text>
            </View>
          </View>
        </View>

        {/* PERSONALIZACIÓN DE DURACIÓN */}
        <View style={styles.customizationCard}>
          <Text style={styles.customizationTitle}>Personaliza tu plan</Text>
          <Text style={styles.customizationSubtitle}>
            Ajusta la duración según tu ritmo
          </Text>
          
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duración (días):</Text>
            <TextInput
              style={styles.durationInput}
              value={diasPersonalizados}
              onChangeText={setDiasPersonalizados}
              keyboardType="numeric"
              placeholder={plan.plazo_dias_estimado.toString()}
            />
          </View>
        </View>

        {/* FASES DEL PLAN */}
        <View style={styles.fasesSection}>
          <Text style={styles.sectionTitle}>Plan detallado</Text>
          <Text style={styles.sectionSubtitle}>
            {plan.total_fases} fases • {plan.total_tareas} tareas totales
          </Text>
          
          {plan.fases.map((fase, index) => (
            <FaseItem key={fase.objetivo_id} fase={fase} index={index} />
          ))}
        </View>
      </ScrollView>

      {/* BOTÓN FLOTANTE PARA AGREGAR PLAN */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.addButton, agregandoPlan && styles.addButtonDisabled]}
          onPress={agregarPlan}
          disabled={agregandoPlan}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.addButtonGradient}
          >
            {agregandoPlan ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="add-circle" size={20} color="white" />
            )}
            <Text style={styles.addButtonText}>
              {agregandoPlan ? 'Agregando...' : 'Agregar a mis planes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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

  // Loading y Error (mismos estilos que bienestarYSalud.tsx)
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

  // Plan Header
  planHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 16,
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Customization Card
  customizationCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customizationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  customizationSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    minWidth: 80,
    textAlign: 'center',
  },

  // Fases Section
  fasesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100, // Espacio para el botón flotante
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },

  // Fase Card
  faseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  faseHeader: {
    flexDirection: 'row',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  faseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  faseDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  faseDurationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Tasks
  tasksContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  taskItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskTypeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 24,
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});