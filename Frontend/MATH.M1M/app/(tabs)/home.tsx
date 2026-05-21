import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Alert,
  Modal,
  Animated,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTutorial } from "../../contexts/TutorialContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCategoryColor, getCategoryColorByName, traducirCategoria } from "../../constants/categoryColors";
import ReflectionModal from "../../components/ui/ReflectionModal";
import DateStrip from "../../components/ui/DateStrip";
import { useWebSocket, HabitCompletedEvent, HabitUncompletedEvent } from "../../hooks/useWebSocket";
import WSNotification from "../../components/ui/WSNotification";

const { width } = Dimensions.get("window");

// Interfaces
interface HabitoHoy {
  habito_usuario_id: number;
  nombre: string;
  categoria_id?: number;
  categoria_nombre: string;
  completado_hoy: boolean;
  puntos_base: number;
  color?: string | null;
  icono?: string | null;
  tipo?: string | null;
}

interface PuntosHistorialItem {
  fecha: string;
  puntos: number;
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
  puntos_totales: number;
  nivel_actual: number;
  racha_maxima: number;
  fecha_inicio_racha: string | null;
  puntos_en_nivel: number;
  puntos_para_siguiente: number;
  puntos_faltantes: number;
  progreso_nivel: number;
}

interface ReflexionHoy {
  reflexion_id: number;
  fecha: string;
  estado_animo: string;
  que_salio_bien?: string | null;
  que_mejorar?: string | null;
}

// Configuración de colores para estados de ánimo
const MOOD_COLORS: Record<string, string> = {
  great: '#22C55E',
  good: '#84CC16',
  neutral: '#F59E0B',
  low: '#F97316',
  bad: '#EF4444',
};

const MOOD_ICONS: Record<string, string> = {
  great: 'sunny',
  good: 'partly-sunny',
  neutral: 'cloudy',
  low: 'rainy',
  bad: 'thunderstorm',
};

