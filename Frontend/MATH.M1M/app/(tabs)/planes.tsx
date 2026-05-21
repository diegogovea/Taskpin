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
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

interface MiPlan {
  plan_usuario_id: number;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  estado: "activo" | "pausado" | "completado" | "cancelado";
  progreso_porcentaje: number;
  meta_principal: string;
  descripcion: string;
  dificultad: "fácil" | "intermedio" | "difícil";
  imagen: string | null;
}

export default function PlanesScreen() {
  const router = useRouter();
  
  // ✅ Obtenemos user y authFetch del contexto
  const { user, isLoading: authLoading, authFetch } = useAuth();
  const { palette } = useTheme();
  
  const [planes, setPlanes] = useState<MiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  // ✅ Usa authFetch (incluye token automáticamente)
  const fetchMisPlanes = async () => {
    try {
      setError(null);

      if (!user?.user_id) {
        setError("Could not get current user");
        return;
      }

      const response = await authFetch(`/api/planes/mis-planes/${user.user_id}`);
      const data = await response.json();

      if (data.success) {
        setPlanes(data.planes);
      } else {
        setError("Error loading your plans");
      }
    } catch (error) {
      console.error("Error fetching mis planes:", error);
      setError("Connection error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMisPlanes();
  };

  // ✅ ACTUALIZADO: Carga cuando el usuario está disponible
  useEffect(() => {
    if (user?.user_id && !authLoading) {
    fetchMisPlanes();
    }
  }, [user?.user_id, authLoading]);

  const navigateToSeguimiento = (planUsuarioId: number, metaPrincipal: string) => {
    router.push(
      `/seccion_planes/seguimientoPlan?planUsuarioId=${planUsuarioId}&titulo=${encodeURIComponent(
        metaPrincipal
      )}` as any
    );
  };

  const navigateToAgregarPlan = () => {
    router.push("/seccion_planes/tiposPlanes" as any);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return colors.secondary[500];
      case "pausado":
        return colors.accent.amber;
      case "completado":
        return colors.primary[600];
      case "cancelado":
        return colors.semantic.error;
      default:
        return colors.neutral[500];
    }
  };

  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case "fácil":
        return colors.secondary[500];
      case "intermedio":
        return colors.accent.amber;
      case "difícil":
        return colors.semantic.error;
      default:
        return colors.neutral[500];
    }
  };

  const getDiasRestantes = (fechaObjetivo: string | null): number | null => {
    if (!fechaObjetivo) return null;
    const hoy = new Date();
    const objetivo = new Date(fechaObjetivo);
    const diferencia = Math.ceil((objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diferencia > 0 ? diferencia : 0;
  };

  const PlanCard = ({ plan }: { plan: MiPlan }) => {
    const estadoColor = getEstadoColor(plan.estado);
    const difficultyColor = getDifficultyColor(plan.dificultad);
    const diasRestantes = getDiasRestantes(plan.fecha_objetivo);

    return (
      <TouchableOpacity
        style={[styles.planCard, { backgroundColor: palette.surface }]}
        activeOpacity={0.8}
        onPress={() => navigateToSeguimiento(plan.plan_usuario_id, plan.meta_principal)}
      >
        <View style={styles.planHeader}>
          <View style={styles.planTitleSection}>
            <Text style={[styles.planTitle, { color: palette.heading }]} numberOfLines={2}>
              {plan.meta_principal}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: estadoColor + "15" }]}>
                <View style={[styles.badgeDot, { backgroundColor: estadoColor }]} />
                <Text style={[styles.badgeText, { color: estadoColor }]}>{plan.estado}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: difficultyColor + "15" }]}>
                <Text style={[styles.badgeText, { color: difficultyColor }]}>{plan.dificultad}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.iconSubtle} />
        </View>

        <Text style={[styles.planDescription, { color: palette.textMuted }]} numberOfLines={2}>
          {plan.descripcion}
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: palette.textMuted }]}>Progreso</Text>
            <Text style={styles.progressPercent}>{plan.progreso_porcentaje}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: palette.surfaceAlt }]}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${plan.progreso_porcentaje}%` }]}
            />
          </View>
        </View>

        <View style={styles.planFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={palette.textSubtle} />
            <Text style={[styles.footerText, { color: palette.textSubtle }]}>
              Iniciado {new Date(plan.fecha_inicio).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
            </Text>
          </View>
          {diasRestantes !== null && (
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color={palette.textSubtle} />
              <Text style={[styles.footerText, { color: palette.textSubtle }]}>{diasRestantes} días restantes</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={[styles.loadingText, { color: palette.textMuted }]}>Cargando tus planes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activePlans = planes.filter((p) => p.estado === "activo");
  const completedPlans = planes.filter((p) => p.estado === "completado");
  const pausedPlans = planes.filter((p) => p.estado === "pausado");
  const avgProgress =
    activePlans.length > 0
      ? Math.round(activePlans.reduce((sum, p) => sum + p.progreso_porcentaje, 0) / activePlans.length)
      : 0;

  // Conteos para los filtros
  const conteos: { [key: string]: number } = {
    todos: planes.length,
    activo: activePlans.length,
    pausado: pausedPlans.length,
    completado: completedPlans.length,
  };

  // Planes filtrados según el filtro seleccionado
  const planesFiltrados = filtroEstado === "todos" 
    ? planes 
    : planes.filter((p) => p.estado === filtroEstado);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: palette.heading }]}>Mis Planes</Text>
          <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>{planes.length} planes en total</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary[50] }]} onPress={navigateToAgregarPlan}>
          <Ionicons name="add" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMisPlanes}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {planes.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name="document-text-outline" size={48} color={palette.iconSubtle} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Sin planes aún</Text>
            <Text style={[styles.emptySubtitle, { color: palette.textMuted }]}>Crea tu primer plan para empezar a alcanzar tus metas</Text>
            <TouchableOpacity style={styles.createButton} onPress={navigateToAgregarPlan}>
              <LinearGradient colors={colors.gradients.primary} style={styles.createButtonGradient}>
                <Ionicons name="add-circle" size={20} color={colors.neutral[0]} />
                <Text style={styles.createButtonText}>Crear Nuevo Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsContainer}>
              {[
                { n: activePlans.length, label: 'Planes activos' },
                { n: `${avgProgress}%`, label: 'Progreso' },
                { n: completedPlans.length, label: 'Completados' },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: palette.surface }]}>
                  <Text style={styles.statNumber}>{s.n}</Text>
                  <Text style={[styles.statLabel, { color: palette.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
              {[
                { key: "todos", label: "Todos" },
                { key: "activo", label: "Activos" },
                { key: "pausado", label: "Pausados" },
                { key: "completado", label: "Completados" },
              ].map((filtro) => (
                <TouchableOpacity
                  key={filtro.key}
                  style={[
                    styles.filterChip,
                    { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                    filtroEstado === filtro.key && styles.filterChipActive,
                  ]}
                  onPress={() => setFiltroEstado(filtro.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: palette.textMuted },
                    filtroEstado === filtro.key && styles.filterChipTextActive,
                  ]}>
                    {filtro.label} ({conteos[filtro.key]})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Plans List */}
            <View style={styles.plansSection}>
              {planesFiltrados.length === 0 ? (
                <View style={styles.emptyFilterState}>
                  <Ionicons name="filter-outline" size={32} color={palette.iconSubtle} />
                  <Text style={[styles.emptyFilterText, { color: palette.textMuted }]}>Sin planes {filtroEstado}s</Text>
                </View>
              ) : (
                planesFiltrados.map((plan) => (
                  <PlanCard key={plan.plan_usuario_id} plan={plan} />
                ))
              )}
            </View>

            {/* Add More Button */}
            <TouchableOpacity style={styles.addMoreButton} onPress={navigateToAgregarPlan}>
              <LinearGradient colors={colors.gradients.primary} style={styles.addMoreButtonGradient}>
                <Ionicons name="add-circle" size={20} color={colors.neutral[0]} />
                <Text style={styles.addMoreButtonText}>Agregar Otro Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.semantic.error + "10",
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  retryButton: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[16],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[5],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: "center",
    marginBottom: spacing[6],
    paddingHorizontal: spacing[8],
  },
  createButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  createButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  filterContainer: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
  },
  filterChipTextActive: {
    color: colors.primary[600],
    fontWeight: typography.weight.semibold,
  },
  emptyFilterState: {
    alignItems: "center",
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  emptyFilterText: {
    fontSize: typography.size.base,
    color: colors.neutral[400],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: "center",
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  plansSection: {
    gap: spacing[4],
  },
  planCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
    ...shadows.sm,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing[3],
  },
  planTitleSection: {
    flex: 1,
  },
  planTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[2],
  },
  badges: {
    flexDirection: "row",
    gap: spacing[2],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    textTransform: "capitalize",
  },
  planDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  progressSection: {
    marginBottom: spacing[4],
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[600],
  },
  progressPercent: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary[600],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  planFooter: {
    flexDirection: "row",
    gap: spacing[4],
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  footerText: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
  },
  addMoreButton: {
    marginTop: spacing[6],
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  addMoreButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  addMoreButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
