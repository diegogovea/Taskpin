// Frontend/MATH.M1M/app/(tabs)/planes.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// Interfaces
interface MiPlan {
  plan_usuario_id: number;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  estado: 'activo' | 'pausado' | 'completado' | 'cancelado';
  progreso_porcentaje: number;
  meta_principal: string;
  descripcion: string;
  dificultad: 'fácil' | 'intermedio' | 'difícil';
  imagen: string | null;
}

export default function PlanesScreen() {
  const router = useRouter();
  const [planes, setPlanes] = useState<MiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch planes del usuario
  const fetchMisPlanes = async () => {
    try {
      setError(null);
      
      // Obtener user_id del usuario actual
      const getCurrentUser = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/current-user`);
          const data = await response.json();
          
          console.log('Current user response in planes:', data); // DEBUG
          
          if (data.success) {
            return data.data.user_id;
          }
          return null;
        } catch (error) {
          console.error('Error getting current user:', error);
          return null;
        }
      };

      const userId = await getCurrentUser();
      if (!userId) {
        setError('No se pudo obtener el usuario actual');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/planes/mis-planes/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPlanes(data.planes);
      } else {
        setError('Error al cargar tus planes');
      }
    } catch (error) {
      console.error('Error fetching mis planes:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchMisPlanes();
  };

  useEffect(() => {
    fetchMisPlanes();
  }, []);

  // Navegar al seguimiento del plan
  const navigateToSeguimiento = (planUsuarioId: number, metaPrincipal: string) => {
    console.log(`Navegando al seguimiento del plan ${planUsuarioId}`);
    // TODO: Crear pantalla de seguimiento
    router.push(`/seccion_planes/seguimientoPlan?planUsuarioId=${planUsuarioId}&titulo=${encodeURIComponent(metaPrincipal)}` as any);
  };

  // Navegar a agregar nuevo plan
  const navigateToAgregarPlan = () => {
    router.push('/seccion_planes/tiposPlanes' as any);
  };

  // Obtener color por estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return '#10B981';
      case 'pausado': return '#F59E0B';
      case 'completado': return '#8B5CF6';
      case 'cancelado': return '#EF4444';
      default: return '#6B7280';
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

  // Calcular días restantes
  const getDiasRestantes = (fechaObjetivo: string | null): number | null => {
    if (!fechaObjetivo) return null;
    
    const hoy = new Date();
    const objetivo = new Date(fechaObjetivo);
    const diferencia = Math.ceil((objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    return diferencia > 0 ? diferencia : 0;
  };

  // Componente para renderizar un plan
  const PlanCard = ({ plan }: { plan: MiPlan }) => {
    const estadoColor = getEstadoColor(plan.estado);
    const difficultyColor = getDifficultyColor(plan.dificultad);
    const diasRestantes = getDiasRestantes(plan.fecha_objetivo);

    return (
      <TouchableOpacity
        style={styles.planCard}
        activeOpacity={0.8}
        onPress={() => navigateToSeguimiento(plan.plan_usuario_id, plan.meta_principal)}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.planCardGradient}
        >
          {/* Header del plan */}
          <View style={styles.planHeader}>
            <View style={styles.planTitleContainer}>
              <Text style={styles.planTitle} numberOfLines={2}>
                {plan.meta_principal}
              </Text>
              <View style={styles.planBadges}>
                <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor}20` }]}>
                  <Text style={[styles.estadoText, { color: estadoColor }]}>
                    {plan.estado}
                  </Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
                  <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                    {plan.dificultad}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </View>

          {/* Descripción */}
          <Text style={styles.planDescription} numberOfLines={2}>
            {plan.descripcion}
          </Text>

          {/* Progreso */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso</Text>
              <Text style={styles.progressPercentage}>
                {plan.progreso_porcentaje}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={[
                    styles.progressBarFill,
                    { width: `${plan.progreso_porcentaje}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Footer con información adicional */}
          <View style={styles.planFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.footerText}>
                Inicio: {new Date(plan.fecha_inicio).toLocaleDateString('es-ES')}
              </Text>
            </View>
            {diasRestantes !== null && (
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.footerText}>
                  {diasRestantes} días restantes
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando tus planes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMisPlanes}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {planes.length === 0 && !error ? (
          // Estado vacío (como el código original pero mejorado)
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-outline" size={64} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No tienes ningún plan</Text>
            <Text style={styles.emptyMessage}>
              Crea uno nuevo para empezar tu camino hacia tus objetivos
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={navigateToAgregarPlan}
            >
              <Text style={styles.createButtonText}>Crear plan nuevo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Lista de planes
          <View style={styles.planesContainer}>
            {/* Estadísticas rápidas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{planes.length}</Text>
                <Text style={styles.statLabel}>Planes activos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {Math.round(
                    planes.reduce((sum, plan) => sum + plan.progreso_porcentaje, 0) / 
                    planes.length || 0
                  )}%
                </Text>
                <Text style={styles.statLabel}>Progreso promedio</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {planes.filter(plan => plan.estado === 'completado').length}
                </Text>
                <Text style={styles.statLabel}>Completados</Text>
              </View>
            </View>

            {planes.map((plan) => (
              <PlanCard key={plan.plan_usuario_id} plan={plan} />
            ))}

            {/* Botón para agregar más planes */}
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={navigateToAgregarPlan}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.addMoreButtonGradient}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.addMoreButtonText}>Agregar otro plan</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    backgroundColor: '#F5F5F5', // Mantener fondo original
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
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Empty state (manteniendo estilo original)
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  
  // Botón crear (manteniendo estilo original)
  createButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Planes content
  planesContainer: {
    padding: 20,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Plan cards
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitleContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  planBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Progress
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressBarContainer: {
    height: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // Footer
  planFooter: {
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Add more button
  addMoreButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addMoreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addMoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});