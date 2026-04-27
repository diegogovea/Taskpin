import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import PlanTimeline from '../../components/ui/PlanTimeline';

// Interfaces
interface PlanInfo {
  plan_usuario_id: number;
  meta_principal: string;
  estado: string;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  dias_totales: number;
  dia_actual: number;
  dias_restantes: number;
  progreso_porcentaje: number;
}

interface Fase {
  objetivo_id: number;
  titulo: string;
  descripcion?: string;
  orden_fase: number;
  dia_inicio: number;
  dia_fin: number;
  duracion_dias: number;
  estado: 'completada' | 'en_progreso' | 'atrasada' | 'pendiente';
  porcentaje_completado: number;
  tareas_completadas: number;
  tareas_total: number;
}

interface TimelineData {
  success: boolean;
  plan_info: PlanInfo;
  fases: Fase[];
  total_fases: number;
}

export default function TimelinePlan() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const planUsuarioId = params.planUsuarioId as string;
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = async () => {
    try {
      setError(null);
      const response = await authFetch(`/api/planes/${planUsuarioId}/timeline`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.detail || 'Error al cargar la línea de tiempo');
      }
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError('No se pudo cargar la línea de tiempo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (planUsuarioId) {
      loadTimeline();
    }
  }, [planUsuarioId]);

  useFocusEffect(
    useCallback(() => {
      if (planUsuarioId) {
        loadTimeline();
      }
    }, [planUsuarioId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTimeline();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Contar fases por estado
  const getEstadoCounts = () => {
    if (!data?.fases) return { completadas: 0, enProgreso: 0, pendientes: 0 };
    
    return data.fases.reduce((acc, fase) => {
      if (fase.estado === 'completada') acc.completadas++;
      else if (fase.estado === 'en_progreso') acc.enProgreso++;
      else acc.pendientes++;
      return acc;
    }, { completadas: 0, enProgreso: 0, pendientes: 0 });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando línea de tiempo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Línea de Tiempo</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
          <Text style={styles.errorText}>{error || 'No se pudo cargar la línea de tiempo'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTimeline}>
            <Text style={styles.retryText}>Intentar de Nuevo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estadoCounts = getEstadoCounts();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Línea de Tiempo del Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Plan Info Card */}
        <View style={styles.planInfoCard}>
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.planInfoGradient}
          >
            <Text style={styles.planTitle}>{data.plan_info.meta_principal}</Text>
            <View style={styles.planDates}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Inicio</Text>
                <Text style={styles.dateValue}>{formatDate(data.plan_info.fecha_inicio)}</Text>
              </View>
              {data.plan_info.fecha_objetivo && (
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Objetivo</Text>
                  <Text style={styles.dateValue}>{formatDate(data.plan_info.fecha_objetivo)}</Text>
                </View>
              )}
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${data.plan_info.progreso_porcentaje}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{data.plan_info.progreso_porcentaje}%</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={styles.statValue}>{estadoCounts.completadas}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="play-circle" size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.statValue}>{estadoCounts.enProgreso}</Text>
            <Text style={styles.statLabel}>En Progreso</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.neutral[100] }]}>
              <Ionicons name="ellipse-outline" size={20} color={colors.neutral[500]} />
            </View>
            <Text style={styles.statValue}>{estadoCounts.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>

        {/* Timeline Component */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Línea de Tiempo Visual</Text>
          <PlanTimeline
            planInfo={data.plan_info}
            fases={data.fases}
            onFasePress={(faseId) => {
              // Podrías navegar a un detalle de fase en el futuro
              console.log('Fase pressed:', faseId);
            }}
          />
        </View>

        {/* Bottom Padding */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    marginTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    fontSize: typography.size.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  retryText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[4],
  },
  planInfoCard: {
    marginHorizontal: spacing[5],
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
    marginBottom: spacing[4],
  },
  planInfoGradient: {
    padding: spacing[5],
  },
  planTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[3],
  },
  planDates: {
    flexDirection: 'row',
    gap: spacing[6],
    marginBottom: spacing[4],
  },
  dateItem: {},
  dateLabel: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing[1],
  },
  dateValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    minWidth: 40,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  timelineSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
});
