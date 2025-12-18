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
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");

// Interfaces
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
  estado: "activo" | "pausado" | "completado" | "cancelado";
  progreso_porcentaje: number;
  meta_principal: string;
  descripcion: string;
  dificultad: "fácil" | "intermedio" | "difícil";
}

interface ResumenUsuario {
  racha_actual: number;
  gemas_totales: number;
  nivel_actual: number;
}

export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [habitosHoy, setHabitosHoy] = useState<HabitoHoy[]>([]);
  const [estadisticasHabitos, setEstadisticasHabitos] = useState<EstadisticasHabitos>({
    total: 0,
    completados: 0,
    pendientes: 0,
    fecha: "today",
  });
  const [misPlanes, setMisPlanes] = useState<MiPlan[]>([]);
  const [resumenUsuario, setResumenUsuario] = useState<ResumenUsuario>({
    racha_actual: 0,
    gemas_totales: 0,
    nivel_actual: 1,
  });

  const API_BASE_URL = "http://localhost:8000";

  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/current-user`);
      const data = await response.json();
      if (data.success) {
        setCurrentUserId(data.data.user_id);
        setUserName(data.data.nombre || "User");
        return data.data.user_id;
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  const loadHabitosHoy = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuario/${userId}/habitos/hoy`);
      const data = await response.json();
      if (data.success) {
        setHabitosHoy(data.data.habitos || []);
        setEstadisticasHabitos(
          data.data.estadisticas || { total: 0, completados: 0, pendientes: 0, fecha: "today" }
        );
      }
    } catch (error) {
      console.error("Error loading habitos:", error);
      setHabitosHoy([]);
    }
  };

  const loadMisPlanes = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/planes/mis-planes/${userId}`);
      const data = await response.json();
      if (data.success) {
        setMisPlanes(data.planes || []);
      }
    } catch (error) {
      console.error("Error loading planes:", error);
      setMisPlanes([]);
    }
  };

  const loadResumenUsuario = async () => {
    setResumenUsuario({
      racha_actual: 7,
      gemas_totales: 156,
      nivel_actual: 3,
    });
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUser();
      if (!userId) return;
      await Promise.all([loadHabitosHoy(userId), loadMisPlanes(userId), loadResumenUsuario()]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
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

  // Stats Card Component
  const StatCard = ({
    icon,
    value,
    label,
    gradient,
  }: {
    icon: string;
    value: string | number;
    label: string;
    gradient: string[];
  }) => (
    <View style={styles.statCard}>
      <LinearGradient colors={gradient} style={styles.statCardGradient}>
        <Ionicons name={icon as any} size={24} color={colors.neutral[0]} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );

  // Progress Ring Component
  const ProgressRing = ({ progress, size = 60 }: { progress: number; size?: number }) => {
    const strokeWidth = 6;
    const center = size / 2;
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference * (1 - progress / 100);

    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.progressRingBg, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[styles.progressRingInner, { width: size - 12, height: size - 12, borderRadius: (size - 12) / 2 }]}>
            <Text style={styles.progressRingText}>{progress}%</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progresoHoy =
    estadisticasHabitos.total > 0
      ? Math.round((estadisticasHabitos.completados / estadisticasHabitos.total) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName.split(" ")[0]}</Text>
            <Text style={styles.date}>{getCurrentDate()}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.neutral[700]} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="flame"
            value={resumenUsuario.racha_actual}
            label="Day streak"
            gradient={["#F97316", "#EA580C"]}
          />
          <StatCard
            icon="diamond"
            value={resumenUsuario.gemas_totales}
            label="Points"
            gradient={colors.gradients.primary}
          />
          <StatCard
            icon="trophy"
            value={`Lv.${resumenUsuario.nivel_actual}`}
            label="Level"
            gradient={colors.gradients.secondary}
          />
        </View>

        {/* Today's Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={styles.progressCardTitle}>Today's Progress</Text>
              <Text style={styles.progressCardSubtitle}>
                {estadisticasHabitos.completados} of {estadisticasHabitos.total} habits completed
              </Text>
            </View>
            <ProgressRing progress={progresoHoy} />
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progresoHoy}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Habits</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(tabs)/habitos")}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {habitosHoy.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons name="add-circle-outline" size={32} color={colors.primary[600]} />
              </View>
              <Text style={styles.emptyCardTitle}>No habits yet</Text>
              <Text style={styles.emptyCardSubtitle}>Tap to add your first habit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.habitsList}>
              {habitosHoy.slice(0, 3).map((habito) => (
                <View key={habito.habito_usuario_id} style={styles.habitItem}>
                  <View
                    style={[
                      styles.habitCheckbox,
                      habito.completado_hoy && styles.habitCheckboxCompleted,
                    ]}
                  >
                    {habito.completado_hoy && (
                      <Ionicons name="checkmark" size={14} color={colors.neutral[0]} />
                    )}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[styles.habitName, habito.completado_hoy && styles.habitNameCompleted]}
                    >
                      {habito.nombre}
                    </Text>
                    <Text style={styles.habitCategory}>{habito.categoria_nombre}</Text>
                  </View>
                  <View style={styles.habitPoints}>
                    <Ionicons name="diamond-outline" size={12} color={colors.primary[500]} />
                    <Text style={styles.habitPointsText}>+{habito.puntos_base}</Text>
                  </View>
                </View>
              ))}
              {habitosHoy.length > 3 && (
                <TouchableOpacity
                  style={styles.moreHabitsButton}
                  onPress={() => router.push("/(tabs)/habitos")}
                >
                  <Text style={styles.moreHabitsText}>+{habitosHoy.length - 3} more habits</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Plans Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Plans</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(tabs)/planes")}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {misPlanes.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => router.push("/seccion_planes/tiposPlanes")}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={32} color={colors.primary[600]} />
              </View>
              <Text style={styles.emptyCardTitle}>No plans yet</Text>
              <Text style={styles.emptyCardSubtitle}>Tap to create your first plan</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.plansList}>
              {misPlanes
                .filter((p) => p.estado === "activo")
                .slice(0, 2)
                .map((plan) => (
                  <TouchableOpacity
                    key={plan.plan_usuario_id}
                    style={styles.planCard}
                    onPress={() =>
                      router.push(
                        `/seccion_planes/seguimientoPlan?planUsuarioId=${plan.plan_usuario_id}` as any
                      )
                    }
                  >
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planTitle} numberOfLines={1}>
                        {plan.meta_principal}
                      </Text>
                      <View
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: getDifficultyColor(plan.dificultad) + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.difficultyText, { color: getDifficultyColor(plan.dificultad) }]}
                        >
                          {plan.dificultad}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.planDescription} numberOfLines={2}>
                      {plan.descripcion}
                    </Text>
                    <View style={styles.planProgress}>
                      <View style={styles.planProgressBar}>
                        <View
                          style={[styles.planProgressFill, { width: `${plan.progreso_porcentaje}%` }]}
                        />
                      </View>
                      <Text style={styles.planProgressText}>{plan.progreso_porcentaje}%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="add" size={22} color={colors.primary[600]} />
              </View>
              <Text style={styles.quickActionText}>New Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push("/seccion_planes/tiposPlanes")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[100] }]}>
                <Ionicons name="document-text" size={20} color={colors.secondary[600]} />
              </View>
              <Text style={styles.quickActionText}>New Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push("/(tabs)/perfil")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accent.amber + "20" }]}>
                <Ionicons name="stats-chart" size={20} color={colors.accent.amber} />
              </View>
              <Text style={styles.quickActionText}>Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding for Tab Bar */}
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
    fontSize: typography.size.base,
    color: colors.neutral[500],
    marginTop: spacing[4],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[6],
  },
  greeting: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  userName: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  date: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[0],
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.error,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  statCardGradient: {
    padding: spacing[4],
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginTop: spacing[2],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing[1],
  },
  progressCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    ...shadows.sm,
  },
  progressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  progressCardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  progressCardSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  progressRingBg: {
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  progressRingInner: {
    backgroundColor: colors.neutral[0],
    justifyContent: "center",
    alignItems: "center",
  },
  progressRingText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary[600],
  },
  progressBarContainer: {
    marginTop: spacing[2],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
    marginRight: spacing[1],
  },
  emptyCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[8],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: "dashed",
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  emptyCardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  emptyCardSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  habitsList: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  habitCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing[3],
    justifyContent: "center",
    alignItems: "center",
  },
  habitCheckboxCompleted: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[800],
    marginBottom: 2,
  },
  habitNameCompleted: {
    color: colors.neutral[500],
    textDecorationLine: "line-through",
  },
  habitCategory: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  habitPoints: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    gap: 4,
  },
  habitPointsText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  moreHabitsButton: {
    padding: spacing[3],
    alignItems: "center",
  },
  moreHabitsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  plansList: {
    gap: spacing[3],
  },
  planCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    ...shadows.sm,
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[2],
  },
  planTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginRight: spacing[2],
  },
  difficultyBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  difficultyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  planDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  planProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  planProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 3,
    overflow: "hidden",
  },
  planProgressFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  planProgressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    minWidth: 36,
    textAlign: "right",
  },
  quickActionsSection: {
    marginBottom: spacing[6],
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[4],
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: "center",
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  quickActionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[700],
  },
});
