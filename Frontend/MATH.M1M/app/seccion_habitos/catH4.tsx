import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";

interface Habito {
  habito_id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  frecuencia_recomendada: string;
  puntos_base: number;
}

export default function CatH4Screen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const CATEGORY_ID = 4;
  const CATEGORY_NAME = "Home Organization";
  const CATEGORY_ICON = "home";
  const CATEGORY_COLOR = colors.accent.cyan;
  const CATEGORY_DESCRIPTION = "Keep your living space organized and maintained";

  const fetchHabitos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/habitos/categoria/${CATEGORY_ID}`);
      const data = await response.json();
      if (data.success) setHabitos(data.data);
    } catch (error) {
      Alert.alert("Error", "Could not load habits");
    }
  };

  useEffect(() => {
    fetchHabitos().finally(() => setLoading(false));
  }, []);

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/habitos");
  };

  const toggleHabitSelection = (habitId: number) => {
    setSelectedHabits((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  const agregarHabitos = async () => {
    if (selectedHabits.length === 0) {
      Alert.alert("Notice", "Please select at least one habit");
      return;
    }
    if (!user?.user_id) {
      Alert.alert("Error", "Could not identify user");
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
        Alert.alert("Success!", `Added ${result.data.added_habitos.length} habit(s)`, [
          { text: "OK", onPress: () => { setSelectedHabits([]); router.replace("/(tabs)/habitos"); } },
        ]);
      } else {
        Alert.alert("Error", "Could not add habits");
      }
    } catch (error) {
      Alert.alert("Error", "Connection error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading habits...</Text>
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
          <View style={[styles.categoryIconContainer, { backgroundColor: CATEGORY_COLOR + "20" }]}>
            <Ionicons name={CATEGORY_ICON as any} size={32} color={CATEGORY_COLOR} />
          </View>
          <Text style={styles.categoryTitle}>{CATEGORY_NAME}</Text>
          <Text style={styles.categoryDescription}>{CATEGORY_DESCRIPTION}</Text>
        </View>

        <View style={styles.habitsContainer}>
          {habitos.map((habito) => {
            const isSelected = selectedHabits.includes(habito.habito_id);
            return (
              <TouchableOpacity
                key={habito.habito_id}
                style={[styles.habitCard, isSelected && styles.habitCardSelected]}
                activeOpacity={0.8}
                onPress={() => toggleHabitSelection(habito.habito_id)}
              >
                <View style={styles.habitContent}>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, isSelected && styles.habitNameSelected]}>{habito.nombre}</Text>
                    {habito.descripcion && (
                      <Text style={[styles.habitDescription, isSelected && styles.habitDescriptionSelected]}>{habito.descripcion}</Text>
                    )}
                    <View style={styles.habitMeta}>
                      <View style={[styles.metaBadge, isSelected && styles.metaBadgeSelected]}>
                        <Ionicons name="diamond-outline" size={12} color={isSelected ? colors.neutral[0] : colors.primary[600]} />
                        <Text style={[styles.metaBadgeText, isSelected && styles.metaBadgeTextSelected]}>{habito.puntos_base} pts</Text>
                      </View>
                      <View style={[styles.metaBadge, isSelected && styles.metaBadgeSelected]}>
                        <Ionicons name="refresh-outline" size={12} color={isSelected ? colors.neutral[0] : colors.neutral[500]} />
                        <Text style={[styles.metaBadgeText, { color: isSelected ? colors.neutral[0] : colors.neutral[500] }]}>{habito.frecuencia_recomendada}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={18} color={colors.neutral[0]} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedHabits.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity style={styles.floatingButton} onPress={agregarHabitos} disabled={adding} activeOpacity={0.9}>
            <LinearGradient colors={colors.gradients.secondary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.floatingButtonGradient}>
              {adding ? <ActivityIndicator color={colors.neutral[0]} size="small" /> : (
                <>
                  <Ionicons name="add-circle" size={22} color={colors.neutral[0]} />
                  <Text style={styles.floatingButtonText}>Add {selectedHabits.length} Habit{selectedHabits.length > 1 ? "s" : ""}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  habitContent: { flexDirection: "row", alignItems: "flex-start" },
  habitInfo: { flex: 1, marginRight: spacing[3] },
  habitName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.neutral[800], marginBottom: spacing[1] },
  habitNameSelected: { color: colors.neutral[0] },
  habitDescription: { fontSize: typography.size.sm, color: colors.neutral[500], lineHeight: 20, marginBottom: spacing[3] },
  habitDescriptionSelected: { color: "rgba(255,255,255,0.85)" },
  habitMeta: { flexDirection: "row", gap: spacing[2] },
  metaBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.neutral[100], paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius.md, gap: 4 },
  metaBadgeSelected: { backgroundColor: "rgba(255,255,255,0.2)" },
  metaBadgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.primary[600] },
  metaBadgeTextSelected: { color: colors.neutral[0] },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.neutral[300], backgroundColor: colors.neutral[0], justifyContent: "center", alignItems: "center" },
  checkboxSelected: { backgroundColor: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.5)" },
  floatingButtonContainer: { position: "absolute", bottom: spacing[8], left: spacing[5], right: spacing[5] },
  floatingButton: { borderRadius: radius.xl, overflow: "hidden", ...shadows.lg, shadowColor: colors.secondary[600] },
  floatingButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing[5], gap: spacing[2] },
  floatingButtonText: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.neutral[0] },
});
