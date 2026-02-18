import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";
import { ConfirmModal } from "../../components/modals";
import { Toast } from "../../components/ui";

interface Habito {
  habito_id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  frecuencia_recomendada: string;
  puntos_base: number;
}

export default function CatH3Screen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [alreadyAddedIds, setAlreadyAddedIds] = useState<number[]>([]);
  
  // Modal & Toast states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const CATEGORY_ID = 3;
  const CATEGORY_NAME = "Mente y Enfoque";
  const CATEGORY_ICON = "bulb";
  const CATEGORY_COLOR = colors.primary[600];
  const CATEGORY_DESCRIPTION = "Desarrollo mental y concentración";

  const fetchHabitos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/habitos/categoria/${CATEGORY_ID}`);
      const data = await response.json();
      if (data.success) setHabitos(data.data);
    } catch (error) {
      setToast({ visible: true, message: 'No se pudieron cargar los hábitos', type: 'error' });
    }
  };

  const fetchUserHabitoIds = async () => {
    if (!user?.user_id) return;
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/habitos/ids`);
      const data = await response.json();
      if (data.success) setAlreadyAddedIds(data.data);
    } catch (error) {
      console.error("Error fetching user habit ids:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchHabitos(), fetchUserHabitoIds()]);
      setLoading(false);
    };
    loadData();
  }, [user?.user_id]);

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/habitos");
  };

  const toggleHabitSelection = (habitId: number) => {
    setSelectedHabits((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  // Handle "Add Habits" button press - shows confirmation modal
  const handleAddPress = () => {
    if (selectedHabits.length === 0) {
      setToast({ visible: true, message: 'Por favor selecciona al menos un hábito', type: 'error' });
      return;
    }
    setShowConfirmModal(true);
  };

  // Actually add the habits after confirmation
  const agregarHabitos = async () => {
    if (!user?.user_id) {
      setToast({ visible: true, message: 'Usuario no encontrado', type: 'error' });
      return;
    }

    setAdding(true);
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habitos/multiple`,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: user.user_id,
            habito_ids: selectedHabits,
            frecuencia_personal: "diario",
          }),
        }
      );
      const result = await response.json();
      if (result.success) {
        const count = result.data.added_habitos.length;
        setShowConfirmModal(false);
        setSelectedHabits([]);
        setToast({
          visible: true,
          message: `${count} hábito${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} exitosamente!`,
          type: 'success',
        });
        setTimeout(() => {
          router.replace("/(tabs)/habitos");
        }, 1500);
      } else {
        setShowConfirmModal(false);
        setToast({ visible: true, message: 'No se pudieron agregar los hábitos. Intenta de nuevo.', type: 'error' });
      }
    } catch (error) {
      setShowConfirmModal(false);
      setToast({ visible: true, message: 'Error de conexión. Por favor intenta de nuevo.', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando hábitos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        {selectedHabits.length > 0 && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>{selectedHabits.length}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: CATEGORY_COLOR + "15" }]}>
            <Ionicons name={CATEGORY_ICON as any} size={32} color={CATEGORY_COLOR} />
          </View>
          <Text style={styles.categoryTitle}>{CATEGORY_NAME}</Text>
          <Text style={styles.categoryDescription}>{CATEGORY_DESCRIPTION}</Text>
        </View>

        <View style={styles.habitsContainer}>
          {habitos.map((habito) => {
            const isSelected = selectedHabits.includes(habito.habito_id);
            const isAlreadyAdded = alreadyAddedIds.includes(habito.habito_id);
            return (
              <TouchableOpacity
                key={habito.habito_id}
                style={[styles.habitCard, isSelected && styles.habitCardSelected, isAlreadyAdded && styles.habitCardDisabled]}
                activeOpacity={isAlreadyAdded ? 1 : 0.8}
                onPress={() => !isAlreadyAdded && toggleHabitSelection(habito.habito_id)}
                disabled={isAlreadyAdded}
              >
                <View style={styles.habitContent}>
                  <View style={styles.habitInfo}>
                    {isAlreadyAdded && (
                      <View style={styles.alreadyAddedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.secondary[500]} />
                        <Text style={styles.alreadyAddedText}>Ya agregado</Text>
                      </View>
                    )}
                    <Text style={[styles.habitName, isSelected && styles.habitNameSelected, isAlreadyAdded && styles.habitNameDisabled]}>{habito.nombre}</Text>
                    {habito.descripcion && (
                      <Text style={[styles.habitDescription, isSelected && styles.habitDescriptionSelected, isAlreadyAdded && styles.habitDescriptionDisabled]}>{habito.descripcion}</Text>
                    )}
                    <View style={styles.habitMeta}>
                      <View style={[styles.metaBadge, isSelected && styles.metaBadgeSelected, isAlreadyAdded && styles.metaBadgeDisabled]}>
                        <Ionicons name="diamond-outline" size={12} color={isAlreadyAdded ? colors.neutral[400] : (isSelected ? colors.neutral[0] : colors.primary[600])} />
                        <Text style={[styles.metaBadgeText, isSelected && styles.metaBadgeTextSelected, isAlreadyAdded && styles.metaBadgeTextDisabled]}>{habito.puntos_base} pts</Text>
                      </View>
                      <View style={[styles.metaBadge, isSelected && styles.metaBadgeSelected, isAlreadyAdded && styles.metaBadgeDisabled]}>
                        <Ionicons name="refresh-outline" size={12} color={isAlreadyAdded ? colors.neutral[400] : (isSelected ? colors.neutral[0] : colors.neutral[500])} />
                        <Text style={[styles.metaBadgeText, { color: isAlreadyAdded ? colors.neutral[400] : (isSelected ? colors.neutral[0] : colors.neutral[500]) }]}>{habito.frecuencia_recomendada}</Text>
                      </View>
                    </View>
                  </View>
                  {isAlreadyAdded ? (
                    <View style={styles.alreadyAddedIcon}>
                      <Ionicons name="checkmark-done" size={20} color={colors.secondary[500]} />
                    </View>
                  ) : (
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={18} color={colors.neutral[0]} />}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedHabits.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity style={styles.floatingButton} onPress={handleAddPress} disabled={adding} activeOpacity={0.9}>
            <LinearGradient colors={colors.gradients.secondary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.floatingButtonGradient}>
              {adding ? <ActivityIndicator color={colors.neutral[0]} size="small" /> : (
                <>
                  <Ionicons name="add-circle" size={22} color={colors.neutral[0]} />
                  <Text style={styles.floatingButtonText}>Agregar {selectedHabits.length} Hábito{selectedHabits.length > 1 ? "s" : ""}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        title="¿Agregar Hábitos?"
        message={`Estás a punto de agregar ${selectedHabits.length} hábito${selectedHabits.length > 1 ? 's' : ''} a tu rutina diaria.`}
        icon="add-circle-outline"
        iconColor={colors.secondary[500]}
        confirmText="Agregar"
        cancelText="Cancelar"
        confirmGradient={colors.gradients.secondary as readonly [string, string, ...string[]]}
        isLoading={adding}
        onConfirm={agregarHabitos}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[0] },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: spacing[4], fontSize: typography.size.base, color: colors.neutral[500] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  backButton: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.neutral[100], justifyContent: "center", alignItems: "center" },
  selectedBadge: { backgroundColor: colors.primary[600], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  selectedBadgeText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.neutral[0] },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingBottom: 120 },
  categoryHeader: { alignItems: "center", marginBottom: spacing[8] },
  categoryIconContainer: { width: 80, height: 80, borderRadius: radius["2xl"], justifyContent: "center", alignItems: "center", marginBottom: spacing[4] },
  categoryTitle: { fontSize: typography.size["2xl"], fontWeight: typography.weight.bold, color: colors.neutral[900], marginBottom: spacing[2] },
  categoryDescription: { fontSize: typography.size.base, color: colors.neutral[500], textAlign: "center", lineHeight: 22 },
  habitsContainer: { gap: spacing[3] },
  habitCard: { backgroundColor: colors.neutral[50], borderRadius: radius.xl, padding: spacing[4], borderWidth: 1.5, borderColor: colors.neutral[200] },
  habitCardSelected: { backgroundColor: colors.secondary[500], borderColor: colors.secondary[500] },
  habitCardDisabled: { opacity: 0.6, backgroundColor: colors.neutral[100], borderColor: colors.neutral[200] },
  habitContent: { flexDirection: "row", alignItems: "flex-start" },
  habitInfo: { flex: 1, marginRight: spacing[3] },
  habitName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.neutral[800], marginBottom: spacing[1] },
  habitNameSelected: { color: colors.neutral[0] },
  habitNameDisabled: { color: colors.neutral[400] },
  habitDescription: { fontSize: typography.size.sm, color: colors.neutral[500], lineHeight: 20, marginBottom: spacing[3] },
  habitDescriptionSelected: { color: "rgba(255,255,255,0.85)" },
  habitDescriptionDisabled: { color: colors.neutral[400] },
  alreadyAddedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing[1] },
  alreadyAddedText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.secondary[500] },
  alreadyAddedIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondary[50], justifyContent: "center", alignItems: "center" },
  habitMeta: { flexDirection: "row", gap: spacing[2] },
  metaBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.neutral[100], paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius.md, gap: 4 },
  metaBadgeSelected: { backgroundColor: "rgba(255,255,255,0.2)" },
  metaBadgeDisabled: { backgroundColor: colors.neutral[200] },
  metaBadgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.primary[600] },
  metaBadgeTextSelected: { color: colors.neutral[0] },
  metaBadgeTextDisabled: { color: colors.neutral[400] },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.neutral[300], backgroundColor: colors.neutral[0], justifyContent: "center", alignItems: "center" },
  checkboxSelected: { backgroundColor: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.5)" },
  floatingButtonContainer: { position: "absolute", bottom: spacing[8], left: spacing[5], right: spacing[5] },
  floatingButton: { borderRadius: radius.xl, overflow: "hidden", ...shadows.lg, shadowColor: colors.secondary[600] },
  floatingButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing[5], gap: spacing[2] },
  floatingButtonText: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.neutral[0] },
});
