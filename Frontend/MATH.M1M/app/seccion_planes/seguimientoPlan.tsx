import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";

interface TareaDiaria {
  tarea_usuario_id: number;
  descripcion: string;
  dia_relativo: number;
  completada: boolean;
  fecha_completado: string | null;
  fase_nombre: string;
  fase_descripcion: string;
}

interface DailyProgress {
  dia_actual: number;
  total_dias: number;
  progreso_general: number;
  tareas_hoy: TareaDiaria[];
  fase_actual: string;
  fase_descripcion: string;
}

export default function SeguimientoPlanScreen() {
  const router = useRouter();
  const { planUsuarioId, titulo } = useLocalSearchParams();
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingTask, setTogglingTask] = useState<number | null>(null);

  const API_BASE_URL = "http://localhost:8000";

  const fetchTareasDiarias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/planes/tareas-diarias/${planUsuarioId}`);
      const data = await response.json();
      if (data.success) {
        setDailyProgress(data.data);
      }
    } catch (error) {
      console.error("Error fetching tareas:", error);
      Alert.alert("Error", "Could not load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleTarea = async (tareaUsuarioId: number) => {
    if (togglingTask) return;
    setTogglingTask(tareaUsuarioId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/planes/marcar-tarea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarea_usuario_id: tareaUsuarioId }),
      });

      const result = await response.json();

      if (result.success) {
        setDailyProgress((prev) => {
          if (!prev) return prev;
          const updatedTareas = prev.tareas_hoy.map((tarea) =>
            tarea.tarea_usuario_id === tareaUsuarioId
              ? { ...tarea, completada: result.data.completada }
              : tarea
          );
          const completedCount = updatedTareas.filter((t) => t.completada).length;
          const newProgress = Math.round((completedCount / updatedTareas.length) * 100);
          return { ...prev, tareas_hoy: updatedTareas, progreso_general: newProgress };
        });
      } else {
        Alert.alert("Error", "Could not update task");
      }
    } catch (error) {
      Alert.alert("Error", "Connection error");
    } finally {
      setTogglingTask(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTareasDiarias();
  };

  useEffect(() => {
    if (planUsuarioId) {
      fetchTareasDiarias();
    }
  }, [planUsuarioId]);

  useFocusEffect(
    useCallback(() => {
      if (planUsuarioId) {
        fetchTareasDiarias();
      }
    }, [planUsuarioId])
  );

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/planes");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dailyProgress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
          <Text style={styles.loadingText}>Could not load plan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedToday = dailyProgress.tareas_hoy.filter((t) => t.completada).length;
  const totalToday = dailyProgress.tareas_hoy.length;
  const allCompleted = completedToday === totalToday && totalToday > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titulo ? decodeURIComponent(titulo as string) : "Plan Progress"}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressCardGradient}
          >
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressValue}>{dailyProgress.progreso_general}%</Text>
              </View>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>
                  Day {dailyProgress.dia_actual}/{dailyProgress.total_dias}
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${dailyProgress.progreso_general}%` },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Current Phase */}
        <View style={styles.phaseCard}>
          <View style={styles.phaseIcon}>
            <Ionicons name="layers" size={20} color={colors.primary[600]} />
          </View>
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseLabel}>Current Phase</Text>
            <Text style={styles.phaseName}>{dailyProgress.fase_actual}</Text>
            {dailyProgress.fase_descripcion && (
              <Text style={styles.phaseDescription}>{dailyProgress.fase_descripcion}</Text>
            )}
          </View>
        </View>

        {/* Today's Tasks */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <Text style={styles.tasksCount}>
              {completedToday}/{totalToday} completed
            </Text>
          </View>

          {dailyProgress.tareas_hoy.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={48} color={colors.secondary[500]} />
              <Text style={styles.emptyTitle}>No tasks for today</Text>
              <Text style={styles.emptySubtitle}>Come back tomorrow for new tasks</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {dailyProgress.tareas_hoy.map((tarea) => (
                <TouchableOpacity
                  key={tarea.tarea_usuario_id}
                  style={[styles.taskCard, tarea.completada && styles.taskCardCompleted]}
                  activeOpacity={0.8}
                  onPress={() => toggleTarea(tarea.tarea_usuario_id)}
                  disabled={togglingTask === tarea.tarea_usuario_id}
                >
                  <View
                    style={[styles.taskCheckbox, tarea.completada && styles.taskCheckboxCompleted]}
                  >
                    {togglingTask === tarea.tarea_usuario_id ? (
                      <ActivityIndicator size="small" color={colors.neutral[0]} />
                    ) : tarea.completada ? (
                      <Ionicons name="checkmark" size={16} color={colors.neutral[0]} />
                    ) : null}
                  </View>
                  <View style={styles.taskContent}>
                    <Text
                      style={[styles.taskText, tarea.completada && styles.taskTextCompleted]}
                    >
                      {tarea.descripcion}
                    </Text>
                    {tarea.completada && tarea.fecha_completado && (
                      <Text style={styles.taskCompletedTime}>
                        Completed at{" "}
                        {new Date(tarea.fecha_completado).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Completion Message */}
        {allCompleted && (
          <View style={styles.completionCard}>
            <LinearGradient
              colors={colors.gradients.secondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completionGradient}
            >
              <View style={styles.completionIcon}>
                <Ionicons name="trophy" size={28} color={colors.neutral[0]} />
              </View>
              <Text style={styles.completionTitle}>Great job! 🎉</Text>
              <Text style={styles.completionText}>
                You've completed all tasks for today. Keep up the amazing work!
              </Text>
            </LinearGradient>
          </View>
        )}

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
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing[3],
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  progressCard: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[5],
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  progressCardGradient: {
    padding: spacing[5],
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  progressLabel: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing[1],
  },
  progressValue: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  dayBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  dayBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  progressBarContainer: {
    marginTop: spacing[2],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.neutral[0],
    borderRadius: 4,
  },
  phaseCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    ...shadows.sm,
  },
  phaseIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  phaseInfo: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  phaseName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  phaseDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  tasksSection: {
    marginBottom: spacing[6],
  },
  tasksSectionHeader: {
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
  tasksCount: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  tasksList: {
    gap: spacing[3],
  },
  taskCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    ...shadows.sm,
  },
  taskCardCompleted: {
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing[3],
    justifyContent: "center",
    alignItems: "center",
  },
  taskCheckboxCompleted: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[800],
    lineHeight: 22,
  },
  taskTextCompleted: {
    color: colors.secondary[700],
  },
  taskCompletedTime: {
    fontSize: typography.size.xs,
    color: colors.secondary[600],
    marginTop: spacing[1],
  },
  completionCard: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[4],
    ...shadows.md,
    shadowColor: colors.secondary[600],
  },
  completionGradient: {
    padding: spacing[6],
    alignItems: "center",
  },
  completionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  completionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
  },
  completionText: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 20,
  },
});
