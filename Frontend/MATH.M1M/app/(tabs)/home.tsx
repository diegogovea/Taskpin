// Frontend/MATH.M1M/app/(tabs)/home.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

// ============================================
// INTERFACES
// ============================================

interface HabitoHoy {
  habito_usuario_id: number;
  nombre: string;
  categoria_nombre: string;
  completado_hoy: boolean;
  puntos_base: number;
}

interface EstadisticasHabitos {
  total: number;
  completados: number;
  pendientes: number;
  fecha: string;
}

interface MiPlan {
  plan_usuario_id: number;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  estado: 'activo' | 'pausado' | 'completado' | 'cancelado';
  progreso_porcentaje: number;
  meta_principal: string;
  descripcion: string;
  dificultad: 'fácil' | 'intermedio' | 'difícil';
}

interface ResumenUsuario {
  racha_actual: number;
  gemas_totales: number;
  nivel_actual: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function HomeScreen() {
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  
  // Estados para dashboards
  const [habitosHoy, setHabitosHoy] = useState<HabitoHoy[]>([]);
  const [estadisticasHabitos, setEstadisticasHabitos] = useState<EstadisticasHabitos>({
    total: 0, completados: 0, pendientes: 0, fecha: 'today'
  });
  const [misPlanes, setMisPlanes] = useState<MiPlan[]>([]);
  const [resumenUsuario, setResumenUsuario] = useState<ResumenUsuario>({
    racha_actual: 0, gemas_totales: 0, nivel_actual: 1
  });

  const API_BASE_URL = 'http://localhost:8000';

  // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================

  // Obtener usuario actual
  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/current-user`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentUserId(data.data.user_id);
        setUserName(data.data.nombre || "Usuario");
        return data.data.user_id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  // Cargar hábitos de hoy
  const loadHabitosHoy = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuario/${userId}/habitos/hoy`);
      const data = await response.json();

      if (data.success) {
        setHabitosHoy(data.data.habitos || []);
        setEstadisticasHabitos(data.data.estadisticas || {
          total: 0, completados: 0, pendientes: 0, fecha: 'today'
        });
      }
    } catch (error) {
      console.error('Error loading habitos:', error);
      setHabitosHoy([]);
    }
  };

  // Cargar mis planes
