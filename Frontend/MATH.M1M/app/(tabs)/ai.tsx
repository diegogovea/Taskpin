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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [addingHabit, setAddingHabit] = useState<number | null>(null);

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
        Alert.alert("Success", "Habit added to your list!");
        loadRecomendaciones(user.user_id);
        loadPredicciones(user.user_id);
      } else {
        Alert.alert("Error", data.detail || "Could not add habit");
      }
    } catch (error) {
      console.error("Error adding habit:", error);
      Alert.alert("Error", "Could not add habit");
    } finally {
      setAddingHabit(null);
    }
  };

  const getProgressColor = (prob: number) => {
    if (prob >= 0.8) return colors.secondary[500];
    if (prob >= 0.5) return colors.accent.amber;
    return colors.semantic.error;
  };

  // Stats calculados
  const avgPrediction = predicciones.length > 0
    ? Math.round(predicciones.reduce((sum, p) => sum + p.probabilidad * 100, 0) / predicciones.length)
    : 0;
  const highConfidence = predicciones.filter(p => p.probabilidad >= 0.8).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading AI insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <Text style={styles.headerSubtitle}>Personalized for you</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={24} color={colors.primary[600]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="bulb" size={20} color={colors.primary[600]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.primary[600] }]}>
              {recomendaciones.length}
            </Text>
            <Text style={styles.statLabel}>Suggestions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="trending-up" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.secondary[600] }]}>
              {avgPrediction}%
            </Text>
            <Text style={styles.statLabel}>Avg Success</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent.amber + "25" }]}>
              <Ionicons name="star" size={20} color={colors.accent.amber} />
            </View>
            <Text style={[styles.statNumber, { color: colors.accent.amber }]}>
              {highConfidence}
            </Text>
            <Text style={styles.statLabel}>High Conf.</Text>
          </View>
        </View>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Habits</Text>

          {recomendaciones.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="checkmark-done-circle" size={48} color={colors.secondary[400]} />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>You have all suggested habits</Text>
            </View>
          ) : (
            recomendaciones.map((rec, index) => (
              <View
                key={rec.habito_id}
                style={[styles.habitCard, index === 0 && styles.habitCardHighlight]}
              >
                <View style={styles.habitContent}>
                  {/* Checkbox area - add habit */}
                  <TouchableOpacity
                    style={[styles.checkbox, index === 0 && styles.checkboxHighlight]}
                    onPress={() => handleAgregarHabito(rec.habito_id)}
                    disabled={addingHabit === rec.habito_id}
                    activeOpacity={0.7}
                  >
                    {addingHabit === rec.habito_id ? (
                      <ActivityIndicator size="small" color={colors.primary[600]} />
                    ) : (
                      <Ionicons name="add" size={18} color={colors.primary[600]} />
                    )}
                  </TouchableOpacity>

                  {/* Habit Info */}
                  <View style={styles.habitInfo}>
                    <View style={styles.habitNameRow}>
                      <Text style={styles.habitName}>{rec.nombre}</Text>
                      {index === 0 && (
                        <View style={styles.topBadge}>
                          <Ionicons name="star" size={10} color={colors.neutral[0]} />
                          <Text style={styles.topBadgeText}>TOP</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitCategory}>{rec.categoria || "General"}</Text>
                      <View style={styles.habitPoints}>
                        <Ionicons name="people" size={12} color={colors.primary[500]} />
                        <Text style={styles.habitPointsText}>{Math.round(rec.score * 100)}% match</Text>
                      </View>
                    </View>
                  </View>

                  {/* Arrow */}
                  <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Predictions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Predictions</Text>

          {predicciones.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="fitness-outline" size={48} color={colors.neutral[300]} />
              </View>
              <Text style={styles.emptyTitle}>No predictions yet</Text>
              <Text style={styles.emptySubtitle}>Add habits to see success predictions</Text>
            </View>
          ) : (
            predicciones.map((pred) => (
              <View key={pred.habito_usuario_id} style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <View style={styles.predictionInfo}>
                    <Text style={styles.predictionName} numberOfLines={1}>
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
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={
                      pred.probabilidad >= 0.8
                        ? colors.gradients.secondary
                        : pred.probabilidad >= 0.5
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
            AI predictions improve as you track more habits. Keep logging your progress!
          </Text>
        </View>

        {/* Bottom Padding for Tab Bar */}
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
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[4],
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
    height: "100%",
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
