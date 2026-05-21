import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#14B8A6',
  '#3B82F6', '#06B6D4', '#84CC16', '#64748B',
];

const PRESET_ICONS = [
  'leaf-outline',       'fitness-outline',    'barbell-outline',    'bicycle-outline',
  'heart-outline',      'water-outline',      'moon-outline',       'sunny-outline',
  'book-outline',       'musical-notes-outline','brush-outline',    'code-outline',
  'fast-food-outline',  'walk-outline',       'medkit-outline',     'sparkles-outline',
  'trophy-outline',     'star-outline',       'people-outline',     'school-outline',
  'stopwatch-outline',  'headset-outline',    'pencil-outline',     'flag-outline',
];

interface Recomendacion {
  habito_id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  puntos_base: number;
  score: number;
  razon: string;
}

interface Prediccion {
  habito_usuario_id: number;
  habito_id: number;
  nombre: string;
  probabilidad: number;
  factores_positivos: string[];
  factores_negativos: string[];
}

export default function AIScreen() {
  const { user, isLoading: authLoading, authFetch } = useAuth();
  const { palette } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [addingHabit, setAddingHabit] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<"sugerencias" | "promedio" | "confianza" | null>(null);
  const [showSugeridosInfo, setShowSugeridosInfo] = useState(false);
  const router = useRouter();

  // Customize modal state
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recomendacion | null>(null);
  const [custColor, setCustColor] = useState<string | null>(null);
  const [custIcono, setCustIcono] = useState<string | null>(null);
  const [custTipo, setCustTipo] = useState<'bueno' | 'por_eliminar'>('bueno');
  const [custFrecuencia, setCustFrecuencia] = useState<string>('diario');
  const [custMetaValor, setCustMetaValor] = useState('');
  const [custMetaUnidad, setCustMetaUnidad] = useState('');
  const [custFechaDisplay, setCustFechaDisplay] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  const loadRecomendaciones = async (userId: number) => {
    try {
      const response = await authFetch(`/api/ai/usuario/${userId}/recomendaciones?limit=5`);
      const data = await response.json();
      if (data.success) {
        setRecomendaciones(data.recomendaciones || []);
      }
    } catch (error) {
      console.error("Error loading recomendaciones:", error);
      setRecomendaciones([]);
    }
  };

  const loadPredicciones = async (userId: number) => {
    try {
      const response = await authFetch(`/api/ai/usuario/${userId}/predicciones/hoy`);
      const data = await response.json();
      if (data.success) {
        setPredicciones(data.predicciones || []);
      }
    } catch (error) {
      console.error("Error loading predicciones:", error);
      setPredicciones([]);
    }
  };

  const formatDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const displayToIso = (display: string) => {
    const digits = display.replace(/\D/g, '');
    if (digits.length !== 8) return '';
    const dd = digits.slice(0, 2), mm = digits.slice(2, 4), yyyy = digits.slice(4, 8);
    if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return '';
    return `${yyyy}-${mm}-${dd}`;
  };

  const openCustomize = (rec: Recomendacion) => {
    setSelectedRec(rec);
    setCustColor(null);
    setCustIcono(null);
    setCustTipo('bueno');
    setCustFrecuencia('diario');
    setCustMetaValor('');
    setCustMetaUnidad('');
    setCustFechaDisplay('');
    setShowCustomize(true);
  };

  const handleAgregarConConfig = async () => {
    if (!user?.user_id || !selectedRec || savingCustom) return;
    setSavingCustom(true);
    try {
      const isoFecha = displayToIso(custFechaDisplay);
      const body: Record<string, unknown> = {
        habito_id: selectedRec.habito_id,
        frecuencia_personal: custFrecuencia,
        color: custColor || null,
        icono: custIcono || null,
        fecha_fin: isoFecha || null,
        meta_valor: custMetaValor ? parseFloat(custMetaValor) : null,
        meta_unidad: custMetaUnidad || null,
      };
      const res = await authFetch(`/api/usuario/${user.user_id}/habitos/con-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 409) {
        setShowCustomize(false);
        // Cache invalidado en backend — esperar un momento y recargar frescos
        setTimeout(() => {
          if (user?.user_id) {
            loadRecomendaciones(user.user_id);
            loadPredicciones(user.user_id);
          }
        }, 500);
        return;
      }
      if (data.success) {
        setShowCustomize(false);
        if (custTipo === 'por_eliminar' && data.data?.habito_usuario_id) {
          await authFetch(`/api/usuario/${user.user_id}/habito/${data.data.habito_usuario_id}/campos-extra`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'por_eliminar' }),
          });
        }
        setTimeout(() => {
          if (user?.user_id) {
            loadRecomendaciones(user.user_id);
            loadPredicciones(user.user_id);
          }
        }, 500);
      } else {
        Alert.alert('Error', data.detail || 'No se pudo agregar el habito');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo agregar el habito');
    } finally {
      setSavingCustom(false);
    }
  };

  const loadAllData = async () => {
    try {
      if (!user?.user_id) return;
      await Promise.all([
        loadRecomendaciones(user.user_id),
        loadPredicciones(user.user_id),
      ]);
    } catch (error) {
      console.error("Error loading AI data:", error);
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
    if (user?.user_id && !authLoading) {
      setLoading(true);
      loadAllData();
    }
  }, [user?.user_id, authLoading]);

  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        loadAllData();
      }
    }, [user?.user_id])
  );

  const handleAgregarHabito = async (habitoId: number) => {
    if (!user?.user_id || addingHabit) return;
    setAddingHabit(habitoId);
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/habitos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.user_id,
          habito_id: habitoId, 
          frecuencia_personal: "diario" 
        }),
      });
      const data = await response.json();
      if (data.success || data.habito_usuario_id) {
        Alert.alert("Listo", "Hábito agregado a tu lista");
        loadRecomendaciones(user.user_id);
        loadPredicciones(user.user_id);
      } else {
        Alert.alert("Error", data.detail || "No se pudo agregar el hábito");
      }
    } catch (error) {
      console.error("Error adding habit:", error);
      Alert.alert("Error", "No se pudo agregar el hábito");
    } finally {
      setAddingHabit(null);
    }
  };

  const getProgressColor = (prob: number) => {
    if (prob >= 0.6) return colors.secondary[500];
    if (prob >= 0.4) return colors.accent.amber;
    return colors.semantic.error;
  };

  // Stats calculados
  const avgPrediction = predicciones.length > 0
    ? Math.round(predicciones.reduce((sum, p) => sum + p.probabilidad * 100, 0) / predicciones.length)
    : 0;
  const highConfidence = predicciones.filter(p => p.probabilidad >= 0.6).length;

  const TOOLTIP_INFO = {
    sugerencias: {
      title: "¿Qué son las Sugerencias?",
      body: "Son hábitos que la IA recomienda basándose en usuarios con un perfil similar al tuyo. El porcentaje que ves junto a cada uno indica qué tan compatible es ese hábito con tus rutinas.",
      icon: "bulb" as const,
      color: colors.primary[600],
    },
    promedio: {
      title: "Probabilidad de éxito promedio",
      body: "Es el promedio de la probabilidad que la IA calcula para cada uno de tus hábitos activos. Se basa en tu historial reciente: racha, días de la semana y tasa de completado.",
      icon: "trending-up" as const,
      color: colors.secondary[600],
    },
    confianza: {
      title: "Hábitos con alta probabilidad",
      body: "Son los hábitos donde la IA predice al menos un 60% de probabilidad de que los completes hoy. Estos son los que más te conviene priorizar en tu día.",
      icon: "star" as const,
      color: colors.accent.amber,
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={[styles.loadingText, { color: palette.textMuted }]}>Cargando información de IA...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Información IA</Text>
          <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>Personalizado para ti</Text>
        </View>
        <Ionicons name="sparkles" size={28} color={colors.primary[500]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards — tappables con explicación */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: palette.surface }]}
            activeOpacity={0.75}
            onPress={() => setActiveTooltip("sugerencias")}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="bulb" size={20} color={colors.primary[600]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.primary[600] }]}>
              {recomendaciones.length}
            </Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Sugerencias</Text>
            <Ionicons name="information-circle-outline" size={12} color={colors.neutral[300]} style={styles.statInfoIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: palette.surface }]}
            activeOpacity={0.75}
            onPress={() => setActiveTooltip("promedio")}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="trending-up" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.secondary[600] }]}>
              {avgPrediction}%
            </Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Prob. de éxito{"\n"}promedio</Text>
            <Ionicons name="information-circle-outline" size={12} color={colors.neutral[300]} style={styles.statInfoIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: palette.surface }]}
            activeOpacity={0.75}
            onPress={() => setActiveTooltip("confianza")}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent.amber + "25" }]}>
              <Ionicons name="star" size={20} color={colors.accent.amber} />
            </View>
            <Text style={[styles.statNumber, { color: colors.accent.amber }]}>
              {highConfidence}
            </Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Hábitos con{"\n"}≥60% de éxito</Text>
            <Ionicons name="information-circle-outline" size={12} color={colors.neutral[300]} style={styles.statInfoIcon} />
          </TouchableOpacity>
        </View>

        {/* Modal de explicación de stats */}
        <Modal
          visible={activeTooltip !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveTooltip(null)}
        >
          <TouchableOpacity
            style={styles.tooltipOverlay}
            activeOpacity={1}
            onPress={() => setActiveTooltip(null)}
          >
            <View style={[styles.tooltipCard, { backgroundColor: palette.surface }]}>
              {activeTooltip && (
                <>
                  <View style={[styles.tooltipIconWrap, { backgroundColor: TOOLTIP_INFO[activeTooltip].color + "15" }]}>
                    <Ionicons
                      name={TOOLTIP_INFO[activeTooltip].icon}
                      size={28}
                      color={TOOLTIP_INFO[activeTooltip].color}
                    />
                  </View>
                  <Text style={[styles.tooltipTitle, { color: palette.heading }]}>{TOOLTIP_INFO[activeTooltip].title}</Text>
                  <Text style={[styles.tooltipBody, { color: palette.textMuted }]}>{TOOLTIP_INFO[activeTooltip].body}</Text>
                </>
              )}
              <TouchableOpacity
                style={styles.tooltipCloseBtn}
                onPress={() => setActiveTooltip(null)}
              >
                <Text style={styles.tooltipCloseTxt}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal informativo de Hábitos Sugeridos */}
        <Modal
          visible={showSugeridosInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSugeridosInfo(false)}
        >
          <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={() => setShowSugeridosInfo(false)}>
            <View style={[styles.tooltipCard, { backgroundColor: palette.surface }]}>
              <Text style={[styles.tooltipTitle, { color: palette.heading }]}>¿Qué son los Hábitos Sugeridos?</Text>
              <Text style={[styles.tooltipText, { color: palette.textMuted }]}>
                Estos hábitos son recomendados por nuestra IA basándose en hábitos que otras personas con un perfil similar al tuyo han adoptado con éxito.{"\n\n"}
                El porcentaje de <Text style={{ fontWeight: "700" }}>coincidencia</Text> indica qué tan compatible es cada hábito con tu perfil, historial y objetivos actuales. A mayor porcentaje, mejor se adapta a ti.{"\n\n"}
                Pulsa el ➕ para agregar un hábito sugerido a tu lista, o toca la fila para ver sus detalles y modificarlo antes de añadirlo.
              </Text>
              <TouchableOpacity style={[styles.tooltipClose, { backgroundColor: palette.surfaceAlt }]} onPress={() => setShowSugeridosInfo(false)}>
                <Text style={[styles.tooltipCloseText, { color: palette.textMuted }]}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Hábitos Sugeridos</Text>
            <TouchableOpacity onPress={() => setShowSugeridosInfo(true)} style={styles.infoBtn}>
              <Ionicons name="information-circle-outline" size={20} color={palette.icon} />
            </TouchableOpacity>
          </View>

          {recomendaciones.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="checkmark-done-circle" size={48} color={colors.secondary[400]} />
              </View>
              <Text style={styles.emptyTitle}>¡Sin sugerencias nuevas!</Text>
              <Text style={styles.emptySubtitle}>Ya tienes en tu lista todos los hábitos que te recomendaríamos. ¡Sigue así! 💪</Text>
            </View>
          ) : (
            recomendaciones.map((rec, index) => (
              <View
                key={rec.habito_id}
                style={[styles.habitCard, { backgroundColor: palette.surface }, index === 0 && styles.habitCardHighlight]}
              >
                <View style={styles.habitContent}>
                  {/* Botón agregar — abre modal de personalización */}
                  <TouchableOpacity
                    style={[styles.checkbox, index === 0 && styles.checkboxHighlight]}
                    onPress={() => openCustomize(rec)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={colors.primary[600]} />
                  </TouchableOpacity>

                  {/* Habit Info — abre modal de personalización */}
                  <TouchableOpacity
                    style={[styles.habitInfo, { flexDirection: "row", alignItems: "center" }]}
                    activeOpacity={0.7}
                    onPress={() => openCustomize(rec)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.habitNameRow}>
                        <Text style={[styles.habitName, { color: palette.text }]}>{rec.nombre}</Text>
                        {index === 0 && (
                          <View style={styles.topBadge}>
                            <Ionicons name="star" size={10} color={colors.neutral[0]} />
                            <Text style={styles.topBadgeText}>Mejor opción</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.habitMeta}>
                        <Text style={[styles.habitCategory, { color: palette.textMuted }]}>{rec.categoria || "Sin categoría"}</Text>
                        <View style={styles.habitPoints}>
                          <Ionicons name="people" size={12} color={colors.primary[500]} />
                          <Text style={styles.habitPointsText}>{Math.round(rec.score * 100)}% coincidencia</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={palette.iconSubtle} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Predictions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Predicciones de Hoy</Text>
          <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>El porcentaje indica la probabilidad de que completes cada hábito hoy, basado en tu historial.</Text>

          {predicciones.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="fitness-outline" size={48} color={palette.iconSubtle} />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>Sin predicciones aún</Text>
              <Text style={[styles.emptySubtitle, { color: palette.textMuted }]}>Agrega hábitos para ver predicciones de éxito</Text>
            </View>
          ) : (
            predicciones.map((pred) => (
              <View key={pred.habito_usuario_id} style={[styles.predictionCard, { backgroundColor: palette.surface }]}>
                <View style={styles.predictionHeader}>
                  <View style={styles.predictionInfo}>
                    <Text style={[styles.predictionName, { color: palette.text }]} numberOfLines={1}>
                      {pred.nombre}
                    </Text>
                    <View style={styles.predictionFactors}>
                      {pred.factores_positivos.slice(0, 2).map((f, i) => (
                        <View key={`pos-${i}`} style={styles.factorBadge}>
                          <Ionicons name="checkmark" size={10} color={colors.secondary[600]} />
                          <Text style={styles.factorText}>{f}</Text>
                        </View>
                      ))}
                      {pred.factores_negativos.slice(0, 1).map((f, i) => (
                        <View key={`neg-${i}`} style={[styles.factorBadge, styles.factorBadgeNegative]}>
                          <Ionicons name="alert" size={10} color={colors.accent.amber} />
                          <Text style={[styles.factorText, styles.factorTextNegative]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.predictionPercent, { color: getProgressColor(pred.probabilidad) }]}>
                    {Math.round(pred.probabilidad * 100)}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: palette.surfaceAlt }]}>
                  <LinearGradient
                    colors={
                      pred.probabilidad >= 0.6
                        ? colors.gradients.secondary
                        : pred.probabilidad >= 0.4
                        ? ["#FCD34D", "#F59E0B"]
                        : ["#FCA5A5", "#EF4444"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${Math.round(pred.probabilidad * 100)}%` }]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={styles.infoText}>
            Las predicciones de la IA mejoran cuando registras más hábitos. ¡Sigue anotando tu progreso!
          </Text>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal: Personalizar y agregar hábito de IA ── */}
      <Modal visible={showCustomize} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCustomize(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[custStyles.modalContainer, { backgroundColor: palette.bg }]}>
            {/* Header */}
            <View style={[custStyles.modalHeader, { borderBottomColor: palette.border }]}>
              <TouchableOpacity onPress={() => setShowCustomize(false)}>
                <Text style={[custStyles.cancelBtn, { color: palette.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[custStyles.modalTitle, { color: palette.heading }]}>Personalizar hábito</Text>
              <TouchableOpacity
                onPress={handleAgregarConConfig}
                disabled={savingCustom}
                style={[custStyles.saveBtn, { opacity: savingCustom ? 0.6 : 1 }]}
              >
                {savingCustom
                  ? <ActivityIndicator size="small" color={colors.neutral[0]} />
                  : <Text style={custStyles.saveBtnText}>Agregar</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing[5] }} keyboardShouldPersistTaps="handled">
              {/* Preview del hábito */}
              {selectedRec && (
                <View style={[custStyles.previewCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <Text style={[custStyles.previewName, { color: palette.heading }]}>{selectedRec.nombre}</Text>
                  {selectedRec.descripcion ? (
                    <Text style={[custStyles.previewDesc, { color: palette.textMuted }]}>{selectedRec.descripcion}</Text>
                  ) : null}
                  <View style={custStyles.previewMeta}>
                    {selectedRec.categoria ? (
                      <View style={[custStyles.categoryBadge, { backgroundColor: palette.surfaceAlt }]}>
                        <Text style={[custStyles.categoryBadgeText, { color: palette.textMuted }]}>{selectedRec.categoria}</Text>
                      </View>
                    ) : null}
                    <View style={[custStyles.categoryBadge, { backgroundColor: colors.primary[50] }]}>
                      <Ionicons name="people" size={11} color={colors.primary[600]} />
                      <Text style={[custStyles.categoryBadgeText, { color: colors.primary[600] }]}>
                        {Math.round(selectedRec.score * 100)}% coincidencia
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Frecuencia */}
              <Text style={[custStyles.label, { color: palette.heading }]}>Frecuencia</Text>
              <View style={custStyles.freqChipsWrap}>
                {([
                  { value: 'diario', label: 'Diario' },
                  { value: 'cada_2_dias', label: 'Cada 2 días' },
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'cada_2_semanas', label: 'Cada 2 sem.' },
                  { value: 'mensual', label: 'Mensual' },
                  { value: 'cada_2_meses', label: 'Cada 2 mes.' },
                ] as const).map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[custStyles.freqChip, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }, custFrecuencia === opt.value && custStyles.freqChipActive]}
                    onPress={() => setCustFrecuencia(opt.value)}
                  >
                    <Text style={[custStyles.freqChipText, { color: palette.textMuted }, custFrecuencia === opt.value && custStyles.freqChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color */}
              <Text style={[custStyles.label, { color: palette.heading, marginTop: spacing[5] }]}>Color</Text>
              <View style={custStyles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[custStyles.colorSwatch, { backgroundColor: c }, custColor === c && custStyles.swatchSelected]}
                    onPress={() => setCustColor(c)}
                  >
                    {custColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[custStyles.colorSwatch, { backgroundColor: palette.surfaceAlt }, !custColor && custStyles.swatchSelected]}
                  onPress={() => setCustColor(null)}
                >
                  <Ionicons name="close" size={14} color={palette.icon} />
                </TouchableOpacity>
              </View>

              {/* Icono */}
              <Text style={[custStyles.label, { color: palette.heading, marginTop: spacing[5] }]}>Icono</Text>
              <View style={custStyles.iconGrid}>
                {PRESET_ICONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    style={[custStyles.iconSwatch, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }, custIcono === ic && custStyles.swatchSelected]}
                    onPress={() => setCustIcono(ic)}
                  >
                    <Ionicons name={ic as any} size={20} color={custIcono === ic ? colors.primary[600] : palette.icon} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[custStyles.iconSwatch, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }, !custIcono && custStyles.swatchSelected]}
                  onPress={() => setCustIcono(null)}
                >
                  <Ionicons name="close" size={20} color={palette.icon} />
                </TouchableOpacity>
              </View>

              {/* Tipo */}
              <Text style={[custStyles.label, { color: palette.heading, marginTop: spacing[5] }]}>Tipo</Text>
              <View style={custStyles.tipoRow}>
                <TouchableOpacity
                  style={[custStyles.tipoBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }, custTipo === 'bueno' && custStyles.tipoBtnActive]}
                  onPress={() => setCustTipo('bueno')}
                >
                  <Ionicons name="trending-up" size={14} color={custTipo === 'bueno' ? colors.secondary[600] : palette.icon} />
                  <Text style={[custStyles.tipoBtnText, { color: palette.textMuted }, custTipo === 'bueno' && { color: colors.secondary[600] }]}>
                    Habito positivo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[custStyles.tipoBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }, custTipo === 'por_eliminar' && custStyles.tipoBtnElim]}
                  onPress={() => setCustTipo('por_eliminar')}
                >
                  <Ionicons name="trending-down" size={14} color={custTipo === 'por_eliminar' ? colors.semantic.error : palette.icon} />
                  <Text style={[custStyles.tipoBtnText, { color: palette.textMuted }, custTipo === 'por_eliminar' && { color: colors.semantic.error }]}>
                    Habito a eliminar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Meta diaria */}
              <Text style={[custStyles.label, { color: palette.heading, marginTop: spacing[5] }]}>Meta diaria (opcional)</Text>
              <View style={custStyles.metaRow}>
                <TextInput
                  style={[custStyles.metaInput, { flex: 1, backgroundColor: palette.surfaceAlt, borderColor: palette.border, color: palette.text }]}
                  value={custMetaValor}
                  onChangeText={setCustMetaValor}
                  keyboardType="numeric"
                  placeholder="Ej: 30"
                  placeholderTextColor={palette.textMuted}
                />
                <TextInput
                  style={[custStyles.metaInput, { flex: 1.4, backgroundColor: palette.surfaceAlt, borderColor: palette.border, color: palette.text }]}
                  value={custMetaUnidad}
                  onChangeText={setCustMetaUnidad}
                  placeholder="Ej: minutos, vasos, km..."
                  placeholderTextColor={palette.textMuted}
                />
              </View>

              {/* Fecha de fin */}
              <Text style={[custStyles.label, { color: palette.heading, marginTop: spacing[5] }]}>Fecha de fin (opcional)</Text>
              <View style={[custStyles.metaInput, { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
                <Ionicons name="calendar-outline" size={16} color={palette.icon} style={{ marginRight: spacing[2] }} />
                <TextInput
                  style={{ flex: 1, color: palette.text, fontSize: typography.size.base }}
                  value={custFechaDisplay}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="numeric"
                  maxLength={10}
                  onChangeText={raw => setCustFechaDisplay(formatDateInput(raw))}
                />
                {custFechaDisplay.length > 0 && (
                  <TouchableOpacity onPress={() => setCustFechaDisplay('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color={palette.icon} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[custStyles.hint, { color: palette.textMuted }]}>Dejalo en blanco si el habito no tiene fecha limite</Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerIcon: {
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
  statsContainer: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: "center",
    ...shadows.sm,
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
    textAlign: "center",
  },
  statInfoIcon: {
    marginTop: spacing[1],
  },

  // Tooltip modal
  tooltipOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,30,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  tooltipCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius["2xl"],
    padding: spacing[6],
    width: "100%",
    alignItems: "center",
    ...shadows.xl,
  },
  tooltipIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  tooltipTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    textAlign: "center",
    marginBottom: spacing[3],
  },
  tooltipBody: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  tooltipCloseBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: radius.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
  },
  tooltipCloseTxt: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  infoBtn: {
    padding: 2,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[4],
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[8],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: "dashed",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  habitCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  habitCardHighlight: {
    borderWidth: 2,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50] + "50",
  },
  habitContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    marginRight: spacing[3],
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxHighlight: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  habitInfo: {
    flex: 1,
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
    flex: 1,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.md,
    gap: 3,
  },
  topBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
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
  predictionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  predictionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing[3],
  },
  predictionInfo: {
    flex: 1,
  },
  predictionName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[2],
  },
  predictionFactors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
  },
  factorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.md,
    gap: 3,
  },
  factorBadgeNegative: {
    backgroundColor: colors.accent.amber + "20",
  },
  factorText: {
    fontSize: typography.size.xs,
    color: colors.secondary[700],
  },
  factorTextNegative: {
    color: colors.accent.amber,
  },
  predictionPercent: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginLeft: spacing[3],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%" as any,
    borderRadius: 4,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.primary[700],
    lineHeight: 20,
  },
});

