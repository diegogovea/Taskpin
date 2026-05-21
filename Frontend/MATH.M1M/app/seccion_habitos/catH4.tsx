import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Toast } from "../../components/ui";
import AddHabitModal, { HabitConfig } from "../../components/ui/AddHabitModal";

interface Habito {
  habito_id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  frecuencia_recomendada: string;
  puntos_base: number;
  categoria_nombre?: string;
}

interface Recomendacion {
  habito_id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  puntos_base: number;
  score: number;
  razon: string;
}

const CATEGORY_ID = 4;
const CATEGORY_NAME = "Organización del Hogar";
const CATEGORY_ICON = "home";
const CATEGORY_COLOR = colors.accent.cyan;
const CATEGORY_DESCRIPTION = "Orden y mantenimiento doméstico";

export default function CatH4Screen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { palette } = useTheme();

  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [recomendados, setRecomendados] = useState<Recomendacion[]>([]);
  const [alreadyAddedIds, setAlreadyAddedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [previewHabito, setPreviewHabito] = useState<Habito | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ visible: true, message, type });

  const fetchHabitos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/habitos/categoria/${CATEGORY_ID}`);
      const data = await res.json();
      if (data.success) setHabitos(data.data);
    } catch { showToast('No se pudieron cargar los hábitos', 'error'); }
  };

  const fetchUserHabitoIds = async () => {
    if (!user?.user_id) return;
    try {
      const res = await authFetch(`/api/usuario/${user.user_id}/habitos/ids`);
      const data = await res.json();
      if (data.success) setAlreadyAddedIds(data.data);
    } catch { /* silent */ }
  };

  const fetchRecomendaciones = async () => {
    if (!user?.user_id) return;
    try {
      const res = await authFetch(`/api/ai/usuario/${user.user_id}/recomendaciones?limit=10`);
      const data = await res.json();
      if (data.success) {
        const filtradas = (data.recomendaciones as Recomendacion[]).filter(
          (r) => r.categoria === CATEGORY_NAME
        );
        setRecomendados(filtradas);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    Promise.all([fetchHabitos(), fetchUserHabitoIds(), fetchRecomendaciones()])
      .finally(() => setLoading(false));
  }, [user?.user_id]);

  const goBack = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/habitos");

  const handleAddConfirm = async (config: HabitConfig) => {
    if (!user?.user_id) return;
    setAdding(true);
    try {
      const res = await authFetch(`/api/usuario/${user.user_id}/habitos/con-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habito_id: config.habito_id,
          frecuencia_personal: config.frecuencia_personal,
          color: config.color,
          icono: config.icono,
          fecha_inicio: config.fecha_inicio,
          fecha_fin: config.fecha_fin,
          meta_valor: config.meta_valor,
          meta_unidad: config.meta_unidad || null,
          puntos_base_override: config.puntos_base,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPreviewHabito(null);
        setAlreadyAddedIds((prev) => [...prev, config.habito_id]);
        showToast(`"${config.nombre}" agregado exitosamente`);
        setTimeout(() => router.replace("/(tabs)/habitos"), 1500);
      } else {
        setPreviewHabito(null);
        showToast(result.detail || 'No se pudo agregar el hábito', 'error');
      }
    } catch {
      setPreviewHabito(null);
      showToast('Error de conexión', 'error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CATEGORY_COLOR} />
          <Text style={styles.loadingText}>Cargando hábitos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={[styles.header, { backgroundColor: palette.surface }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.surfaceAlt }]} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: CATEGORY_COLOR + "15" }]}>
            <Ionicons name={CATEGORY_ICON as any} size={32} color={CATEGORY_COLOR} />
          </View>
          <Text style={[styles.categoryTitle, { color: palette.heading }]}>{CATEGORY_NAME}</Text>
          <Text style={[styles.categoryDescription, { color: palette.textMuted }]}>{CATEGORY_DESCRIPTION}</Text>
        </View>

        {recomendados.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={16} color={CATEGORY_COLOR} />
              <Text style={[styles.sectionTitle, { color: palette.heading }]}>Recomendados para ti</Text>
            </View>
            {recomendados.map((rec) => {
              const isAdded = alreadyAddedIds.includes(rec.habito_id);
              const habito = habitos.find((h) => h.habito_id === rec.habito_id);
              const target = habito || { habito_id: rec.habito_id, nombre: rec.nombre, descripcion: rec.descripcion, puntos_base: rec.puntos_base, categoria_id: CATEGORY_ID, frecuencia_recomendada: 'diario' };
              return (
                <TouchableOpacity
                  key={rec.habito_id}
                  style={[styles.habitCard, styles.habitCardRecomendado, isAdded && styles.habitCardDisabled]}
                  disabled={isAdded || adding}
                  onPress={() => !isAdded && setPreviewHabito(target)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.recBadge, { backgroundColor: CATEGORY_COLOR + '20' }]}>
                    <Ionicons name="star" size={11} color={CATEGORY_COLOR} />
                    <Text style={[styles.recBadgeText, { color: CATEGORY_COLOR }]}>
                      {Math.round(rec.score * 100)}% compatible
                    </Text>
                  </View>
                  <View style={styles.habitContent}>
                    <View style={styles.habitInfo}>
                      {isAdded && (
                        <View style={styles.alreadyAddedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.secondary[500]} />
                          <Text style={styles.alreadyAddedText}>Ya agregado</Text>
                        </View>
                      )}
                      <Text style={[styles.habitName, isAdded && styles.habitNameDisabled]}>{rec.nombre}</Text>
                      {rec.descripcion ? <Text style={[styles.habitDescription, isAdded && styles.habitDescriptionDisabled]}>{rec.descripcion}</Text> : null}
                    </View>
                    {isAdded
                      ? <Ionicons name="checkmark-done" size={20} color={colors.secondary[500]} />
                      : <Ionicons name="add-circle-outline" size={22} color={CATEGORY_COLOR} />
                    }
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          {recomendados.length > 0 && <Text style={[styles.sectionTitle, { color: palette.heading }]}>Todos los hábitos</Text>}
          <View style={styles.habitsContainer}>
            {habitos.map((habito) => {
              const isAdded = alreadyAddedIds.includes(habito.habito_id);
              return (
                <TouchableOpacity
                  key={habito.habito_id}
                  style={[styles.habitCard, isAdded && styles.habitCardDisabled]}
                  disabled={isAdded || adding}
                  onPress={() => !isAdded && setPreviewHabito(habito)}
                  activeOpacity={0.8}
                >
                  <View style={styles.habitContent}>
                    <View style={styles.habitInfo}>
                      {isAdded && (
                        <View style={styles.alreadyAddedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.secondary[500]} />
                          <Text style={styles.alreadyAddedText}>Ya agregado</Text>
                        </View>
                      )}
                      <Text style={[styles.habitName, isAdded && styles.habitNameDisabled]}>{habito.nombre}</Text>
                      {habito.descripcion && (
                        <Text style={[styles.habitDescription, isAdded && styles.habitDescriptionDisabled]}>{habito.descripcion}</Text>
                      )}
                      <View style={styles.habitMeta}>
                        <View style={styles.metaBadge}>
                          <Ionicons name="diamond-outline" size={12} color={CATEGORY_COLOR} />
                          <Text style={[styles.metaBadgeText, { color: CATEGORY_COLOR }]}>{habito.puntos_base} pts</Text>
                        </View>
                        <View style={styles.metaBadge}>
                          <Ionicons name="refresh-outline" size={12} color={colors.neutral[500]} />
                          <Text style={styles.metaBadgeText}>{habito.frecuencia_recomendada}</Text>
                        </View>
                      </View>
                    </View>
                    {isAdded
                      ? <View style={styles.alreadyAddedIcon}><Ionicons name="checkmark-done" size={20} color={colors.secondary[500]} /></View>
                      : <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
                    }
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <AddHabitModal
        visible={previewHabito !== null}
        habito={previewHabito}
        categoryColor={CATEGORY_COLOR}
        onConfirm={handleAddConfirm}
        onCancel={() => setPreviewHabito(null)}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[0] },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: spacing[4], fontSize: typography.size.base, color: colors.neutral[500] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  backButton: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.neutral[100], justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingBottom: 40 },
  categoryHeader: { alignItems: "center", marginBottom: spacing[8] },
  categoryIconContainer: { width: 80, height: 80, borderRadius: radius["2xl"], justifyContent: "center", alignItems: "center", marginBottom: spacing[4] },
  categoryTitle: { fontSize: typography.size["2xl"], fontWeight: typography.weight.bold, color: colors.neutral[900], marginBottom: spacing[2] },
  categoryDescription: { fontSize: typography.size.base, color: colors.neutral[500], textAlign: "center", lineHeight: 22 },
  section: { marginBottom: spacing[6] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  sectionTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[800], marginBottom: spacing[3] },
  habitsContainer: { gap: spacing[3] },
  habitCard: { backgroundColor: colors.neutral[50], borderRadius: radius.xl, padding: spacing[4], borderWidth: 1.5, borderColor: colors.neutral[200] },
  habitCardRecomendado: { borderColor: CATEGORY_COLOR + '40', backgroundColor: CATEGORY_COLOR + '08' },
  habitCardDisabled: { opacity: 0.6, backgroundColor: colors.neutral[100], borderColor: colors.neutral[200] },
  habitContent: { flexDirection: "row", alignItems: "center" },
  habitInfo: { flex: 1, marginRight: spacing[3] },
  habitName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.neutral[800], marginBottom: spacing[1] },
  habitNameDisabled: { color: colors.neutral[400] },
  habitDescription: { fontSize: typography.size.sm, color: colors.neutral[500], lineHeight: 20, marginBottom: spacing[3] },
  habitDescriptionDisabled: { color: colors.neutral[400] },
  alreadyAddedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing[1] },
  alreadyAddedText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.secondary[500] },
  alreadyAddedIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondary[50], justifyContent: "center", alignItems: "center" },
  habitMeta: { flexDirection: "row", gap: spacing[2] },
  metaBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.neutral[100], paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius.md, gap: 4 },
  metaBadgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.neutral[500] },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.md, alignSelf: 'flex-start', marginBottom: spacing[2] },
  recBadgeText: { fontSize: 10, fontWeight: '700' },
});
