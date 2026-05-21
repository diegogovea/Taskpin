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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { useTheme } from "../../contexts/ThemeContext";

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

interface TimelineFase {
  objetivo_id: number;
  titulo: string;
  descripcion?: string;
  orden_fase: number;
  dia_inicio: number;
  dia_fin: number;
  duracion_dias: number;
  estado: "completada" | "en_progreso" | "atrasada" | "pendiente";
  porcentaje_completado: number;
  tareas_completadas: number;
  tareas_total: number;
}

interface ProximoDia {
  fecha: string;
  tareas_total: number;
  tareas_completadas: number;
  tareas: TareaDiaria[];
}

// ── Helpers de fecha ──
const todayIso = (): string => new Date().toISOString().split("T")[0];

const addDays = (iso: string, n: number): string => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const formatFechaCorta = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
};

const formatFechaLarga = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
};

const esHoy = (iso: string): boolean => iso === todayIso();

// =====================
// MAIN COMPONENT
// =====================

export default function SeguimientoPlanScreen() {
  const router = useRouter();
  const { planUsuarioId, titulo } = useLocalSearchParams();
  const { user, authFetch } = useAuth();
  const { palette } = useTheme();
  
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

  // Modal edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFechaObjetivo, setEditFechaObjetivo] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // ── Navegación por fechas (B1) ──
  const [fechaConsulta, setFechaConsulta] = useState<string>(() => todayIso());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Próximas tareas colapsable (B3) ──
  const [proximasDias, setProximasDias] = useState<ProximoDia[]>([]);
  const [showProximas, setShowProximas] = useState(false);
  const [loadingProximas, setLoadingProximas] = useState(false);

  // ── Timeline integrado (D1) ──
  const [timeline, setTimeline] = useState<TimelineFase[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // ── Modal información del plan (C2) ──
  const [showPlanInfo, setShowPlanInfo] = useState(false);

  // =====================
  // FETCH DATA
  // =====================

  const fetchDashboard = async (fechaParam?: string) => {
    try {
      const fechaToUse = fechaParam ?? fechaConsulta;
      const response = await authFetch(`/api/planes/${planUsuarioId}/hoy?fecha=${fechaToUse}`);
      const data = await response.json();
      
      if (data && data.plan_usuario_id) {
        setDashboard(data);
      } else if (data.detail) {
        console.error("Error:", data.detail);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del plan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cambiarFecha = (delta: number) => {
    const nueva = addDays(fechaConsulta, delta);
    setFechaConsulta(nueva);
    setShowProximas(false); // resetear el collapse al cambiar fecha
    fetchDashboard(nueva);
  };

  const irAHoy = () => {
    const hoy = todayIso();
    setFechaConsulta(hoy);
    setShowProximas(false);
    fetchDashboard(hoy);
  };

  const loadProximas = async () => {
    if (loadingProximas) return;
    setLoadingProximas(true);
    try {
      const diasFuturos = [1, 2].map((n) => addDays(fechaConsulta, n));
      const results = await Promise.all(
        diasFuturos.map(async (d) => {
          try {
            const r = await authFetch(`/api/planes/${planUsuarioId}/hoy?fecha=${d}`);
            const j = await r.json();
            return {
              fecha: d,
              tareas_total: j.tareas_total ?? 0,
              tareas_completadas: j.tareas_completadas ?? 0,
              tareas: j.tareas_hoy ?? [],
            } as ProximoDia;
          } catch {
            return { fecha: d, tareas_total: 0, tareas_completadas: 0, tareas: [] };
          }
        })
      );
      setProximasDias(results);
    } finally {
      setLoadingProximas(false);
    }
  };

  const toggleProximas = () => {
    const next = !showProximas;
    setShowProximas(next);
    if (next && proximasDias.length === 0) loadProximas();
  };

  const loadTimeline = async () => {
    if (loadingTimeline) return;
    setLoadingTimeline(true);
    try {
      const r = await authFetch(`/api/planes/${planUsuarioId}/timeline`);
      const j = await r.json();
      if (j?.success) setTimeline(j.fases ?? []);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const toggleTimeline = () => {
    const next = !showTimeline;
    setShowTimeline(next);
    if (next && timeline.length === 0) loadTimeline();
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
          Alert.alert("Plan Cancelado", "El plan ha sido cancelado.", [
            { text: "OK", onPress: () => router.replace("/(tabs)/planes") }
          ]);
        } else if (nuevoEstado === "pausado") {
          Alert.alert("Plan Pausado", "Puedes reanudar este plan cuando quieras.");
          fetchDashboard();
        } else if (nuevoEstado === "activo") {
          Alert.alert("Plan Reanudado", "¡Tu plan está activo de nuevo!");
          fetchDashboard();
        }
      } else {
        Alert.alert("Error", data.message || "No se pudo actualizar el estado del plan");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleAccion = (accion: "pausar" | "reanudar" | "cancelar") => {
    setShowActionMenu(false);
    setAccionPendiente(accion);
    setShowConfirmModal(true);
  };

  const abrirEditarPlan = () => {
    // Pre-rellenar con la fecha objetivo actual si existe
    const fechaActual = dashboard?.progreso_general
      ? (() => {
          const hoy = new Date();
          const diasRestantes = dashboard.progreso_general.dias_totales - dashboard.progreso_general.dias_transcurridos;
          const fechaObj = new Date(hoy.getTime() + diasRestantes * 86400000);
          return fechaObj.toISOString().split('T')[0];
        })()
      : "";
    setEditFechaObjetivo(fechaActual);
    setShowActionMenu(false);
    setShowEditModal(true);
  };

  const guardarEdicionPlan = async () => {
    if (!editFechaObjetivo) {
      Alert.alert("Error", "Ingresa una fecha objetivo válida");
      return;
    }
    // Validar formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(editFechaObjetivo)) {
      Alert.alert("Error", "Usa el formato AAAA-MM-DD (ejemplo: 2026-12-31)");
      return;
    }
    // No permitir fechas pasadas
    if (new Date(editFechaObjetivo) < new Date(new Date().toISOString().split('T')[0])) {
      Alert.alert("Error", "La fecha objetivo no puede ser anterior a hoy");
      return;
    }
    setGuardandoEdicion(true);
    try {
      const res = await authFetch(`/api/planes/${planUsuarioId}/editar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_objetivo: editFechaObjetivo }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowEditModal(false);
        Alert.alert("Éxito", "Plan actualizado correctamente");
        fetchDashboard();
      } else {
        Alert.alert("Error", json.detail || "No se pudo actualizar el plan");
      }
    } catch {
      Alert.alert("Error", "Error de conexión. Intenta de nuevo.");
    } finally {
      setGuardandoEdicion(false);
    }
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
          title: "¿Pausar Plan?",
          message: "Tu progreso será guardado. Puedes reanudar este plan cuando quieras.",
          confirmText: "Pausar",
          icon: "pause-circle" as const,
          danger: false,
        };
      case "reanudar":
        return {
          title: "¿Reanudar Plan?",
          message: "¿Listo para continuar tu camino? ¡Volvamos a la pista!",
          confirmText: "Reanudar",
          icon: "play-circle" as const,
          danger: false,
        };
      case "cancelar":
        return {
          title: "¿Cancelar Plan?",
          message: "Esta acción no se puede deshacer. Todo el progreso se perderá.",
          confirmText: "Cancelar Plan",
          icon: "close-circle" as const,
          danger: true,
        };
      default:
        return { title: "", message: "", confirmText: "Confirmar", icon: "help-circle" as const, danger: false };
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
          tarea_id: tareaId,
          fecha: fechaConsulta,
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
        Alert.alert("Error", result.message || "No se pudo actualizar la tarea");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
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
        Alert.alert("Error", result.message || "No se pudo actualizar el hábito");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
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
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando tu progreso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
          <Text style={styles.loadingText}>No se pudo cargar el plan</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.surfaceAlt }]} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: palette.heading }]} numberOfLines={1}>
            {titulo ? decodeURIComponent(titulo as string) : dashboard.meta_principal}
          </Text>
        </View>
        {estadoPlan !== "completado" && estadoPlan !== "cancelado" ? (
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: palette.surfaceAlt }]} onPress={() => setShowActionMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={palette.text} />
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
              <Text style={styles.statusBannerTitle}>Plan Pausado</Text>
              <Text style={styles.statusBannerText}>Tu progreso está guardado</Text>
            </View>
            <TouchableOpacity style={styles.statusBannerButton} onPress={() => handleAccion("reanudar")}>
              <Text style={styles.statusBannerButtonText}>Reanudar</Text>
            </TouchableOpacity>
          </View>
        )}

        {estadoPlan === "cancelado" && (
          <View style={[styles.statusBanner, { backgroundColor: colors.semantic.error + '10' }]}>
            <View style={[styles.statusBannerIcon, { backgroundColor: colors.semantic.error + '20' }]}>
              <Ionicons name="close-circle" size={24} color={colors.semantic.error} />
            </View>
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerTitle, { color: colors.semantic.error }]}>Plan Cancelado</Text>
              <Text style={styles.statusBannerText}>Este plan ya no está activo</Text>
            </View>
          </View>
        )}

        {/* ===================== */}
        {/* DATE NAVIGATOR (B1) */}
        {/* ===================== */}
        <View style={[styles.dateNav, { backgroundColor: palette.surface }]}>
          <TouchableOpacity style={[styles.dateNavBtn, { backgroundColor: palette.surfaceAlt }]} onPress={() => cambiarFecha(-1)}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </TouchableOpacity>
          <View style={styles.dateNavCenter}>
            <Text style={[styles.dateNavLabel, { color: palette.textMuted }]}>
              {esHoy(fechaConsulta) ? "Hoy" : ""}
            </Text>
            <Text style={[styles.dateNavDate, { color: palette.heading }]}>
              {formatFechaLarga(fechaConsulta).charAt(0).toUpperCase() + formatFechaLarga(fechaConsulta).slice(1)}
            </Text>
            {!esHoy(fechaConsulta) && (
              <TouchableOpacity onPress={irAHoy} style={styles.dateNavTodayBtn}>
                <Ionicons name="today-outline" size={12} color={colors.primary[600]} />
                <Text style={styles.dateNavTodayText}>Volver a hoy</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.dateNavBtn, { backgroundColor: palette.surfaceAlt }]} onPress={() => cambiarFecha(1)}>
            <Ionicons name="chevron-forward" size={20} color={palette.text} />
          </TouchableOpacity>
        </View>

        {/* ===================== */}
        {/* PHASE BANNER (2D.3 + 2D.7 + B2 + B4) */}
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
                  Fase {dashboard.fase_actual.orden_fase}/{dashboard.fase_actual.total_fases}
                </Text>
              </View>
              <View style={styles.dayBadge}>
                <Ionicons name="calendar-outline" size={14} color={colors.neutral[0]} />
                <Text style={styles.dayBadgeText}>Día {dashboard.progreso_general.dias_transcurridos}</Text>
              </View>
            </View>

            <Text style={styles.phaseBannerTitle}>{dashboard.fase_actual.titulo}</Text>
            {dashboard.fase_actual.descripcion && (
              <Text style={styles.phaseBannerSubtitle} numberOfLines={2}>
                {dashboard.fase_actual.descripcion}
              </Text>
            )}

            {/* Phase Info - Days Remaining (B2) */}
            <View style={styles.phaseFactsRow}>
              <View style={styles.phaseFact}>
                <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.phaseFactText}>
                  Día {dashboard.fase_actual.dia_en_fase} de {dashboard.fase_actual.duracion_fase}
                </Text>
              </View>
              <View style={styles.phaseFact}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.phaseFactText}>
                  {Math.max(0, dashboard.fase_actual.duracion_fase - dashboard.fase_actual.dia_en_fase)} días restantes en la fase
                </Text>
              </View>
              <View style={styles.phaseFact}>
                <Ionicons name="flag-outline" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.phaseFactText}>
                  {Math.max(0, dashboard.progreso_general.dias_totales - dashboard.progreso_general.dias_transcurridos)} días para terminar
                </Text>
              </View>
            </View>

            {/* Daily Completion Bar (B4) */}
            {(() => {
              const totalItems = dashboard.tareas_total + dashboard.habitos_total;
              const completedItems = dashboard.tareas_completadas + dashboard.habitos_completados;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
              return (
                <View style={styles.phaseProgressContainer}>
                  <View style={styles.phaseProgressInfo}>
                    <Text style={styles.phaseProgressText}>
                      Completado: {completedItems}/{totalItems} {totalItems === 1 ? "actividad" : "actividades"}
                    </Text>
                    <Text style={styles.phaseProgressPercent}>{pct}%</Text>
                  </View>
                  <View style={styles.phaseProgressBarBg}>
                    <View style={[styles.phaseProgressBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })()}
          </LinearGradient>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: palette.surface }]}
            onPress={toggleTimeline}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name={showTimeline ? "git-branch" : "git-branch-outline"} size={18} color={colors.primary[600]} />
            </View>
            <Text style={[styles.quickActionText, { color: palette.text }]}>Ver fases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: palette.surface }]}
            onPress={() => setShowPlanInfo(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.secondary[600]} />
            </View>
            <Text style={[styles.quickActionText, { color: palette.text }]}>Detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: palette.surface }]}
            onPress={() => setShowActionMenu(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name="settings-outline" size={18} color={palette.icon} />
            </View>
            <Text style={[styles.quickActionText, { color: palette.text }]}>Opciones</Text>
          </TouchableOpacity>
        </View>

        {/* ===================== */}
        {/* TIMELINE COLLAPSABLE (D1) */}
        {/* ===================== */}
        {showTimeline && (
          <View style={[styles.timelineCollapse, { backgroundColor: palette.surface }]}>
            <View style={styles.timelineHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="layers-outline" size={18} color={colors.primary[600]} />
                <Text style={[styles.timelineTitle, { color: palette.heading }]}>Todas las fases</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTimeline(false)}>
                <Ionicons name="chevron-up" size={20} color={palette.iconSubtle} />
              </TouchableOpacity>
            </View>
            {loadingTimeline ? (
              <View style={{ paddingVertical: spacing[6], alignItems: "center" }}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
              </View>
            ) : timeline.length === 0 ? (
              <Text style={[styles.timelineEmpty, { color: palette.textMuted }]}>Sin fases disponibles</Text>
            ) : (
              <View style={styles.timelineList}>
                {timeline.map((f, idx) => {
                  const colorByEstado: Record<string, string> = {
                    completada: colors.secondary[500],
                    en_progreso: colors.primary[500],
                    atrasada: colors.semantic.error,
                    pendiente: colors.neutral[400],
                  };
                  const iconByEstado: Record<string, any> = {
                    completada: "checkmark-circle",
                    en_progreso: "play-circle",
                    atrasada: "alert-circle",
                    pendiente: "ellipse-outline",
                  };
                  const c = colorByEstado[f.estado] ?? colors.neutral[400];
                  return (
                    <View key={f.objetivo_id} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineIcon, { backgroundColor: c + "20" }]}>
                          <Ionicons name={iconByEstado[f.estado] ?? "ellipse-outline"} size={16} color={c} />
                        </View>
                        {idx < timeline.length - 1 && <View style={[styles.timelineConnector, { backgroundColor: palette.border }]} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineRow}>
                          <Text style={[styles.timelineFaseTitle, { color: palette.text }]} numberOfLines={1}>
                            {f.orden_fase}. {f.titulo}
                          </Text>
                          <Text style={[styles.timelineFaseDays, { color: palette.textMuted }]}>
                            día {f.dia_inicio}-{f.dia_fin}
                          </Text>
                        </View>
                        <View style={styles.timelineRow}>
                          <Text style={[styles.timelineFaseEstado, { color: c }]}>
                            {f.estado === "completada"
                              ? "Completada"
                              : f.estado === "en_progreso"
                              ? "En progreso"
                              : f.estado === "atrasada"
                              ? "Atrasada"
                              : "Pendiente"}
                          </Text>
                          <Text style={[styles.timelineFaseStats, { color: palette.textMuted }]}>
                            {f.tareas_completadas}/{f.tareas_total} tareas
                          </Text>
                        </View>
                        <View style={[styles.timelineProgressBg, { backgroundColor: palette.surfaceAlt }]}>
                          <View style={[styles.timelineProgressFill, { width: `${f.porcentaje_completado}%`, backgroundColor: c }]} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ===================== */}
        {/* TASKS SECTION (2D.4) */}
        {/* ===================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="checkbox-outline" size={20} color={colors.primary[600]} />
              <Text style={[styles.sectionTitle, { color: palette.heading }]}>Tareas de Hoy</Text>
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
              <Text style={[styles.emptyTitle, { color: palette.textMuted }]}>Sin tareas para hoy</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {dashboard.tareas_hoy.map((tarea) => (
                <TouchableOpacity
                  key={tarea.tarea_id}
                  style={[styles.itemCard, { backgroundColor: palette.surface }, tarea.completada && styles.itemCardCompleted]}
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
                    <Text style={[styles.itemText, { color: palette.text }, tarea.completada && styles.itemTextCompleted]}>
                      {tarea.titulo}
                    </Text>
                    {tarea.descripcion && (
                      <Text style={[styles.itemDescription, { color: palette.textMuted }]} numberOfLines={2}>{tarea.descripcion}</Text>
                    )}
                    {tarea.completada && tarea.hora_completada && (
                      <Text style={[styles.itemTime, { color: palette.textSubtle }]}>✓ {tarea.hora_completada}</Text>
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
                <Text style={[styles.sectionTitle, { color: palette.heading }]}>Hábitos del Plan</Text>
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
            <Text style={styles.noHabitsText}>Sin hábitos vinculados a este plan</Text>
          </View>
        )}

        {/* ===================== */}
        {/* PRÓXIMAS TAREAS (B3) */}
        {/* ===================== */}
        <TouchableOpacity
          style={[styles.proximasHeader, { backgroundColor: palette.surface }]}
          onPress={toggleProximas}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary[600]} />
            <Text style={[styles.sectionTitle, { color: palette.heading }]}>Próximos días</Text>
          </View>
          <Ionicons
            name={showProximas ? "chevron-up" : "chevron-down"}
            size={20}
            color={palette.iconSubtle}
          />
        </TouchableOpacity>

        {showProximas && (
          <View style={[styles.proximasContent, { backgroundColor: palette.surface }]}>
            {loadingProximas ? (
              <View style={{ paddingVertical: spacing[6], alignItems: "center" }}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
              </View>
            ) : proximasDias.every((d) => d.tareas_total === 0) ? (
              <Text style={[styles.proximasEmpty, { color: palette.textMuted }]}>
                Sin tareas planeadas para los próximos días
              </Text>
            ) : (
              proximasDias.map((d) => (
                <View key={d.fecha} style={styles.proximaDia}>
                  <View style={styles.proximaDiaHeader}>
                    <Text style={[styles.proximaDiaFecha, { color: palette.text }]}>
                      {formatFechaCorta(d.fecha).charAt(0).toUpperCase() + formatFechaCorta(d.fecha).slice(1)}
                    </Text>
                    <View style={[styles.proximaDiaBadge, { backgroundColor: palette.surfaceAlt }]}>
                      <Text style={[styles.proximaDiaBadgeText, { color: palette.textMuted }]}>
                        {d.tareas_completadas}/{d.tareas_total} tareas
                      </Text>
                    </View>
                  </View>
                  {d.tareas.length === 0 ? (
                    <Text style={[styles.proximaDiaEmpty, { color: palette.textSubtle }]}>Sin tareas</Text>
                  ) : (
                    d.tareas.slice(0, 4).map((t) => (
                      <View key={t.tarea_id} style={styles.proximaTareaItem}>
                        <Ionicons
                          name={t.completada ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={t.completada ? colors.secondary[500] : palette.iconSubtle}
                        />
                        <Text
                          style={[
                            styles.proximaTareaText,
                            { color: palette.textMuted },
                            t.completada && { textDecorationLine: "line-through" },
                          ]}
                          numberOfLines={1}
                        >
                          {t.titulo}
                        </Text>
                      </View>
                    ))
                  )}
                  {d.tareas.length > 4 && (
                    <Text style={[styles.proximaTareaMore, { color: colors.primary[600] }]}>
                      +{d.tareas.length - 4} tareas más
                    </Text>
                  )}
                </View>
              ))
            )}
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
              <Text style={styles.completionTitle}>¡Excelente trabajo hoy! 🎉</Text>
              <Text style={styles.completionText}>Has completado todas las tareas y hábitos</Text>
            </LinearGradient>
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal visible={showActionMenu} transparent animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
        <Pressable style={styles.actionMenuOverlay} onPress={() => setShowActionMenu(false)}>
          <View style={[styles.actionMenuContainer, { backgroundColor: palette.surface }]}>
            <View style={[styles.actionMenuHeader, { borderBottomColor: palette.border }]}>
              <Text style={[styles.actionMenuTitle, { color: palette.heading }]}>Opciones del Plan</Text>
            </View>

            {(estadoPlan === "activo" || estadoPlan === "pausado") && (
              <TouchableOpacity style={[styles.actionMenuItem, { borderBottomColor: palette.divider }]} onPress={abrirEditarPlan}>
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.primary[50] }]}>
                  <Ionicons name="create-outline" size={22} color={colors.primary[600]} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={[styles.actionMenuItemText, { color: palette.text }]}>Editar Plan</Text>
                  <Text style={[styles.actionMenuItemSubtext, { color: palette.textMuted }]}>Ajusta la fecha objetivo</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {estadoPlan === "activo" && (
              <TouchableOpacity style={[styles.actionMenuItem, { borderBottomColor: palette.divider }]} onPress={() => handleAccion("pausar")}>
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.accent.amber + '15' }]}>
                  <Ionicons name="pause-circle" size={22} color={colors.accent.amber} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={[styles.actionMenuItemText, { color: palette.text }]}>Pausar Plan</Text>
                  <Text style={[styles.actionMenuItemSubtext, { color: palette.textMuted }]}>Toma un descanso, reanuda cuando quieras</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {estadoPlan === "pausado" && (
              <TouchableOpacity style={[styles.actionMenuItem, { borderBottomColor: palette.divider }]} onPress={() => handleAccion("reanudar")}>
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.secondary[500] + '15' }]}>
                  <Ionicons name="play-circle" size={22} color={colors.secondary[500]} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={[styles.actionMenuItemText, { color: palette.text }]}>Reanudar Plan</Text>
                  <Text style={[styles.actionMenuItemSubtext, { color: palette.textMuted }]}>Continúa tu camino</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {(estadoPlan === "activo" || estadoPlan === "pausado") && (
              <TouchableOpacity style={[styles.actionMenuItem, { borderBottomColor: palette.divider }]} onPress={() => handleAccion("cancelar")}>
                <View style={[styles.actionMenuIcon, { backgroundColor: colors.semantic.error + '15' }]}>
                  <Ionicons name="close-circle" size={22} color={colors.semantic.error} />
                </View>
                <View style={styles.actionMenuTextContainer}>
                  <Text style={[styles.actionMenuItemText, { color: colors.semantic.error }]}>Cancelar Plan</Text>
                  <Text style={[styles.actionMenuItemSubtext, { color: palette.textMuted }]}>Esto no se puede deshacer</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.actionMenuCloseButton, { backgroundColor: palette.surfaceAlt }]} onPress={() => setShowActionMenu(false)}>
              <Text style={[styles.actionMenuCloseText, { color: palette.textMuted }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Editar Plan Modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.editModalOverlay}
        >
          <View style={[styles.editModalSheet, { backgroundColor: palette.surface }]}>
            <View style={[styles.editModalHandle, { backgroundColor: palette.border }]} />
            <Text style={[styles.editModalTitle, { color: palette.heading }]}>Editar Plan</Text>
            <Text style={[styles.editModalSubtitle, { color: palette.textMuted }]}>
              Ajusta la fecha en la que quieres alcanzar tu objetivo
            </Text>

            <Text style={[styles.editModalLabel, { color: palette.text }]}>Fecha objetivo</Text>
            <TextInput
              style={[styles.editModalInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
              value={editFechaObjetivo}
              onChangeText={setEditFechaObjetivo}
              placeholder="AAAA-MM-DD  (ej. 2026-12-31)"
              placeholderTextColor={palette.textSubtle}
              keyboardType="numeric"
              maxLength={10}
              autoFocus
            />
            <Text style={[styles.editModalHint, { color: palette.textSubtle }]}>Formato: Año-Mes-Día</Text>

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalCancelBtn, { backgroundColor: palette.surfaceAlt }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.editModalCancelText, { color: palette.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalSaveBtn, guardandoEdicion && { opacity: 0.6 }]}
                onPress={guardarEdicionPlan}
                disabled={guardandoEdicion}
              >
                {guardandoEdicion ? (
                  <ActivityIndicator size="small" color={colors.neutral[0]} />
                ) : (
                  <Text style={styles.editModalSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================== */}
      {/* PLAN INFO MODAL (C2) */}
      {/* ===================== */}
      <Modal
        visible={showPlanInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.planInfoModal, { backgroundColor: palette.background }]}>
            <View style={styles.planInfoHandle} />
            <View style={styles.planInfoHeader}>
              <Text style={[styles.planInfoTitle, { color: palette.heading }]}>Detalles del Plan</Text>
              <TouchableOpacity onPress={() => setShowPlanInfo(false)}>
                <Ionicons name="close" size={24} color={palette.icon} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing[6] }}>
              <Text style={[styles.planInfoMeta, { color: palette.heading }]}>
                {dashboard.meta_principal}
              </Text>

              <View style={styles.planInfoBadges}>
                <View style={[styles.planInfoBadge, { backgroundColor: palette.surface }]}>
                  <Ionicons name="speedometer-outline" size={14} color={colors.accent.amber} />
                  <Text style={[styles.planInfoBadgeText, { color: palette.text }]}>
                    {dashboard.dificultad}
                  </Text>
                </View>
                <View style={[styles.planInfoBadge, { backgroundColor: palette.surface }]}>
                  <Ionicons name="hourglass-outline" size={14} color={colors.primary[600]} />
                  <Text style={[styles.planInfoBadgeText, { color: palette.text }]}>
                    {dashboard.progreso_general.dias_totales} días
                  </Text>
                </View>
                <View style={[styles.planInfoBadge, { backgroundColor: palette.surface }]}>
                  <Ionicons name="layers-outline" size={14} color={colors.secondary[600]} />
                  <Text style={[styles.planInfoBadgeText, { color: palette.text }]}>
                    {dashboard.fase_actual.total_fases} {dashboard.fase_actual.total_fases === 1 ? "fase" : "fases"}
                  </Text>
                </View>
              </View>

              <View style={[styles.planInfoSection, { backgroundColor: palette.surface }]}>
                <Text style={[styles.planInfoSectionTitle, { color: palette.heading }]}>Progreso global</Text>
                <View style={styles.planInfoStatRow}>
                  <Text style={[styles.planInfoStatLabel, { color: palette.textMuted }]}>Días transcurridos</Text>
                  <Text style={[styles.planInfoStatValue, { color: palette.text }]}>
                    {dashboard.progreso_general.dias_transcurridos} / {dashboard.progreso_general.dias_totales}
                  </Text>
                </View>
                <View style={styles.planInfoStatRow}>
                  <Text style={[styles.planInfoStatLabel, { color: palette.textMuted }]}>Días restantes</Text>
                  <Text style={[styles.planInfoStatValue, { color: palette.text }]}>
                    {Math.max(0, dashboard.progreso_general.dias_totales - dashboard.progreso_general.dias_transcurridos)}
                  </Text>
                </View>
                <View style={styles.planInfoStatRow}>
                  <Text style={[styles.planInfoStatLabel, { color: palette.textMuted }]}>Estado</Text>
                  <View style={[styles.planInfoStatusChip, { backgroundColor: estadoPlan === "activo" ? colors.secondary[100] : palette.surfaceAlt }]}>
                    <Text style={[styles.planInfoStatusText, { color: estadoPlan === "activo" ? colors.secondary[700] : palette.textMuted }]}>
                      {estadoPlan.charAt(0).toUpperCase() + estadoPlan.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.planInfoSection, { backgroundColor: palette.surface }]}>
                <Text style={[styles.planInfoSectionTitle, { color: palette.heading }]}>Fase actual</Text>
                <Text style={[styles.planInfoFaseTitle, { color: palette.text }]}>
                  {dashboard.fase_actual.orden_fase}. {dashboard.fase_actual.titulo}
                </Text>
                {dashboard.fase_actual.descripcion && (
                  <Text style={[styles.planInfoFaseDesc, { color: palette.textMuted }]}>
                    {dashboard.fase_actual.descripcion}
                  </Text>
                )}
                <View style={styles.planInfoStatRow}>
                  <Text style={[styles.planInfoStatLabel, { color: palette.textMuted }]}>Duración fase</Text>
                  <Text style={[styles.planInfoStatValue, { color: palette.text }]}>
                    {dashboard.fase_actual.duracion_fase} días
                  </Text>
                </View>
                <View style={styles.planInfoStatRow}>
                  <Text style={[styles.planInfoStatLabel, { color: palette.textMuted }]}>Día en la fase</Text>
                  <Text style={[styles.planInfoStatValue, { color: palette.text }]}>
                    {dashboard.fase_actual.dia_en_fase} de {dashboard.fase_actual.duracion_fase}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.planInfoFullTimelineBtn}
                onPress={() => {
                  setShowPlanInfo(false);
                  router.push(`/seccion_planes/timelinePlan?planUsuarioId=${planUsuarioId}` as any);
                }}
              >
                <Ionicons name="git-branch-outline" size={18} color={colors.primary[600]} />
                <Text style={styles.planInfoFullTimelineText}>Ver línea de tiempo completa</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary[600]} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        title={getModalConfig().title}
        message={getModalConfig().message}
        confirmText={getModalConfig().confirmText}
        cancelText="Volver"
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
  quickActionBtnDisabled: {
    opacity: 0.6,
  },
  proximamenteBadge: {
    marginTop: spacing[1],
    backgroundColor: colors.neutral[100],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  proximamenteText: {
    fontSize: 9,
    color: colors.neutral[400],
    fontWeight: typography.weight.medium,
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

  // ── Edit Plan Modal ──
  editModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  editModalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  editModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[5],
  },
  editModalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  editModalSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[5],
    lineHeight: 20,
  },
  editModalLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  editModalInput: {
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.size.base,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  editModalHint: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
    marginTop: spacing[1],
    marginBottom: spacing[5],
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  editModalCancelBtn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  editModalCancelText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[600],
  },
  editModalSaveBtn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  editModalSaveText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },

  // === Date Navigator (B1) ===
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  dateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateNavLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateNavDate: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  dateNavTodayBtn: {
    marginTop: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
  },
  dateNavTodayText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },

  // === Phase Facts Row (B2) ===
  phaseFactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  phaseFact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  phaseFactText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: 'rgba(255,255,255,0.95)',
  },

  // === Timeline Collapsable (D1) ===
  timelineCollapse: {
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  timelineTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  timelineEmpty: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
  timelineList: {
    gap: spacing[3],
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing[2],
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineFaseTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    flex: 1,
    marginRight: spacing[2],
  },
  timelineFaseDays: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  timelineFaseEstado: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  timelineFaseStats: {
    fontSize: typography.size.xs,
  },
  timelineProgressBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  timelineProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // === Próximas Tareas (B3) ===
  proximasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  proximasContent: {
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  proximasEmpty: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: spacing[3],
  },
  proximaDia: {
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  proximaDiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  proximaDiaFecha: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  proximaDiaBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  proximaDiaBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  proximaDiaEmpty: {
    fontSize: typography.size.xs,
    fontStyle: 'italic',
    paddingVertical: spacing[1],
  },
  proximaTareaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: 4,
  },
  proximaTareaText: {
    fontSize: typography.size.sm,
    flex: 1,
  },
  proximaTareaMore: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginTop: 4,
    marginLeft: spacing[6],
  },

  // === Plan Info Modal (C2) ===
  planInfoModal: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[5],
    marginTop: 'auto',
  },
  planInfoHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  planInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  planInfoTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  planInfoMeta: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[3],
  },
  planInfoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  planInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  planInfoBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  planInfoSection: {
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[3],
  },
  planInfoSectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[3],
  },
  planInfoStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  planInfoStatLabel: {
    fontSize: typography.size.sm,
  },
  planInfoStatValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  planInfoStatusChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  planInfoStatusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  planInfoFaseTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
  },
  planInfoFaseDesc: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  planInfoFullTimelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    marginTop: spacing[2],
  },
  planInfoFullTimelineText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[700],
  },
});