// Cargar mis planes
const loadMisPlanes = async (userId: number) => {
  try {
    console.log('Loading planes for userId:', userId); // NUEVO DEBUG
    const response = await fetch(`${API_BASE_URL}/api/planes/mis-planes/${userId}`);
    console.log('Response status:', response.status); // NUEVO DEBUG
    const data = await response.json();
    
    console.log('Planes response:', data); // NUEVO DEBUG

    if (data.success) {
      setMisPlanes(data.planes || []);
    }
  } catch (error) {
    console.error('Error loading planes:', error);
    setMisPlanes([]);
  }
};

  // Cargar datos de resumen del usuario (mock por ahora)
  const loadResumenUsuario = async () => {
    // Por ahora datos mock, después conectar con backend
    setResumenUsuario({
      racha_actual: 7,
      gemas_totales: 156,
      nivel_actual: 3
    });
  };

  // Función principal de carga
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const userId = await getCurrentUser();
      if (!userId) return;

      // Cargar todos los datos en paralelo
      await Promise.all([
        loadHabitosHoy(userId),
        loadMisPlanes(userId),
        loadResumenUsuario()
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Cargar datos al montar y al enfocar
  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        loadAllData();
      }
    }, [currentUserId])
  );

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días";
    if (hour < 18) return "¡Buenas tardes";
    return "¡Buenas noches";
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('es-ES', options);
  };

  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case 'fácil': return '#10B981';
      case 'intermedio': return '#F59E0B'; 
      case 'difícil': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // ============================================
  // COMPONENTES DE DASHBOARD
  // ============================================

  // Card de estadísticas principales
  const StatsCard = ({ title, value, subtitle, icon, colors }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    colors: string[];
  }) => (
    <LinearGradient colors={colors} style={styles.statsCard}>
      <View style={styles.statsCardContent}>
        <View style={styles.statsCardHeader}>
          <Ionicons name={icon as any} size={24} color="white" />
          <Text style={styles.statsCardValue}>{value}</Text>
        </View>
        <Text style={styles.statsCardTitle}>{title}</Text>
        <Text style={styles.statsCardSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );

  // Dashboard de resumen personal
  const ResumenPersonal = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tu progreso</Text>
      <View style={styles.statsRow}>
        <StatsCard
          title="Racha"
          value={`${resumenUsuario.racha_actual}`}
          subtitle="días consecutivos"
          icon="flame"
          colors={['#F97316', '#EA580C']}
        />
        <StatsCard
          title="Gemas"
          value={resumenUsuario.gemas_totales}
          subtitle="puntos ganados"
          icon="diamond"
          colors={['#8B5CF6', '#7C3AED']}
        />
        <StatsCard
          title="Nivel"
          value={resumenUsuario.nivel_actual}
          subtitle="experiencia"
          icon="trophy"
          colors={['#10B981', '#059669']}
        />
      </View>
    </View>
  );

  // Dashboard de hábitos
  const HabitosDashboard = () => {
    const progresoHoy = estadisticasHabitos.total > 0 
      ? (estadisticasHabitos.completados / estadisticasHabitos.total) * 100 
      : 0;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hábitos de hoy</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/habitos")}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>Ver todos</Text>
            <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {habitosHoy.length === 0 ? (
          // Estado vacío
          <TouchableOpacity 
            style={styles.emptyCard}
            onPress={() => router.push("/seccion_habitos/tiposHabitos")}
          >
            <Ionicons name="add-circle-outline" size={32} color="#8B5CF6" />
            <Text style={styles.emptyCardTitle}>No tienes hábitos</Text>
            <Text style={styles.emptyCardSubtitle}>Toca para agregar tu primer hábito</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Barra de progreso del día */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>
                  Progreso de hoy: {estadisticasHabitos.completados}/{estadisticasHabitos.total}
                </Text>
                <Text style={styles.progressPercentage}>{Math.round(progresoHoy)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[styles.progressBarFill, { width: `${progresoHoy}%` }]}
                />
              </View>
            </View>

            {/* Lista compacta de hábitos */}
            <View style={styles.habitsPreview}>
              {habitosHoy.slice(0, 3).map((habito) => (
                <View key={habito.habito_usuario_id} style={styles.habitPreviewItem}>
                  <View style={[
                    styles.habitPreviewCheck,
                    habito.completado_hoy && styles.habitPreviewCheckCompleted
                  ]}>
                    {habito.completado_hoy && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View style={styles.habitPreviewInfo}>
                    <Text style={styles.habitPreviewName}>{habito.nombre}</Text>
                    <Text style={styles.habitPreviewCategory}>{habito.categoria_nombre}</Text>
                  </View>
                  <Text style={styles.habitPreviewPoints}>+{habito.puntos_base}</Text>
                </View>
              ))}
              
              {habitosHoy.length > 3 && (
                <TouchableOpacity
                  style={styles.habitPreviewMore}
                  onPress={() => router.push("/(tabs)/habitos")}
                >
                  <Text style={styles.habitPreviewMoreText}>
                    +{habitosHoy.length - 3} más
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  // Dashboard de planes
  const PlanesDashboard = () => {
    const planesActivos = misPlanes.filter(plan => plan.estado === 'activo');
    const progresoPromedio = planesActivos.length > 0 
      ? planesActivos.reduce((sum, plan) => sum + plan.progreso_porcentaje, 0) / planesActivos.length
      : 0;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis planes</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/planes")}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>Ver todos</Text>
            <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {misPlanes.length === 0 ? (
          // Estado vacío
          <TouchableOpacity 
            style={styles.emptyCard}
            onPress={() => router.push("/seccion_planes/tiposPlanes")}
          >
            <Ionicons name="document-text-outline" size={32} color="#8B5CF6" />
            <Text style={styles.emptyCardTitle}>No tienes planes</Text>
            <Text style={styles.emptyCardSubtitle}>Toca para crear tu primer plan</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Estadísticas de planes */}
            <View style={styles.planesStatsContainer}>
              <View style={styles.planesStatCard}>
                <Text style={styles.planesStatNumber}>{planesActivos.length}</Text>
                <Text style={styles.planesStatLabel}>Activos</Text>
              </View>
              <View style={styles.planesStatCard}>
                <Text style={styles.planesStatNumber}>{Math.round(progresoPromedio)}%</Text>
                <Text style={styles.planesStatLabel}>Progreso</Text>
              </View>
              <View style={styles.planesStatCard}>
                <Text style={styles.planesStatNumber}>
                  {misPlanes.filter(plan => plan.estado === 'completado').length}
                </Text>
                <Text style={styles.planesStatLabel}>Completados</Text>
              </View>
            </View>

            {/* Lista de planes activos */}
            <View style={styles.planesPreview}>
              {planesActivos.slice(0, 2).map((plan) => (
                <TouchableOpacity
                  key={plan.plan_usuario_id}
                  style={styles.planPreviewCard}
                  onPress={() => router.push(`/seccion_planes/seguimientoPlan?planUsuarioId=${plan.plan_usuario_id}` as any)}
                >
                  <View style={styles.planPreviewHeader}>
                    <Text style={styles.planPreviewTitle}>{plan.meta_principal}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(plan.dificultad) + '20' }
                    ]}>
                      <Text style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(plan.dificultad) }
                      ]}>
                        {plan.dificultad}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.planPreviewDescription} numberOfLines={2}>
                    {plan.descripcion}
                  </Text>
                  
                  {/* Barra de progreso del plan */}
                  <View style={styles.planProgressContainer}>
                    <View style={styles.planProgressBar}>
                      <View 
                        style={[
                          styles.planProgressFill,
                          { width: `${plan.progreso_porcentaje}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.planProgressText}>
                      {plan.progreso_porcentaje}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER DE BIENVENIDA */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}!</Text>
            <Text style={styles.userNameText}>{userName}</Text>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {/* TODO: Navegar a notificaciones */}}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* RESUMEN PERSONAL */}
        <ResumenPersonal />

        {/* DASHBOARD DE HÁBITOS */}
        <HabitosDashboard />

        {/* DASHBOARD DE PLANES */}
        <PlanesDashboard />

        {/* ACCIONES RÁPIDAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <Ionicons name="add-circle" size={20} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Nuevo hábito</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push("/seccion_planes/tiposPlanes")}
            >
              <Ionicons name="document-text" size={20} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Nuevo plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push("/(tabs)/perfil")}
            >
              <Ionicons name="person" size={20} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Mi perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espaciado final */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },

  // ========== HEADER DE BIENVENIDA ==========
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
    color: "#1F2937",
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#8B5CF6",
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textTransform: 'capitalize',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // ========== SECCIONES ==========
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: "#1F2937",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: '500',
    marginRight: 4,
  },

  // ========== CARDS DE ESTADÍSTICAS ==========
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
  },
  statsCardContent: {
    flex: 1,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  statsCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ========== DASHBOARD DE HÁBITOS ==========
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: "#374151",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#8B5CF6",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },

  habitsPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  habitPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  habitPreviewCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitPreviewCheckCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  habitPreviewInfo: {
    flex: 1,
  },
  habitPreviewName: {
    fontSize: 15,
    fontWeight: '500',
    color: "#374151",
  },
  habitPreviewCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  habitPreviewPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: "#8B5CF6",
  },
  habitPreviewMore: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  habitPreviewMoreText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: '500',
  },

  // ========== DASHBOARD DE PLANES ==========
  planesStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planesStatCard: {
    alignItems: 'center',
  },
  planesStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: "#8B5CF6",
  },
  planesStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  planesPreview: {
    gap: 12,
  },
  planPreviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  planPreviewDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  planProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  planProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: "#374151",
    minWidth: 35,
    textAlign: 'right',
  },

  // ========== ESTADO VACÍO ==========
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: "#374151",
    marginTop: 8,
  },
  emptyCardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: 'center',
    marginTop: 4,
  },

  // ========== ACCIONES RÁPIDAS ==========
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: "#374151",
    marginTop: 8,
    textAlign: 'center',
  },
});