const custStyles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  cancelBtn: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  modalTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold },
  saveBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.neutral[0], fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  previewCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  previewName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, marginBottom: spacing[1] },
  previewDesc: { fontSize: typography.size.sm, lineHeight: 20, marginBottom: spacing[3] },
  previewMeta: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  categoryBadgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, marginBottom: spacing[3] },
  hint: { fontSize: typography.size.xs, marginTop: spacing[1] },
  freqChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  freqChip: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1,
  },
  freqChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  freqChipText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  freqChipTextActive: { color: colors.neutral[0] },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  iconSwatch: {
    width: 44, height: 44, borderRadius: radius.lg, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  swatchSelected: { borderWidth: 2, borderColor: colors.primary[500] },
  tipoRow: { flexDirection: 'row', gap: spacing[3] },
  tipoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], paddingVertical: spacing[3], borderRadius: radius.lg, borderWidth: 1,
  },
  tipoBtnActive: { backgroundColor: colors.secondary[50], borderColor: colors.secondary[400] },
  tipoBtnElim: { backgroundColor: '#FEE2E2', borderColor: colors.semantic.error },
  tipoBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  metaRow: { flexDirection: 'row', gap: spacing[3] },
  metaInput: {
    borderWidth: 1, borderRadius: radius.lg,
    paddingHorizontal: spacing[3], paddingVertical: spacing[3],
    fontSize: typography.size.base,
  },
});
