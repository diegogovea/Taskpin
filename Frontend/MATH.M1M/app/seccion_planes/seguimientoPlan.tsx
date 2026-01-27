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
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/modals/ConfirmModal";

interface TareaDiaria {
  tarea_id: number;
  tarea_usuario_id: number | null;
  titulo: string;
  descripcion: string;
  tipo: string;
  es_diaria: boolean;
  completada: boolean;
  hora_completada: string | null;
}

interface FaseActual {
  objetivo_id: number;
  titulo: string;
  descripcion: string;
  orden_fase: number;
  duracion_dias: number;
}

interface DailyProgress {
  plan_usuario_id: number;
  meta_principal: string;
  dificultad: string;
  fecha: string;
  dias_transcurridos: number;
  fase_actual: FaseActual;
  tareas: TareaDiaria[];
}

export default function SeguimientoPlanScreen() {
  const router = useRouter();
  const { planUsuarioId, titulo } = useLocalSearchParams();
  const { user, authFetch } = useAuth();
  
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingTask, setTogglingTask] = useState<number | null>(null);
  
  // Estados para gestión del plan
  const [estadoPlan, setEstadoPlan] = useState<string>("activo");
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<"pausar" | "reanudar" | "cancelar" | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const fetchTareasDiarias = async () => {
    try {
      const response = await authFetch(`/api/planes/tareas-diarias/${planUsuarioId}`);
      const data = await response.json();
      
      // El backend devuelve directamente el objeto, no { success, data }
      if (data && data.plan_usuario_id) {
        setDailyProgress(data);
      } else if (data.success && data.data) {
        // Fallback por si se cambia el formato
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

  // Obtener el estado actual del plan
  const fetchEstadoPlan = async () => {
    if (!user?.user_id) return;
    try {
      const response = await authFetch(`/api/planes/mis-planes/${user.user_id}`);
      const data = await response.json();
      if (data.success && data.planes) {
        const planActual = data.planes.find(
          (p: any) => p.plan_usuario_id === Number(planUsuarioId)
        );
        if (planActual) {
          setEstadoPlan(planActual.estado || "activo");
        }
      }
    } catch (error) {
      console.error("Error fetching estado plan:", error);
    }
  };

  // Cambiar estado del plan
  const cambiarEstadoPlan = async (nuevoEstado: string) => {
    setProcesandoAccion(true);
    try {
      const response = await authFetch(`/api/planes/${planUsuarioId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await response.json();
      
      if (data.success) {
        setEstadoPlan(nuevoEstado);
        setShowConfirmModal(false);
        setAccionPendiente(null);
        
        if (nuevoEstado === "cancelado") {
          Alert.alert("Plan Cancelled", "The plan has been cancelled.", [
            { text: "OK", onPress: () => router.replace("/(tabs)/planes") }
          ]);
        } else if (nuevoEstado === "pausado") {
          Alert.alert("Plan Paused", "You can resume this plan anytime.");
        } else if (nuevoEstado === "activo") {
          Alert.alert("Plan Resumed", "Your plan is active again!");
          fetchTareasDiarias();
        }
      } else {
        Alert.alert("Error", data.message || "Could not update plan status");
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
      Alert.alert("Error", "Connection error");
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejar acción del menú
  const handleAccion = (accion: "pausar" | "reanudar" | "cancelar") => {
    setShowActionMenu(false);
    setAccionPendiente(accion);
    setShowConfirmModal(true);
  };

  // Confirmar acción
  const confirmarAccion = () => {
    if (!accionPendiente) return;
    const nuevoEstado = accionPendiente === "pausar" ? "pausado" 
                      : accionPendiente === "reanudar" ? "activo" 
                      : "cancelado";
    cambiarEstadoPlan(nuevoEstado);
  };

  // Obtener configuración del modal según la acción
  const getModalConfig = () => {
    switch (accionPendiente) {
      case "pausar":
        return {
          title: "Pause Plan?",
          message: "Your progress will be saved. You can resume this plan anytime.",
          confirmText: "Pause",
          icon: "pause-circle" as const,
          danger: false,
        };
      case "reanudar":
        return {
          title: "Resume Plan?",
          message: "Ready to continue your journey? Let's get back on track!",
          confirmText: "Resume",
          icon: "play-circle" as const,
          danger: false,
        };
      case "cancelar":
        return {
          title: "Cancel Plan?",
          message: "This action cannot be undone. All progress will be lost.",
          confirmText: "Cancel Plan",
          icon: "close-circle" as const,
          danger: true,
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "Confirm",
          icon: "help-circle" as const,
          danger: false,
        };
    }
  };

  const toggleTarea = async (tareaId: number) => {
    if (togglingTask) return;
    setTogglingTask(tareaId);

    try {
      const response = await authFetch(`/api/planes/marcar-tarea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          plan_usuario_id: Number(planUsuarioId),
          tarea_id: tareaId 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDailyProgress((prev) => {
          if (!prev) return prev;
          const updatedTareas = prev.tareas.map((tarea) =>
            tarea.tarea_id === tareaId
              ? { ...tarea, completada: result.completada }
              : tarea
          );
          return { ...prev, tareas: updatedTareas };
        });
      } else {
        Alert.alert("Error", result.message || "Could not update task");
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
      fetchEstadoPlan();
    }
  }, [planUsuarioId]);

  useFocusEffect(
    useCallback(() => {
      if (planUsuarioId) {
        fetchTareasDiarias();
        fetchEstadoPlan();
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

  const completedToday = dailyProgress.tareas.filter((t) => t.completada).length;
  const totalToday = dailyProgress.tareas.length;
  const allCompleted = completedToday === totalToday && totalToday > 0;
  const progresoCalculado = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

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
        {/* Menu Button - only show if plan is not completed or cancelled */}
        {estadoPlan !== "completado" && estadoPlan !== "cancelado" ? (
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setShowActionMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Banner for Paused/Cancelled Plans */}
        {estadoPlan === "pausado" && (
          <View style={styles.statusBanner}>
            <View style={[styles.statusBannerIcon, { backgroundColor: colors.accent.amber + '20' }]}>
              <Ionicons name="pause-circle" size={24} color={colors.accent.amber} />
            </View>
            <View style={styles.statusBannerContent}>
              <Text style={styles.statusBannerTitle}>Plan Paused</Text>
              <Text style={styles.statusBannerText}>Your progress is saved. Resume anytime!</Text>
            </View>
            <TouchableOpacity 
              style={styles.statusBannerButton}
              onPress={() => handleAccion("reanudar")}
            >
              <Text style={styles.statusBannerButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        {estadoPlan === "cancelado" && (
          <View style={[styles.statusBanner, { backgroundColor: colors.semantic.error + '10' }]}>
            <View style={[styles.statusBannerIcon, { backgroundColor: colors.semantic.error + '20' }]}>
              <Ionicons name="close-circle" size={24} color={colors.semantic.error} />
            </View>
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerTitle, { color: colors.semantic.error }]}>
                Plan Cancelled
              </Text>
              <Text style={styles.statusBannerText}>This plan is no longer active</Text>
            </View>
          </View>
        )}

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
                <Text style={styles.progressLabel}>Today's Progress</Text>
                <Text style={styles.progressValue}>{progresoCalculado}%</Text>
              </View>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>
                  Day {dailyProgress.dias_transcurridos}
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progresoCalculado}%` },
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
            <Text style={styles.phaseName}>{dailyProgress.fase_actual.titulo}</Text>
            {dailyProgress.fase_actual.descripcion && (
              <Text style={styles.phaseDescription}>{dailyProgress.fase_actual.descripcion}</Text>
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

          {dailyProgress.tareas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={48} color={colors.secondary[500]} />
              <Text style={styles.emptyTitle}>No tasks for today</Text>
              <Text style={styles.emptySubtitle}>Come back tomorrow for new tasks</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {dailyProgress.tareas.map((tarea) => (
                <TouchableOpacity
                  key={tarea.tarea_id}
                  style={[styles.taskCard, tarea.completada && styles.taskCardCompleted]}
                  activeOpacity={0.8}
                  onPress={() => toggleTarea(tarea.tarea_id)}
                  disabled={togglingTask === tarea.tarea_id}
                >
                  <View
                    style={[styles.taskCheckbox, tarea.completada && styles.taskCheckboxCompleted]}
                  >
                    {togglingTask === tarea.tarea_id ? (
                      <ActivityIndicator size="small" color={colors.neutral[0]} />
                    ) : tarea.completada ? (
                      <Ionicons name="checkmark" size={16} color={colors.neutral[0]} />
                    ) : null}
                  </View>
                  <View style={styles.taskContent}>
                    <Text
                      style={[styles.taskText, tarea.completada && styles.taskTextCompleted]}
                    >
                      {tarea.titulo}
                    </Text>
                    {tarea.descripcion && (
                      <Text style={styles.taskDescription}>{tarea.descripcion}</Text>
                    )}
                    {tarea.completada && tarea.hora_completada && (
                      <Text style={styles.taskCompletedTime}>
                        Completed at{" "}
                        {new Date(`2000-01-01T${tarea.hora_completada}`).toLocaleTimeString("en-US", {
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

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <Pressable 
          style={styles.actionMenuOverlay} 
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle}>Plan Options</Text>
            </View>
            
            {estadoPlan === "activo" && (
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => handleAccion("pausar")}
              >
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.accent.amber + '15' }]}>
                  <Ionicons name="pause-circle" size={22} color={colors.accent.amber} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={styles.actionMenuItemText}>Pause Plan</Text>
                  <Text style={styles.actionMenuItemSubtext}>Take a break, resume anytime</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {estadoPlan === "pausado" && (
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => handleAccion("reanudar")}
              >
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.secondary[500] + '15' }]}>
                  <Ionicons name="play-circle" size={22} color={colors.secondary[500]} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={styles.actionMenuItemText}>Resume Plan</Text>
                  <Text style={styles.actionMenuItemSubtext}>Continue your journey</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {(estadoPlan === "activo" || estadoPlan === "pausado") && (
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => handleAccion("cancelar")}
              >
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.semantic.error + '15' }]}>
                  <Ionicons name="close-circle" size={22} color={colors.semantic.error} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={[styles.actionMenuItemText, { color: colors.semantic.error }]}>
                    Cancel Plan
                  </Text>
                  <Text style={styles.actionMenuItemSubtext}>This cannot be undone</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.actionMenuCloseButton}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={styles.actionMenuCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        title={getModalConfig().title}
        message={getModalConfig().message}
        confirmText={getModalConfig().confirmText}
        cancelText="Go Back"
        icon={getModalConfig().icon}
        danger={getModalConfig().danger}
        isLoading={procesandoAccion}
        onConfirm={confirmarAccion}
        onCancel={() => {
          setShowConfirmModal(false);
          setAccionPendiente(null);
        }}
      />
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
  taskDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
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
  // Status Banner Styles
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent.amber + '10',
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  statusBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBannerContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  statusBannerTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.accent.amber,
  },
  statusBannerText: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    marginTop: 2,
  },
  statusBannerButton: {
    backgroundColor: colors.accent.amber,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
  },
  statusBannerButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  // Menu Button
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  // Action Menu Styles
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  actionMenuContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingBottom: spacing[8],
  },
  actionMenuHeader: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  actionMenuTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
    textAlign: "center",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
  },
  actionMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  actionMenuTextContainer: {
    flex: 1,
  },
  actionMenuItemText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[800],
  },
  actionMenuItemSubtext: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  actionMenuCloseButton: {
    marginTop: spacing[2],
    marginHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
  },
  actionMenuCloseText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[600],
  },
});
