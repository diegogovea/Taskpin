import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

export default function SubjectsHomeScreen() {
  const router = useRouter();

  // Datos del plan de pérdida de peso
  const planData = {
    id: 1,
    titulo: "Pérdida de Peso",
    meta: "Perder 5 kg",
    progreso: 0.6,
    color: "#10B981", // Verde
    diasRestantes: 23,
    tareasCompletadas: 3,
    tareasTotales: 4,
    pesoInicial: 75,
    pesoObjetivo: 70,
    pesoActual: 72,
    caloriasPromedio: 1850
  };

  // Componente para renderizar las estrellas
  const StarRating = ({ rating = 0 }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#FFD700" : "#C0C0C0"}
          style={{ marginRight: 1 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Función para el botón de atrás
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/planes");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header con botón atrás */}
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#10B981" />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Pérdida de Peso</Text>
        </View>

        <ScrollView 
          style={styles.planScrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Meta Principal */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="at-outline" size={20} color="#10B981" />
              <Text style={styles.detailCardTitle}>Meta Principal</Text>
            </View>
            <Text style={styles.detailCardText}>Perder 5 kg en 8 semanas</Text>
            <View style={styles.detailWeightInfo}>
              <Text style={styles.detailWeightText}>Peso inicial: {planData.pesoInicial} kg</Text>
              <Text style={styles.detailWeightText}>Objetivo: {planData.pesoObjetivo} kg</Text>
            </View>
            <View style={styles.detailProgressBar}>
              <View 
                style={[styles.detailProgressFill, { width: `${planData.progreso * 100}%` }]}
              />
            </View>
          </View>

          {/* Plazo */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              <Text style={styles.detailCardTitle}>Plazo</Text>
            </View>
            <Text style={styles.detailCardText}>Faltan {planData.diasRestantes} días (de 56 total)</Text>
            <View style={styles.detailWeightInfo}>
              <Text style={styles.detailWeightText}>Inicio: 1 Jul 2025</Text>
              <Text style={styles.detailWeightText}>Fin: 26 Ago 2025</Text>
            </View>
          </View>

          {/* Tareas Diarias */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.detailCardTitle}>Tareas de Hoy</Text>
              <Text style={styles.detailTaskCounter}>
                {planData.tareasCompletadas}/{planData.tareasTotales} completadas
              </Text>
            </View>
            
            {[
              { tarea: "Caminar 30 minutos", completada: true },
              { tarea: "Beber 2L de agua", completada: true },
              { tarea: "Registrar comidas", completada: false },
              { tarea: "Evitar azúcar procesada", completada: true }
            ].map((item, index) => (
              <View key={index} style={styles.taskItem}>
                <View style={[
                  styles.taskCheckbox,
                  item.completada ? styles.taskCheckboxCompleted : styles.taskCheckboxEmpty
                ]}>
                  {item.completada && <View style={styles.taskCheckboxDot} />}
                </View>
                <Text style={[
                  styles.taskText,
                  item.completada && styles.taskTextCompleted
                ]}>
                  {item.tarea}
                </Text>
              </View>
            ))}
          </View>

          {/* Métricas de Progreso */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="trending-up-outline" size={20} color="#8B5CF6" />
              <Text style={styles.detailCardTitle}>Progreso esta Semana</Text>
            </View>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Peso Actual</Text>
                <Text style={styles.metricValue}>{planData.pesoActual} kg</Text>
                <Text style={styles.metricSubtext}>-{planData.pesoInicial - planData.pesoActual}kg del inicial</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Calorías Promedio</Text>
                <Text style={styles.metricValue}>{planData.caloriasPromedio.toLocaleString()}</Text>
                <Text style={styles.metricSubtext}>Dentro del objetivo</Text>
              </View>
            </View>
          </View>

          {/* Rating y Motivación */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="star-outline" size={20} color="#FFD700" />
              <Text style={styles.detailCardTitle}>Tu Rendimiento</Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <View>
                <StarRating rating={Math.round(planData.progreso * 5)} />
                <Text style={styles.ratingText}>
                  {Math.round(planData.progreso * 5)}/5 estrellas
                </Text>
              </View>
              <View style={styles.motivationContainer}>
                <Text style={styles.motivationTitle}>¡Excelente progreso!</Text>
                <Text style={styles.motivationSubtext}>Sigue así</Text>
              </View>
            </View>
          </View>

          {/* Recordatorios */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
              <Text style={styles.detailCardTitle}>Próximos Recordatorios</Text>
            </View>
            
            {[
              { tiempo: "6:00 PM", actividad: "Cena saludable" },
              { tiempo: "8:00 PM", actividad: "Registrar peso" },
              { tiempo: "9:00 PM", actividad: "Preparar comida mañana" }
            ].map((recordatorio, index) => (
              <View key={index} style={styles.reminderItem}>
                <View style={styles.reminderTime}>
                  <Text style={styles.reminderTimeText}>{recordatorio.tiempo}</Text>
                </View>
                <Text style={styles.reminderActivity}>{recordatorio.actividad}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ESTILOS DEL COMPONENTE
const styles = StyleSheet.create({
  // Contenedor principal - ocupa toda la pantalla
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Fondo gris muy claro
  },
  
  // Contenedor del contenido
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ScrollView del plan
  planScrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // Header del detalle
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },

  // Tarjetas del detalle
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  detailTaskCounter: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailCardText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },

  // Información de peso
  detailWeightInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailWeightText: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Barra de progreso del detalle
  detailProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },

  // Tareas
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  taskCheckboxEmpty: {
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  taskCheckboxDot: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  taskText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  taskTextCompleted: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },

  // Grid de métricas
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#10B981',
  },

  // Estrellas
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  motivationContainer: {
    alignItems: 'flex-end',
  },
  motivationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  motivationSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Recordatorios
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reminderTime: {
    width: 60,
    height: 28,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400e',
  },
  reminderActivity: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});