const MOOD_LABELS: Record<string, string> = {
  great: 'Excelente',
  good: 'Bien',
  neutral: 'Regular',
  low: 'Bajo',
  bad: 'Mal',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, authFetch } = useAuth();
  const { restart } = useTutorial();
  const { palette } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habitosHoy, setHabitosHoy] = useState<HabitoHoy[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  // Modal de resumen de día pasado
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null);
  const [dayDetailHabitos, setDayDetailHabitos] = useState<HabitoHoy[]>([]);
  const [dayDetailStats, setDayDetailStats] = useState<EstadisticasHabitos | null>(null);
  const [dayDetailLoading, setDayDetailLoading] = useState(false);
  const [estadisticasHabitos, setEstadisticasHabitos] = useState<EstadisticasHabitos>({
    total: 0,
    completados: 0,
    pendientes: 0,
    fecha: "today",
  });
  const [misPlanes, setMisPlanes] = useState<MiPlan[]>([]);
  const [resumenUsuario, setResumenUsuario] = useState<ResumenUsuario>({
    racha_actual: 0,
    puntos_totales: 0,
    nivel_actual: 1,
    racha_maxima: 0,
    fecha_inicio_racha: null,
    puntos_en_nivel: 0,
    puntos_para_siguiente: 200,
    puntos_faltantes: 200,
    progreso_nivel: 0,
  });

  const [activeModal, setActiveModal] = useState<'racha' | 'puntos' | 'nivel' | null>(null);
  const [puntosHistorial, setPuntosHistorial] = useState<PuntosHistorialItem[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Estado para reflexiones
  const [reflexionHoy, setReflexionHoy] = useState<ReflexionHoy | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);

  // WebSocket notification state
  const [wsNotification, setWsNotification] = useState<{
    visible: boolean;
    type: 'habit_completed' | 'habit_uncompleted' | 'info';
    message: string;
    points?: number;
    streak?: number;
  }>({ visible: false, type: 'info', message: '' });

  // Animación de pulso para la racha
  useEffect(() => {
    if (resumenUsuario.racha_actual > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [resumenUsuario.racha_actual]);

  // WebSocket connection for real-time updates
  const { status: wsStatus, isConnected } = useWebSocket({
    onHabitCompleted: (event: HabitCompletedEvent) => {
      console.log('[Home] Habit completed event:', event);
      setWsNotification({
        visible: true,
        type: 'habit_completed',
        message: event.data.nombre,
        points: event.data.puntos,
        streak: event.data.racha_actual,
      });
      // Refresh data to show updated stats
      if (user?.user_id) {
        loadResumenUsuario(user.user_id);
        loadHabitosHoy(user.user_id);
      }
    },
    onHabitUncompleted: (event: HabitUncompletedEvent) => {
      console.log('[Home] Habit uncompleted event:', event);
      setWsNotification({
        visible: true,
        type: 'habit_uncompleted',
        message: `Unmarked: ${event.data.nombre}`,
      });
      // Refresh data
      if (user?.user_id) {
        loadResumenUsuario(user.user_id);
        loadHabitosHoy(user.user_id);
      }
    },
  });

  // ✅ Funciones que usan authFetch (incluye token automáticamente)

  const loadHabitosHoy = async (userId: number) => {
    try {
      const response = await authFetch(`/api/usuario/${userId}/habitos/hoy`);
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

  // Marcar / desmarcar un hábito desde la vista previa
  const toggleHabito = async (habitoUsuarioId: number) => {
    if (!user?.user_id || togglingId !== null) return;
    setTogglingId(habitoUsuarioId);
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habitoUsuarioId}/toggle`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await response.json();

      if (data.success) {
        // Optimistic update local
        setHabitosHoy((prev) =>
          prev.map((h) =>
            h.habito_usuario_id === habitoUsuarioId
              ? { ...h, completado_hoy: !h.completado_hoy }
              : h
          )
        );
        // Recargar estadísticas y resumen (puntos, racha, nivel)
        if (user?.user_id) {
          loadHabitosHoy(user.user_id);
          loadResumenUsuario(user.user_id);
        }
      } else {
        Alert.alert("Error", data.message || "No se pudo actualizar el hábito");
      }
    } catch (error) {
      console.error("Error toggling habito:", error);
      Alert.alert("Error", "No se pudo actualizar el hábito");
    } finally {
      setTogglingId(null);
    }
  };

  // Carga el resumen de un día pasado para el modal
  const loadDayDetail = async (date: Date) => {
    if (!user?.user_id) return;
    setDayDetailLoading(true);
    setDayDetailHabitos([]);
    setDayDetailStats(null);
    try {
      const dateParam = date.toISOString().split("T")[0];
      const response = await authFetch(`/api/usuario/${user.user_id}/habitos/hoy?fecha=${dateParam}`);
      const data = await response.json();
      if (data.success) {
        setDayDetailHabitos(data.data.habitos || []);
        setDayDetailStats(data.data.estadisticas || null);
      }
    } catch (error) {
      console.error("Error loading day detail:", error);
    } finally {
      setDayDetailLoading(false);
    }
  };

  // Tocar una fecha en el DateStrip:
  // - Hoy → no hace nada (ya estás viendo hoy)
  // - Pasado → abre modal de resumen
  // - Futuro → no hace nada
  const handleDateChange = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    if (target >= today) return; // hoy o futuro → ignorar
    setDayDetailDate(date);
    loadDayDetail(date);
  };

  const loadMisPlanes = async (userId: number) => {
    try {
      const response = await authFetch(`/api/planes/mis-planes/${userId}`);
      const data = await response.json();
      if (data.success) {
        setMisPlanes(data.planes || []);
      }
    } catch (error) {
      console.error("Error loading planes:", error);
      setMisPlanes([]);
    }
  };

  const loadResumenUsuario = async (userId: number) => {
    try {
      const response = await authFetch(`/api/usuario/${userId}/estadisticas`);
      const data = await response.json();
      
      if (data.success) {
        setResumenUsuario({
          racha_actual:         data.data.racha_actual,
          puntos_totales:       data.data.puntos_totales,
          nivel_actual:         data.data.nivel,
          racha_maxima:         data.data.racha_maxima,
          fecha_inicio_racha:   data.data.fecha_inicio_racha ?? null,
          puntos_en_nivel:      data.data.puntos_en_nivel ?? 0,
          puntos_para_siguiente: data.data.puntos_para_siguiente ?? 200,
          puntos_faltantes:     data.data.puntos_faltantes ?? 200,
          progreso_nivel:       data.data.progreso_siguiente_nivel ?? 0,
        });
      }
    } catch (error) {
      console.error("Error loading estadisticas:", error);
      // Mantener valores por defecto en caso de error
    }
  };

  const loadPuntosHistorial = async (userId: number) => {
    setLoadingHistorial(true);
    try {
      const response = await authFetch(`/api/usuario/${userId}/estadisticas/puntos-historial?dias=14`);
      const data = await response.json();
      if (data.success) setPuntosHistorial(data.data);
    } catch (error) {
      console.error("Error loading puntos historial:", error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleOpenModal = (type: 'racha' | 'puntos' | 'nivel') => {
    setActiveModal(type);
    if (type === 'puntos' && user?.user_id) {
      loadPuntosHistorial(user.user_id);
    }
  };

  const handleCloseModal = () => setActiveModal(null);

  const loadReflexionHoy = async (userId: number) => {
    try {
      const response = await authFetch(`/api/usuario/${userId}/reflexion/hoy`);
      const data = await response.json();
      
      if (data.tiene_reflexion && data.reflexion) {
        setReflexionHoy(data.reflexion);
      } else {
        setReflexionHoy(null);
      }
    } catch (error) {
      console.error("Error loading reflexion:", error);
      setReflexionHoy(null);
    }
  };

  const handleSaveReflection = async (reflectionData: {
    estado_animo: string;
    que_salio_bien?: string;
    que_mejorar?: string;
  }) => {
    if (!user?.user_id) return;
    
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/reflexion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reflectionData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar la reflexión
        await loadReflexionHoy(user.user_id);
      } else {
        Alert.alert('Error', data.message || 'Could not save reflection');
      }
    } catch (error) {
      console.error("Error saving reflection:", error);
      Alert.alert('Error', 'Could not save reflection');
    }
  };

  // ✅ SIMPLIFICADO: Ya no llamamos a getCurrentUser, usamos user del contexto
  const loadAllData = async () => {
    try {
      setLoading(true);
      if (!user?.user_id) return; // ← Usamos user del contexto
      await Promise.all([
        loadHabitosHoy(user.user_id),
        loadMisPlanes(user.user_id),
        loadResumenUsuario(user.user_id),
        loadReflexionHoy(user.user_id)
      ]);
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

  // ✅ Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user?.user_id && !authLoading) {
    loadAllData();
    }
  }, [user?.user_id, authLoading]);

  // ✅ Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        loadAllData();
      }
    }, [user?.user_id])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getCurrentDate = () => {
    const now = new Date();
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
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

  // Stats Card Component — tappable
  const StatCard = ({
    icon,
    value,
    label,
    gradient,
    onPress,
    withPulse = false,
  }: {
    icon: string;
    value: string | number;
    label: string;
    gradient: string[];
    onPress?: () => void;
    withPulse?: boolean;
  }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.82}>
      <LinearGradient colors={gradient} style={styles.statCardGradient}>
        {withPulse ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name={icon as any} size={24} color={colors.neutral[0]} />
          </Animated.View>
        ) : (
          <Ionicons name={icon as any} size={24} color={colors.neutral[0]} />
        )}
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
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
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={[styles.loadingText, { color: palette.textMuted }]}>Cargando tu panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progresoHoy =
    estadisticasHabitos.total > 0
      ? Math.round((estadisticasHabitos.completados / estadisticasHabitos.total) * 100)
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.bg }]}>
          <View>
            <Text style={[styles.greeting, { color: palette.textMuted }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: palette.text }]}>{(user?.nombre || "Usuario").split(" ")[0]}</Text>
            <Text style={[styles.date, { color: palette.textMuted }]}>{getCurrentDate()}</Text>
          </View>
          <TouchableOpacity
            onPress={restart}
            style={styles.tutorialBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="play-circle-outline" size={15} color={colors.primary[600]} />
            <Text style={styles.tutorialBtnText}>Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* DateStrip — toca un día pasado para ver su resumen */}
        <View style={styles.dateStripWrapper}>
          <DateStrip selectedDate={new Date()} onDateChange={handleDateChange} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="flame"
            value={resumenUsuario.racha_actual}
            label="Racha"
            gradient={["#F97316", "#EA580C"]}
            onPress={() => handleOpenModal('racha')}
            withPulse={resumenUsuario.racha_actual > 0}
          />
          <StatCard
            icon="diamond"
            value={resumenUsuario.puntos_totales}
            label="Puntos"
            gradient={colors.gradients.primary}
            onPress={() => handleOpenModal('puntos')}
          />
          <StatCard
            icon="trophy"
            value={`Nv.${resumenUsuario.nivel_actual}`}
            label="Nivel"
            gradient={colors.gradients.secondary}
            onPress={() => handleOpenModal('nivel')}
          />
        </View>

        {/* Today's Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: palette.surface }]}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={[styles.progressCardTitle, { color: palette.text }]}>Progreso de Hoy</Text>
              <Text style={[styles.progressCardSubtitle, { color: palette.textMuted }]}>
                {estadisticasHabitos.completados} de {estadisticasHabitos.total} hábitos completados
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
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Hábitos de Hoy</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(tabs)/habitos")}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {habitosHoy.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: palette.surface }]}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons name="add-circle-outline" size={32} color={colors.primary[600]} />
              </View>
              <Text style={[styles.emptyCardTitle, { color: palette.text }]}>Sin hábitos aún</Text>
              <Text style={[styles.emptyCardSubtitle, { color: palette.textMuted }]}>Toca para agregar tu primer hábito</Text>
            </TouchableOpacity>
          ) : (() => {
            // Solo mostramos pendientes en la vista previa
            const pendientes = habitosHoy.filter((h) => !h.completado_hoy);
            const visibles = pendientes.slice(0, 3);
            const restantes = pendientes.length - visibles.length;

            if (pendientes.length === 0) {
              return (
                <TouchableOpacity
                  style={[styles.allDoneCard, { backgroundColor: palette.surface }]}
                  onPress={() => router.push("/(tabs)/habitos")}
                  activeOpacity={0.8}
                >
                  <View style={styles.allDoneIcon}>
                    <Ionicons name="trophy" size={28} color={colors.secondary[500]} />
                  </View>
                  <Text style={[styles.allDoneTitle, { color: palette.text }]}>
                    ¡Completaste todo!
                  </Text>
                  <Text style={[styles.allDoneSubtitle, { color: palette.textMuted }]}>
                    {habitosHoy.length} {habitosHoy.length === 1 ? "hábito completado" : "hábitos completados"} hoy. Toca para ver el detalle.
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <View style={styles.habitsList}>
                {visibles.map((habito) => {
                  const catColor = habito.color
                    || (habito.categoria_id
                      ? getCategoryColor(habito.categoria_id)
                      : getCategoryColorByName(habito.categoria_nombre));
                  const isToggling = togglingId === habito.habito_usuario_id;
                  return (
                    <TouchableOpacity
                      key={habito.habito_usuario_id}
                      style={[styles.habitItem, { backgroundColor: palette.surface }, isToggling && { opacity: 0.6 }]}
                      onPress={() => toggleHabito(habito.habito_usuario_id)}
                      disabled={isToggling}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.habitCategoryBar, { backgroundColor: catColor }]} />
                      <View
                        style={[
                          styles.habitCheckbox,
                          { borderColor: catColor },
                        ]}
                      >
                        {isToggling && (
                          <ActivityIndicator size="small" color={catColor} />
                        )}
                      </View>
                      <View style={styles.habitInfo}>
                        <View style={styles.habitNameRow}>
                          <Text style={styles.habitName} numberOfLines={1}>
                            {habito.nombre}
                          </Text>
                          {habito.categoria_nombre === "My Custom Habits" && (
                            <View style={styles.customBadge}>
                              <Ionicons name="sparkles" size={8} color={colors.primary[600]} />
                            </View>
                          )}
                        </View>
                        <Text style={[styles.habitCategory, { color: catColor }]}>{traducirCategoria(habito.categoria_nombre)}</Text>
                      </View>
                      <View style={styles.habitPoints}>
                        <Ionicons name="diamond-outline" size={12} color={colors.primary[500]} />
                        <Text style={styles.habitPointsText}>+{habito.puntos_base}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {restantes > 0 && (
                  <TouchableOpacity
                    style={styles.moreHabitsButton}
                    onPress={() => router.push("/(tabs)/habitos")}
                  >
                    <Text style={styles.moreHabitsText}>+{restantes} pendientes más</Text>
                  </TouchableOpacity>
                )}
                {/* Hint sutil de cuántos llevas completados */}
                {estadisticasHabitos.completados > 0 && (
                  <View style={styles.completedHint}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.secondary[500]} />
                    <Text style={styles.completedHintText}>
                      {estadisticasHabitos.completados} de {estadisticasHabitos.total} completados hoy
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>

        {/* Plans Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Planes Activos</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(tabs)/planes")}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {misPlanes.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: palette.surface }]}
              onPress={() => router.push("/seccion_planes/tiposPlanes")}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={32} color={colors.primary[600]} />
              </View>
              <Text style={[styles.emptyCardTitle, { color: palette.text }]}>Sin planes aún</Text>
              <Text style={[styles.emptyCardSubtitle, { color: palette.textMuted }]}>Toca para crear tu primer plan</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.plansList}>
              {misPlanes
                .filter((p) => p.estado === "activo")
                .slice(0, 2)
                .map((plan) => (
                  <TouchableOpacity
                    key={plan.plan_usuario_id}
                    style={[styles.planCard, { backgroundColor: palette.surface }]}
                    onPress={() =>
                      router.push(
                        `/seccion_planes/seguimientoPlan?planUsuarioId=${plan.plan_usuario_id}` as any
                      )
                    }
                  >
                    <View style={styles.planCardHeader}>
                      <Text style={[styles.planTitle, { color: palette.text }]} numberOfLines={1}>
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
                    <Text style={[styles.planDescription, { color: palette.textMuted }]} numberOfLines={2}>
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

        {/* Daily Reflection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Reflexión Diaria</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/seccion_reflexiones/historialReflexiones")}
            >
              <Text style={styles.seeAllText}>Historial</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {reflexionHoy ? (
            // Reflexión completada
            <TouchableOpacity
              style={[styles.reflectionCard, { backgroundColor: palette.surface }]}
              onPress={() => setShowReflectionModal(true)}
            >
              <View style={styles.reflectionHeader}>
                <View style={[
                  styles.reflectionMoodBadge,
                  { backgroundColor: MOOD_COLORS[reflexionHoy.estado_animo] + '20' }
                ]}>
                  <Ionicons
                    name={MOOD_ICONS[reflexionHoy.estado_animo] as any}
                    size={20}
                    color={MOOD_COLORS[reflexionHoy.estado_animo]}
                  />
                  <Text style={[
                    styles.reflectionMoodText,
                    { color: MOOD_COLORS[reflexionHoy.estado_animo] }
                  ]}>
                    {MOOD_LABELS[reflexionHoy.estado_animo]}
                  </Text>
                </View>
                <Ionicons name="create-outline" size={18} color={colors.neutral[400]} />
              </View>
              
              {reflexionHoy.que_salio_bien && (
                <View style={styles.reflectionTextSection}>
                  <Text style={[styles.reflectionTextLabel, { color: palette.textMuted }]}>¿Qué salió bien?</Text>
                  <Text style={[styles.reflectionTextContent, { color: palette.text }]} numberOfLines={2}>
                    {reflexionHoy.que_salio_bien}
                  </Text>
                </View>
              )}
              
              {reflexionHoy.que_mejorar && (
                <View style={styles.reflectionTextSection}>
                  <Text style={[styles.reflectionTextLabel, { color: palette.textMuted }]}>¿Qué mejorar?</Text>
                  <Text style={[styles.reflectionTextContent, { color: palette.text }]} numberOfLines={2}>
                    {reflexionHoy.que_mejorar}
                  </Text>
                </View>
              )}
              
              <Text style={styles.reflectionTapHint}>Toca para editar</Text>
            </TouchableOpacity>
          ) : (
            // Sin reflexión - CTA para crear
            <TouchableOpacity
              style={[styles.reflectionEmptyCard, { backgroundColor: palette.surface }]}
              onPress={() => setShowReflectionModal(true)}
            >
              <View style={styles.reflectionEmptyIcon}>
                <Ionicons name="journal-outline" size={32} color={colors.primary[600]} />
              </View>
              <Text style={styles.reflectionEmptyTitle}>¿Cómo estuvo tu día?</Text>
              <Text style={styles.reflectionEmptySubtitle}>
                Toma un momento para reflexionar sobre tu progreso
              </Text>
              <View style={styles.reflectionCTA}>
                <Text style={styles.reflectionCTAText}>Agregar Reflexión</Text>
                <Ionicons name="add" size={18} color={colors.primary[600]} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Stats Detail Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={handleCloseModal} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseModal}>
              <Ionicons name="close" size={18} color={colors.neutral[500]} />
            </TouchableOpacity>

            {/* ── RACHA ── */}
            {activeModal === 'racha' && (
              <View style={styles.modalContent}>
                <Animated.Text style={[styles.modalBigIcon, { transform: [{ scale: pulseAnim }] }]}>🔥</Animated.Text>
                <Text style={styles.modalBigNumber}>{resumenUsuario.racha_actual}</Text>
                <Text style={styles.modalBigLabel}>días seguidos</Text>
                <View style={styles.modalDivider} />
                <View style={styles.modalRow}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>{resumenUsuario.racha_maxima}</Text>
                    <Text style={styles.modalStatLabel}>Racha máxima</Text>
                  </View>
                  {resumenUsuario.racha_actual > 0 && resumenUsuario.fecha_inicio_racha && (
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatValue}>
                        {new Date(resumenUsuario.fecha_inicio_racha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={styles.modalStatLabel}>Desde</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalMotivation}>
                  {resumenUsuario.racha_actual === 0
                    ? '¡Completa un hábito hoy para empezar tu racha!'
                    : resumenUsuario.racha_actual < 7
                    ? '¡Vas muy bien, sigue así! 💪'
                    : resumenUsuario.racha_actual < 30
                    ? '¡Increíble constancia! 🏆'
                    : '¡Eres una máquina de hábitos! 🚀'}
                </Text>
              </View>
            )}

            {/* ── PUNTOS ── */}
            {activeModal === 'puntos' && (
              <View style={styles.modalContent}>
                <Ionicons name="diamond" size={40} color={colors.primary[500]} />
                <Text style={styles.modalBigNumber}>{resumenUsuario.puntos_totales}</Text>
                <Text style={styles.modalBigLabel}>puntos totales</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalChartTitle}>Últimos 14 días</Text>
                {loadingHistorial ? (
                  <ActivityIndicator color={colors.primary[600]} style={{ marginTop: 20 }} />
                ) : (
                  <View style={styles.barChart}>
                    {puntosHistorial.map((item, i) => {
                      const maxPts = Math.max(...puntosHistorial.map(d => d.puntos), 1);
                      const barH = Math.max(4, (item.puntos / maxPts) * 72);
                      const fecha = new Date(item.fecha + 'T00:00:00');
                      return (
                        <View key={i} style={styles.barColumn}>
                          {item.puntos > 0 && <Text style={styles.barValue}>{item.puntos}</Text>}
                          <View style={[styles.bar, {
                            height: barH,
                            backgroundColor: item.puntos > 0 ? colors.primary[500] : colors.neutral[200],
                          }]} />
                          <Text style={styles.barLabel}>
                            {fecha.toLocaleDateString('es-ES', { weekday: 'narrow' })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ── NIVEL ── */}
            {activeModal === 'nivel' && (
              <View style={styles.modalContent}>
                <View style={styles.levelBadge}>
                  <Ionicons name="trophy" size={32} color={colors.neutral[0]} />
                </View>
                <Text style={styles.modalBigNumber}>Nivel {resumenUsuario.nivel_actual}</Text>
                <Text style={styles.modalBigLabel}>nivel actual</Text>
                <View style={styles.levelProgressBarBg}>
                  <View style={[styles.levelProgressFill, { width: `${resumenUsuario.progreso_nivel}%` }]} />
                </View>
                <Text style={styles.levelProgressText}>
                  {resumenUsuario.puntos_en_nivel} / {resumenUsuario.puntos_para_siguiente} pts en este nivel
                </Text>
                <View style={styles.modalDivider} />
                <Text style={styles.levelNeedText}>
                  Te faltan{' '}
                  <Text style={styles.levelNeedHighlight}>{resumenUsuario.puntos_faltantes} pts</Text>
                  {' '}para el Nivel {resumenUsuario.nivel_actual + 1}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal: Resumen de día pasado ── */}
      <Modal
        visible={dayDetailDate !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDayDetailDate(null)}
      >
        <TouchableOpacity
          style={styles.dayModalOverlay}
          activeOpacity={1}
          onPress={() => setDayDetailDate(null)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.dayModalSheet, { backgroundColor: palette.surface }]}>
            {/* Handle */}
            <View style={styles.dayModalHandle} />

            {/* Header */}
            {dayDetailDate && (() => {
              const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
              const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
              const dayName = DAYS_ES[dayDetailDate.getDay()];
              const dayNum = dayDetailDate.getDate();
              const monthName = MONTHS_ES[dayDetailDate.getMonth()];
              return (
                <View style={styles.dayModalHeader}>
                  <View>
                    <Text style={[styles.dayModalTitle, { color: palette.heading }]}>{dayName} {dayNum} {monthName}</Text>
                    <Text style={[styles.dayModalSubtitle, { color: palette.textMuted }]}>Resumen del día</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dayModalCloseBtn}
                    onPress={() => setDayDetailDate(null)}
                  >
                    <Ionicons name="close" size={20} color={colors.neutral[500]} />
                  </TouchableOpacity>
                </View>
              );
            })()}

            {dayDetailLoading ? (
              <View style={styles.dayModalLoading}>
                <ActivityIndicator color={colors.primary[600]} size="large" />
                <Text style={[styles.dayModalLoadingText, { color: palette.textMuted }]}>Cargando resumen...</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.dayModalScroll}
              >
                {/* Stats summary */}
                {dayDetailStats && (
                  <View style={styles.dayModalSummary}>
                    <LinearGradient
                      colors={dayDetailStats.completados === dayDetailStats.total && dayDetailStats.total > 0
                        ? colors.gradients.secondary
                        : colors.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.dayModalSummaryGradient}
                    >
                      <Text style={styles.dayModalSummaryNum}>
                        {dayDetailStats.completados}/{dayDetailStats.total}
                      </Text>
                      <Text style={styles.dayModalSummaryLabel}>hábitos completados</Text>
                      {/* Progress bar */}
                      <View style={styles.dayModalProgressBg}>
                        <View
                          style={[
                            styles.dayModalProgressFill,
                            {
                              width: dayDetailStats.total > 0
                                ? `${Math.round((dayDetailStats.completados / dayDetailStats.total) * 100)}%`
                                : "0%",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.dayModalProgressPct}>
                        {dayDetailStats.total > 0
                          ? `${Math.round((dayDetailStats.completados / dayDetailStats.total) * 100)}% de cumplimiento`
                          : "Sin hábitos registrados"}
                      </Text>
                    </LinearGradient>
                  </View>
                )}

                {/* Lista de hábitos */}
                {dayDetailHabitos.length > 0 ? (
                  <View style={styles.dayModalList}>
                    <Text style={[styles.dayModalListTitle, { color: palette.heading }]}>Detalle por hábito</Text>
                    {dayDetailHabitos.map((h) => (
                      <View key={h.habito_usuario_id} style={[styles.dayModalHabitRow, { borderBottomColor: palette.divider }]}>
                        <View
                          style={[
                            styles.dayModalHabitStatus,
                            { backgroundColor: h.completado_hoy ? colors.secondary[500] : palette.surfaceAlt },
                          ]}
                        >
                          <Ionicons
                            name={h.completado_hoy ? "checkmark" : "close"}
                            size={14}
                            color={h.completado_hoy ? colors.neutral[0] : palette.textSubtle}
                          />
                        </View>
                        <View style={styles.dayModalHabitInfo}>
                          <Text
                            style={[
                              styles.dayModalHabitName,
                              { color: palette.text },
                              !h.completado_hoy && { color: palette.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {h.nombre}
                          </Text>
                          <Text style={[styles.dayModalHabitCat, { color: palette.textSubtle }]}>{traducirCategoria(h.categoria_nombre)}</Text>
                        </View>
                        {h.completado_hoy && (
                          <Text style={styles.dayModalHabitPts}>+{h.puntos_base} pts</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.dayModalEmpty}>
                    <Ionicons name="calendar-outline" size={40} color={palette.iconSubtle} />
                    <Text style={[styles.dayModalEmptyText, { color: palette.textMuted }]}>Sin hábitos ese día</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reflection Modal */}
      <ReflectionModal
        visible={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
        onSave={handleSaveReflection}
        existingReflection={reflexionHoy}
      />

      {/* WebSocket Notification */}
      <WSNotification
        visible={wsNotification.visible}
        type={wsNotification.type}
        message={wsNotification.message}
        points={wsNotification.points}
        streak={wsNotification.streak}
        onHide={() => setWsNotification(prev => ({ ...prev, visible: false }))}
      />

      {/* WebSocket Status Indicator (bottom right) */}
      {isConnected && (
        <View style={styles.wsIndicator}>
          <View style={styles.wsIndicatorDot} />
        </View>
      )}
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
    marginBottom: spacing[4],
  },
  dateStripWrapper: {
    marginHorizontal: -spacing[5],
    marginBottom: spacing[3],
  },
  // ── Day Detail Modal ──
  dayModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,30,0.45)",
    justifyContent: "flex-end",
  },
  dayModalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    paddingBottom: 36,
    maxHeight: "80%",
  },
  dayModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    alignSelf: "center",
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  dayModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  dayModalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    textTransform: "capitalize",
  },
  dayModalSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    marginTop: 2,
  },
  dayModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  dayModalLoading: {
    alignItems: "center",
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  dayModalLoadingText: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
  },
  dayModalScroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  dayModalSummary: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[5],
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  dayModalSummaryGradient: {
    padding: spacing[6],
    alignItems: "center",
  },
  dayModalSummaryNum: {
    fontSize: 42,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    lineHeight: 48,
  },
  dayModalSummaryLabel: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing[4],
  },
  dayModalProgressBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  dayModalProgressFill: {
    height: "100%",
    backgroundColor: colors.neutral[0],
    borderRadius: 4,
  },
  dayModalProgressPct: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.75)",
  },
  dayModalList: {
    gap: spacing[2],
  },
  dayModalListTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  dayModalHabitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  dayModalHabitStatus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  dayModalHabitInfo: {
    flex: 1,
  },
  dayModalHabitName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  dayModalHabitNameMuted: {
    color: colors.neutral[400],
  },
  dayModalHabitCat: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
    marginTop: 1,
  },
  dayModalHabitPts: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.secondary[600],
  },
  dayModalEmpty: {
    alignItems: "center",
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  dayModalEmptyText: {
    fontSize: typography.size.base,
    color: colors.neutral[400],
  },
  tutorialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginTop: spacing[1],
  },
  tutorialBtnText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
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
  habitNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
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
  customBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
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
  completedHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  completedHintText: {
    fontSize: typography.size.xs,
    color: colors.secondary[600],
    fontWeight: typography.weight.medium,
  },
  // All-done card (todos los hábitos completados)
  allDoneCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.secondary[200],
    ...shadows.sm,
  },
  allDoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  allDoneTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  allDoneSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: "center",
    lineHeight: 18,
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
  // Reflection Section Styles
  reflectionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    ...shadows.sm,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  reflectionMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  reflectionMoodText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  reflectionTextSection: {
    marginBottom: spacing[3],
  },
  reflectionTextLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reflectionTextContent: {
    fontSize: typography.size.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  reflectionTapHint: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing[2],
  },
  reflectionEmptyCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
  },
  reflectionEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  reflectionEmptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  reflectionEmptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  reflectionCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  reflectionCTAText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  // WebSocket indicator styles
  wsIndicator: {
    position: 'absolute',
    bottom: 100,
    right: spacing[4],
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: spacing[2],
    borderRadius: 20,
  },
  wsIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  // Category color bar on habit items
  habitCategoryBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: spacing[2],
  },
  // Stats modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[6],
    paddingBottom: spacing[12],
    minHeight: 340,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  modalCloseBtn: {
    position: 'absolute',
    top: spacing[5],
    right: spacing[5],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    paddingTop: spacing[2],
  },
  modalBigIcon: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  modalBigNumber: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  modalBigLabel: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing[4],
  },
  modalRow: {
    flexDirection: 'row',
    gap: spacing[10],
    justifyContent: 'center',
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[800],
  },
  modalStatLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  modalMotivation: {
    marginTop: spacing[5],
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalChartTitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 3,
    width: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 7,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  bar: {
    width: '80%',
    borderRadius: 3,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 8,
    color: colors.neutral[400],
    marginTop: 3,
  },
  levelBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  levelProgressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
    marginTop: spacing[4],
    marginBottom: spacing[2],
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: colors.accent.amber,
    borderRadius: 6,
  },
  levelProgressText: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  levelNeedText: {
    fontSize: typography.size.base,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  levelNeedHighlight: {
    fontWeight: typography.weight.bold,
    color: colors.accent.amber,
  },
});
