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
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/modals/ConfirmModal";

// =====================
// INTERFACES
// =====================

interface ProgresoGeneral {
  dias_transcurridos: number;
  dias_totales: number;
  porcentaje: number;
}

interface FaseActual {
  objetivo_id: number;
  titulo: string;
  descripcion: string | null;
  orden_fase: number;
  total_fases: number;
  dia_en_fase: number;
  duracion_fase: number;
  porcentaje_fase: number;
}

interface TareaDiaria {
  tarea_id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  es_diaria: boolean;
  completada: boolean;
  hora_completada: string | null;
}

interface HabitoPlan {
  habito_usuario_id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  puntos: number;
  completado_hoy: boolean;
  hora_completado: string | null;
}

interface DashboardData {
  plan_usuario_id: number;
  meta_principal: string;
  dificultad: string;
  estado: string;
  fecha: string;
  progreso_general: ProgresoGeneral;
  fase_actual: FaseActual;
  tareas_hoy: TareaDiaria[];
  tareas_completadas: number;
  tareas_total: number;
  habitos_plan: HabitoPlan[];
  habitos_completados: number;
  habitos_total: number;
}

// =====================
// MAIN COMPONENT
// =====================

export default function SeguimientoPlanScreen() {
  const router = useRouter();
  const { planUsuarioId, titulo } = useLocalSearchParams();
  const { user, authFetch } = useAuth();
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingTask, setTogglingTask] = useState<number | null>(null);
  const [togglingHabit, setTogglingHabit] = useState<number | null>(null);
  
  // Estados para gestión del plan
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<"pausar" | "reanudar" | "cancelar" | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // =====================
  // FETCH DATA
  // =====================

  const fetchDashboard = async () => {
    try {
      const response = await authFetch(`/api/planes/${planUsuarioId}/hoy`);
      const data = await response.json();
      
      if (data && data.plan_usuario_id) {
        setDashboard(data);
      } else if (data.detail) {
        console.error("Error:", data.detail);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      Alert.alert("Error", "Could not load plan data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================
  // HANDLERS
  // =====================

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
        setShowConfirmModal(false);
        setAccionPendiente(null);
        
        if (nuevoEstado === "cancelado") {
          Alert.alert("Plan Cancelled", "The plan has been cancelled.", [
            { text: "OK", onPress: () => router.replace("/(tabs)/planes") }
          ]);
        } else if (nuevoEstado === "pausado") {
          Alert.alert("Plan Paused", "You can resume this plan anytime.");
          fetchDashboard();
        } else if (nuevoEstado === "activo") {
          Alert.alert("Plan Resumed", "Your plan is active again!");
          fetchDashboard();
        }
      } else {
        Alert.alert("Error", data.message || "Could not update plan status");
      }
    } catch (error) {
      Alert.alert("Error", "Connection error");
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleAccion = (accion: "pausar" | "reanudar" | "cancelar") => {
    setShowActionMenu(false);
    setAccionPendiente(accion);
    setShowConfirmModal(true);
  };

  const confirmarAccion = () => {
    if (!accionPendiente) return;
    const nuevoEstado = accionPendiente === "pausar" ? "pausado" 
                      : accionPendiente === "reanudar" ? "activo" 
                      : "cancelado";
    cambiarEstadoPlan(nuevoEstado);
  };

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
        return { title: "", message: "", confirmText: "Confirm", icon: "help-circle" as const, danger: false };
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
        setDashboard((prev) => {
          if (!prev) return prev;
          const updatedTareas = prev.tareas_hoy.map((tarea) =>
            tarea.tarea_id === tareaId
              ? { ...tarea, completada: result.completada }
              : tarea
          );
          const completadas = updatedTareas.filter(t => t.completada).length;
          return { 
            ...prev, 
            tareas_hoy: updatedTareas,
            tareas_completadas: completadas
          };
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

  const toggleHabito = async (habitoUsuarioId: number) => {
    if (togglingHabit || !user?.user_id) return;
    setTogglingHabit(habitoUsuarioId);

    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/habito/${habitoUsuarioId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.success) {
        setDashboard((prev) => {
          if (!prev) return prev;
          const updatedHabitos = prev.habitos_plan.map((habito) =>
            habito.habito_usuario_id === habitoUsuarioId
              ? { ...habito, completado_hoy: result.data?.completado ?? !habito.completado_hoy }
              : habito
          );
          const completados = updatedHabitos.filter(h => h.completado_hoy).length;
          return { 
            ...prev, 
            habitos_plan: updatedHabitos,
            habitos_completados: completados
          };
        });
      } else {
        Alert.alert("Error", result.message || "Could not update habit");
      }
    } catch (error) {
      Alert.alert("Error", "Connection error");
    } finally {
      setTogglingHabit(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/planes");
  };

  // =====================
  // EFFECTS
  // =====================

  useEffect(() => {
    if (planUsuarioId) {
      fetchDashboard();
    }
  }, [planUsuarioId]);

  useFocusEffect(
    useCallback(() => {
      if (planUsuarioId) {
        fetchDashboard();
      }
    }, [planUsuarioId])
  );

  // =====================
  // LOADING STATES
  // =====================

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

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
          <Text style={styles.loadingText}>Could not load plan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const estadoPlan = dashboard.estado;
  const allTasksCompleted = dashboard.tareas_completadas === dashboard.tareas_total && dashboard.tareas_total > 0;
  const allHabitsCompleted = dashboard.habitos_completados === dashboard.habitos_total && dashboard.habitos_total > 0;
  const allCompleted = allTasksCompleted && (dashboard.habitos_total === 0 || allHabitsCompleted);

  // =====================
  // RENDER
  // =====================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titulo ? decodeURIComponent(titulo as string) : dashboard.meta_principal}
          </Text>
        </View>
        {estadoPlan !== "completado" && estadoPlan !== "cancelado" ? (
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowActionMenu(true)}>
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
              <Text style={styles.statusBannerText}>Your progress is saved</Text>
            </View>
            <TouchableOpacity style={styles.statusBannerButton} onPress={() => handleAccion("reanudar")}>
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
              <Text style={[styles.statusBannerTitle, { color: colors.semantic.error }]}>Plan Cancelled</Text>
              <Text style={styles.statusBannerText}>This plan is no longer active</Text>
            </View>
          </View>
        )}

        {/* ===================== */}
        {/* PHASE BANNER (2D.3 + 2D.7) */}
        {/* ===================== */}
        <View style={styles.phaseBanner}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.phaseBannerGradient}
          >
            <View style={styles.phaseBannerHeader}>
              <View style={styles.phaseBadge}>
                <Text style={styles.phaseBadgeText}>
                  Phase {dashboard.fase_actual.orden_fase}/{dashboard.fase_actual.total_fases}
                </Text>
              </View>
              <View style={styles.dayBadge}>
                <Ionicons name="calendar-outline" size={14} color={colors.neutral[0]} />
                <Text style={styles.dayBadgeText}>Day {dashboard.progreso_general.dias_transcurridos}</Text>
              </View>
            </View>

            <Text style={styles.phaseBannerTitle}>{dashboard.fase_actual.titulo}</Text>
            {dashboard.fase_actual.descripcion && (
              <Text style={styles.phaseBannerSubtitle} numberOfLines={2}>
                {dashboard.fase_actual.descripcion}
              </Text>
            )}

            {/* Phase Progress Bar */}
            <View style={styles.phaseProgressContainer}>
              <View style={styles.phaseProgressInfo}>
                <Text style={styles.phaseProgressText}>
                  Day {dashboard.fase_actual.dia_en_fase} of {dashboard.fase_actual.duracion_fase}
                </Text>
                <Text style={styles.phaseProgressPercent}>{dashboard.fase_actual.porcentaje_fase}%</Text>
              </View>
              <View style={styles.phaseProgressBarBg}>
                <View 
                  style={[styles.phaseProgressBarFill, { width: `${dashboard.fase_actual.porcentaje_fase}%` }]} 
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push(`/seccion_planes/timelinePlan?planUsuarioId=${planUsuarioId}` as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="git-branch-outline" size={18} color={colors.primary[600]} />
            </View>
            <Text style={styles.quickActionText}>Timeline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => Alert.alert('Coming Soon', 'Plan statistics will be available in a future update.')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="stats-chart-outline" size={18} color={colors.secondary[600]} />
            </View>
            <Text style={styles.quickActionText}>Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => setShowActionMenu(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.neutral[100] }]}>
              <Ionicons name="settings-outline" size={18} color={colors.neutral[600]} />
            </View>
            <Text style={styles.quickActionText}>Options</Text>
          </TouchableOpacity>
        </View>

        {/* ===================== */}
        {/* TASKS SECTION (2D.4) */}
        {/* ===================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="checkbox-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {dashboard.tareas_completadas}/{dashboard.tareas_total}
              </Text>
            </View>
          </View>

          {dashboard.tareas_hoy.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={40} color={colors.secondary[400]} />
              <Text style={styles.emptyTitle}>No tasks for today</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {dashboard.tareas_hoy.map((tarea) => (
                <TouchableOpacity
                  key={tarea.tarea_id}
                  style={[styles.itemCard, tarea.completada && styles.itemCardCompleted]}
                  activeOpacity={0.8}
                  onPress={() => toggleTarea(tarea.tarea_id)}
                  disabled={togglingTask === tarea.tarea_id}
                >
                  <View style={[styles.itemCheckbox, tarea.completada && styles.itemCheckboxCompleted]}>
                    {togglingTask === tarea.tarea_id ? (
                      <ActivityIndicator size="small" color={colors.neutral[0]} />
                    ) : tarea.completada ? (
                      <Ionicons name="checkmark" size={16} color={colors.neutral[0]} />
                    ) : null}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemText, tarea.completada && styles.itemTextCompleted]}>
                      {tarea.titulo}
                    </Text>
                    {tarea.descripcion && (
                      <Text style={styles.itemDescription} numberOfLines={2}>{tarea.descripcion}</Text>
                    )}
                    {tarea.completada && tarea.hora_completada && (
                      <Text style={styles.itemTime}>✓ {tarea.hora_completada}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ===================== */}
        {/* HABITS SECTION (2D.5 + 2D.6) */}
        {/* ===================== */}
        {dashboard.habitos_plan.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="refresh" size={20} color={colors.secondary[600]} />
                <Text style={styles.sectionTitle}>Plan Habits</Text>
              </View>
              <View style={[styles.sectionBadge, { backgroundColor: colors.secondary[100] }]}>
                <Text style={[styles.sectionBadgeText, { color: colors.secondary[600] }]}>
                  {dashboard.habitos_completados}/{dashboard.habitos_total}
                </Text>
              </View>
            </View>

            <View style={styles.itemsList}>
              {dashboard.habitos_plan.map((habito) => (
                <TouchableOpacity
                  key={habito.habito_usuario_id}
                  style={[styles.habitCard, habito.completado_hoy && styles.habitCardCompleted]}
                  activeOpacity={0.8}
                  onPress={() => toggleHabito(habito.habito_usuario_id)}
                  disabled={togglingHabit === habito.habito_usuario_id}
                >
                  <View style={[styles.itemCheckbox, habito.completado_hoy && styles.habitCheckboxCompleted]}>
                    {togglingHabit === habito.habito_usuario_id ? (
                      <ActivityIndicator size="small" color={colors.neutral[0]} />
                    ) : habito.completado_hoy ? (
                      <Ionicons name="checkmark" size={16} color={colors.neutral[0]} />
                    ) : null}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemText, habito.completado_hoy && styles.habitTextCompleted]}>
                      {habito.nombre}
                    </Text>
                    <Text style={styles.habitCategory}>{habito.categoria}</Text>
                  </View>
                  <View style={styles.habitPoints}>
                    <Text style={styles.habitPointsText}>+{habito.puntos}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* No Habits Linked Message */}
        {dashboard.habitos_plan.length === 0 && (
          <View style={styles.noHabitsCard}>
            <Ionicons name="leaf-outline" size={24} color={colors.neutral[400]} />
            <Text style={styles.noHabitsText}>No habits linked to this plan</Text>
          </View>
        )}

        {/* Completion Card */}
        {allCompleted && (
          <View style={styles.completionCard}>
            <LinearGradient
              colors={colors.gradients.secondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completionGradient}
            >
              <Ionicons name="trophy" size={32} color={colors.neutral[0]} />
              <Text style={styles.completionTitle}>Great job today! 🎉</Text>
              <Text style={styles.completionText}>You've completed all tasks and habits</Text>
            </LinearGradient>
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal visible={showActionMenu} transparent animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
        <Pressable style={styles.actionMenuOverlay} onPress={() => setShowActionMenu(false)}>
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle}>Plan Options</Text>
            </View>
            
            {estadoPlan === "activo" && (
              <TouchableOpacity style={styles.actionMenuItem} onPress={() => handleAccion("pausar")}>
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
              <TouchableOpacity style={styles.actionMenuItem} onPress={() => handleAccion("reanudar")}>
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
              <TouchableOpacity style={styles.actionMenuItem} onPress={() => handleAccion("cancelar")}>
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.semantic.error + '15' }]}>
                  <Ionicons name="close-circle" size={22} color={colors.semantic.error} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={[styles.actionMenuItemText, { color: colors.semantic.error }]}>Cancel Plan</Text>
                  <Text style={styles.actionMenuItemSubtext}>This cannot be undone</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionMenuCloseButton} onPress={() => setShowActionMenu(false)}>
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
        onCancel={() => { setShowConfirmModal(false); setAccionPendiente(null); }}
      />
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================

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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
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

  // Status Banner
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

  // Phase Banner (2D.3 + 2D.7)
  phaseBanner: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[5],
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  phaseBannerGradient: {
    padding: spacing[5],
  },
  phaseBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  phaseBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  phaseBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    gap: 4,
  },
  dayBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  phaseBannerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
  },
  phaseBannerSubtitle: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  phaseProgressContainer: {
    marginTop: spacing[2],
  },
  phaseProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  phaseProgressText: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.8)",
  },
  phaseProgressPercent: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  phaseProgressBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  phaseProgressBarFill: {
    height: "100%",
    backgroundColor: colors.neutral[0],
    borderRadius: 4,
  },

  // Sections
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  sectionBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  sectionBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },

  // Items List (Tasks & Habits)
  itemsList: {
    gap: spacing[3],
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    ...shadows.sm,
  },
  itemCardCompleted: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  itemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing[3],
    justifyContent: "center",
    alignItems: "center",
  },
  itemCheckboxCompleted: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[800],
    lineHeight: 22,
  },
  itemTextCompleted: {
    color: colors.primary[700],
  },
  itemDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
    lineHeight: 18,
  },
  itemTime: {
    fontSize: typography.size.xs,
    color: colors.primary[600],
    marginTop: spacing[1],
  },

  // Habit specific
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    ...shadows.sm,
  },
  habitCardCompleted: {
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  habitCheckboxCompleted: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  habitTextCompleted: {
    color: colors.secondary[700],
  },
  habitCategory: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  habitPoints: {
    backgroundColor: colors.accent.amber + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  habitPointsText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.accent.amber,
  },

  // No Habits Card
  noHabitsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  noHabitsText: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[8],
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },

  // Completion Card
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
  completionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginTop: spacing[2],
  },
  completionText: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.9)",
    marginTop: spacing[1],
  },

  // Action Menu
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
  },
  // Quick Actions Row
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[3],
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  quickActionText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[600],
    alignItems: "center",
  },
  actionMenuCloseText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[600],
  },
});
