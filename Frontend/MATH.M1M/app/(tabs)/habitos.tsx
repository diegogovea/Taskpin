import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCategoryColor, getCategoryColorByName } from "../../constants/categoryColors";
import { safeIcon } from "../../utils/safeIcon";

interface HabitoHoy {
  habito_usuario_id: number;
  user_id: number;
  categoria_id?: number;
  habito_id: number;
  nombre: string;
  descripcion: string | null;
  puntos_base: number;
  categoria_nombre: string;
  frecuencia_personal: string;
  fecha_agregado: string;
  completado_hoy: boolean;
  hora_completado: string | null;
  notas: string | null;
  color?: string | null;
  icono?: string | null;
  tipo?: string | null;
}

interface Estadisticas {
  total: number;
  completados: number;
  pendientes: number;
  fecha: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    habitos: HabitoHoy[];
    estadisticas: Estadisticas;
  };
}

export default function HabitosScreen() {
  const router = useRouter();
  
  // ✅ Obtenemos user y authFetch del contexto
  const { user, isLoading: authLoading, authFetch } = useAuth();
  const { palette } = useTheme();

  const [habitos, setHabitos] = useState<HabitoHoy[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    completados: 0,
    pendientes: 0,
    fecha: "today",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingHabit, setTogglingHabit] = useState<number | null>(null);
  const [statsModal, setStatsModal] = useState<"fecha" | "completados" | "pendientes" | null>(null);

  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate();
    const weekday = now.toLocaleDateString("es-ES", { weekday: "short" });
    const month = now.toLocaleDateString("es-ES", { month: "short" });
    return { day, weekday, month };
  };

  // ✅ Usa authFetch (incluye token automáticamente)
  const loadHabitosHoy = async () => {
    try {
      if (!user?.user_id) return;

      const response = await authFetch(`/api/usuario/${user.user_id}/habitos/hoy`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setHabitos(data.data.habitos);
        setEstadisticas(data.data.estadisticas);
      }
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  // ✅ Usa authFetch con método POST
  const toggleHabitCompletion = async (habitoUsuarioId: number) => {
    if (!user?.user_id || togglingHabit) return;

    setTogglingHabit(habitoUsuarioId);

    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habitoUsuarioId}/toggle`,
        { method: "POST" }
      );

      const result = await response.json();

      if (result.success) {
        setHabitos((prevHabitos) =>
          prevHabitos.map((habito) =>
            habito.habito_usuario_id === habitoUsuarioId
              ? { ...habito, completado_hoy: result.data.completado }
              : habito
          )
        );

        const updatedHabitos = habitos.map((habito) =>
          habito.habito_usuario_id === habitoUsuarioId
            ? { ...habito, completado_hoy: result.data.completado }
            : habito
        );

        const completados = updatedHabitos.filter((h) => h.completado_hoy).length;
        const pendientes = updatedHabitos.length - completados;

        setEstadisticas((prev) => ({ ...prev, completados, pendientes }));
      } else {
        Alert.alert("Error", "No se pudo actualizar el hábito");
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Error de conexión");
    } finally {
      setTogglingHabit(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabitosHoy();
    setRefreshing(false);
  };

  // ✅ SIMPLIFICADO: Carga datos cuando el usuario está disponible
  useEffect(() => {
    if (user?.user_id && !authLoading) {
    setLoading(true);
      loadHabitosHoy().finally(() => setLoading(false));
    }
  }, [user?.user_id, authLoading]);

  // ✅ Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        loadHabitosHoy();
      }
    }, [user?.user_id])
  );

  // ❌ ELIMINADO: useEffect con initializeData() - ya no necesario

  const { day, weekday, month } = getCurrentDate();
  const progress =
    estadisticas.total > 0
      ? Math.round((estadisticas.completados / estadisticas.total) * 100)
      : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={[styles.loadingText, { color: palette.textMuted }]}>Cargando hábitos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Mis Hábitos</Text>
          <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>{month} {day}, {weekday}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/seccion_habitos/tiposHabitos")}
        >
          <Ionicons name="add" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.dateCard} activeOpacity={0.8} onPress={() => setStatsModal("fecha")}>
            <LinearGradient colors={colors.gradients.primary} style={styles.dateCardGradient}>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateMonth}>{month}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: palette.surface }]}
            activeOpacity={0.8}
            onPress={() => setStatsModal("completados")}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary[500] + '20' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.secondary[600] }]}>
              {estadisticas.completados}
            </Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Completados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: palette.surface }]}
            activeOpacity={0.8}
            onPress={() => setStatsModal("pendientes")}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent.amber + "25" }]}>
              <Ionicons name="time" size={20} color={colors.accent.amber} />
            </View>
            <Text style={[styles.statNumber, { color: colors.accent.amber }]}>
              {estadisticas.pendientes}
            </Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Pendientes</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de información de stats */}
        <Modal
          visible={statsModal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setStatsModal(null)}
        >
          <TouchableOpacity style={styles.statsModalOverlay} activeOpacity={1} onPress={() => setStatsModal(null)}>
            <View style={[styles.statsModalCard, { backgroundColor: palette.surface }]}>
              {statsModal === "fecha" && (
                <>
                  <View style={styles.statsModalIconRow}>
                    <Ionicons name="calendar" size={28} color={colors.primary[600]} />
                  </View>
                  <Text style={[styles.statsModalTitle, { color: palette.heading }]}>Fecha de hoy</Text>
                  <Text style={[styles.statsModalText, { color: palette.textMuted }]}>
                    Hoy es <Text style={{ fontWeight: "700" }}>{weekday}, {day} de {month}</Text>.{"\n\n"}
                    Tienes <Text style={{ fontWeight: "700" }}>{estadisticas.total}</Text> hábitos programados para hoy.
                    Has completado <Text style={{ fontWeight: "700", color: colors.secondary[600] }}>{estadisticas.completados}</Text> y
                    te faltan <Text style={{ fontWeight: "700", color: colors.accent.amber }}>{estadisticas.pendientes}</Text>.
                  </Text>
                </>
              )}
              {statsModal === "completados" && (
                <>
                  <View style={styles.statsModalIconRow}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.secondary[600]} />
                  </View>
                  <Text style={[styles.statsModalTitle, { color: palette.heading }]}>Hábitos Completados</Text>
                  <Text style={[styles.statsModalText, { color: palette.textMuted }]}>
                    Has completado <Text style={{ fontWeight: "700", color: colors.secondary[600] }}>{estadisticas.completados}</Text> de{" "}
                    <Text style={{ fontWeight: "700", color: palette.text }}>{estadisticas.total}</Text> hábitos hoy.
                  </Text>
                  {habitos.filter(h => h.completado_hoy).map(h => (
                    <View key={h.habito_usuario_id} style={[styles.statsModalHabitRow, { borderBottomColor: palette.divider }]}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.secondary[500]} />
                      <Text style={[styles.statsModalHabitName, { color: palette.text }]}>{h.nombre}</Text>
                      {h.hora_completado && (
                        <Text style={[styles.statsModalHabitTime, { color: palette.textSubtle }]}>{h.hora_completado.slice(0, 5)}</Text>
                      )}
                    </View>
                  ))}
                  {estadisticas.completados === 0 && (
                    <Text style={[styles.statsModalEmpty, { color: palette.textMuted }]}>Aún no has completado ningún hábito hoy. ¡Ánimo!</Text>
                  )}
                </>
              )}
              {statsModal === "pendientes" && (
                <>
                  <View style={styles.statsModalIconRow}>
                    <Ionicons name="time" size={28} color={colors.accent.amber} />
                  </View>
                  <Text style={[styles.statsModalTitle, { color: palette.heading }]}>Hábitos Pendientes</Text>
                  <Text style={[styles.statsModalText, { color: palette.textMuted }]}>
                    Te faltan <Text style={{ fontWeight: "700", color: colors.accent.amber }}>{estadisticas.pendientes}</Text> hábitos por completar hoy.
                  </Text>
                  {habitos.filter(h => !h.completado_hoy).map(h => (
                    <View key={h.habito_usuario_id} style={[styles.statsModalHabitRow, { borderBottomColor: palette.divider }]}>
                      <Ionicons name="ellipse-outline" size={14} color={palette.icon} />
                      <Text style={[styles.statsModalHabitName, { color: palette.text }]}>{h.nombre}</Text>
                    </View>
                  ))}
                  {estadisticas.pendientes === 0 && (
                    <Text style={[styles.statsModalEmpty, { color: colors.secondary[600] }]}>¡Felicidades! Completaste todos tus hábitos de hoy.</Text>
                  )}
                </>
              )}
              <TouchableOpacity style={[styles.statsModalCloseBtn, { backgroundColor: palette.surfaceAlt }]} onPress={() => setStatsModal(null)}>
                <Text style={[styles.statsModalCloseText, { color: palette.textMuted }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Progress Bar */}
        {habitos.length > 0 && (
          <View style={[styles.progressSection, { backgroundColor: palette.surface }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: palette.text }]}>Progreso de Hoy</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: palette.surfaceAlt }]}>
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        )}

        {/* Habits List */}
        {habitos.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name="leaf-outline" size={48} color={palette.iconSubtle} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Sin hábitos aún</Text>
            <Text style={[styles.emptySubtitle, { color: palette.textMuted }]}>
              Empieza a construir mejores hábitos hoy
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <LinearGradient colors={colors.gradients.secondary} style={styles.createButtonGradient}>
                <Ionicons name="add" size={20} color={colors.neutral[0]} />
                <Text style={styles.createButtonText}>Crear nuevo hábito</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.habitsSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Hábitos de Hoy</Text>
            {habitos.map((habito) => {
              // Color personal del hábito tiene prioridad sobre el color de categoría
              const catColor = habito.color
                || (habito.categoria_id
                  ? getCategoryColor(habito.categoria_id)
                  : getCategoryColorByName(habito.categoria_nombre));
              const habitIcono = habito.icono || null;
              return (
              <View
                key={habito.habito_usuario_id}
                style={[
                  styles.habitCard,
                  { backgroundColor: palette.surface },
                  habito.completado_hoy && styles.habitCardCompleted,
                  habito.tipo === 'por_eliminar' && styles.habitCardWarning,
                ]}
              >
                <View style={[styles.habitCategoryBar, { backgroundColor: catColor }]} />
                <View style={styles.habitContent}>
                  {/* Checkbox - toggles completion */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      habito.completado_hoy && styles.checkboxCompleted,
                      habito.completado_hoy && { backgroundColor: catColor, borderColor: catColor },
                    ]}
                    onPress={() => toggleHabitCompletion(habito.habito_usuario_id)}
                    disabled={togglingHabit === habito.habito_usuario_id}
                    activeOpacity={0.7}
                  >
                    {togglingHabit === habito.habito_usuario_id ? (
                      <ActivityIndicator size="small" color={habito.completado_hoy ? colors.neutral[0] : colors.neutral[400]} />
                    ) : habito.completado_hoy ? (
                      <Ionicons name="checkmark" size={16} color={colors.neutral[0]} />
                    ) : null}
                  </TouchableOpacity>

                  {/* Habit Info - navigates to detail (whole right side is tappable) */}
                  <TouchableOpacity 
                    style={[styles.habitInfo, styles.habitInfoRow]}
                    onPress={() => router.push(`/seccion_habitos/detalleHabito?habito_usuario_id=${habito.habito_usuario_id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.habitNameRow}>
                        {habitIcono && (
                          <Ionicons name={safeIcon(habitIcono) as any} size={15} color={catColor} style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[styles.habitName, { color: palette.text }, habito.completado_hoy && styles.habitNameCompleted]}
                        >
                          {habito.nombre}
                        </Text>
                        {habito.tipo === 'por_eliminar' && (
                          <View style={[styles.customBadge, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={10} color="#EF4444" />
                            <Text style={[styles.customBadgeText, { color: '#EF4444' }]}>Eliminar</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.habitMeta}>
                        <Text style={[styles.habitCategory, { color: catColor }]}>{habito.categoria_nombre}</Text>
                        <View style={styles.habitPoints}>
                          <Ionicons name="diamond-outline" size={12} color={colors.primary[500]} />
                          <Text style={styles.habitPointsText}>{habito.puntos_base}</Text>
                        </View>
                      </View>
                      {habito.completado_hoy && habito.hora_completado && (
                        <Text style={styles.habitCompletedTime}>
                          Completado a las {habito.hora_completado.slice(0, 5)}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={palette.iconSubtle} />
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}

            {/* Add More Button */}
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={() => router.push("/seccion_habitos/tiposHabitos")}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />
              <Text style={[styles.addMoreText, { color: colors.primary[600] }]}>Agregar más hábitos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  dateCard: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  dateCardGradient: {
    padding: spacing[4],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
  },
  dateDay: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  dateMonth: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing[1],
  },
  statCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  statNumber: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  statsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  statsModalCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[6],
    width: "100%",
    maxWidth: 360,
  },
  statsModalIconRow: {
    alignItems: "center",
    marginBottom: spacing[3],
  },
  statsModalTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.neutral[800],
    textAlign: "center",
    marginBottom: spacing[3],
  },
  statsModalText: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  statsModalHabitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  statsModalHabitName: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[700],
  },
  statsModalHabitTime: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
  },
  statsModalEmpty: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    textAlign: "center",
    marginTop: spacing[2],
  },
  statsModalCloseBtn: {
    marginTop: spacing[4],
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  statsModalCloseText: {
    color: colors.neutral[0],
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
  },
  progressSection: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  progressTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  progressPercent: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary[600],
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
    marginBottom: spacing[6],
  },
  createButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
    shadowColor: colors.secondary[600],
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
  habitsSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[4],
  },
  habitCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  habitCardCompleted: {
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  habitCardWarning: {
    borderLeftWidth: 0,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  habitContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing[3],
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  habitCategoryBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    marginRight: spacing[3],
  },
  habitInfo: {
    flex: 1,
  },
  habitInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  habitNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  habitName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  habitNameCompleted: {
    color: colors.secondary[700],
  },
  customBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.md,
    gap: 3,
  },
  customBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  habitMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  habitCategory: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  habitPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  habitPointsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  habitCompletedTime: {
    fontSize: typography.size.xs,
    color: colors.secondary[600],
    marginTop: spacing[2],
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
    marginTop: spacing[2],
    gap: spacing[2],
  },
  addMoreText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
});
