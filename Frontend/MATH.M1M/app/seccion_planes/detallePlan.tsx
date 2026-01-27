import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";

interface PlanDetalle {
  plan_id: number;
  meta_principal: string;
  descripcion: string;
  plazo_dias_estimado: number;
  dificultad: "fácil" | "intermedio" | "difícil";
  categoria_nombre: string;
  total_fases: number;
  total_tareas: number;
  fases: Fase[];
}

interface Fase {
  fase_id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  tareas: Tarea[];
}

interface Tarea {
  tarea_id: number;
  descripcion: string;
  dia_relativo: number;
}

export default function DetallePlanScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams();
  const { user, authFetch } = useAuth();
  
  const [plan, setPlan] = useState<PlanDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [showCustomDuration, setShowCustomDuration] = useState(false);

  const fetchPlanDetalle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/planes/detalle/${planId}`);
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
        setCustomDuration(data.plan.plazo_dias_estimado.toString());
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
      Alert.alert("Error", "Could not load plan details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planId) {
      fetchPlanDetalle();
    }
  }, [planId]);

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/planes");
  };

  const agregarPlan = async () => {
    if (!plan) return;

    setAdding(true);

    try {
      if (!user?.user_id) {
        Alert.alert("Error", "Could not identify user");
        return;
      }

      console.log("DEBUG agregarPlan: user_id=", user.user_id, "plan_id=", plan.plan_id);
      
      const duration = showCustomDuration ? parseInt(customDuration) : plan.plazo_dias_estimado;

      const response = await authFetch(`/api/planes/agregar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          plan_id: plan.plan_id,
          dias_personalizados: duration,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success!", "Plan added to your profile", [
          { text: "OK", onPress: () => router.replace("/(tabs)/planes") },
        ]);
      } else {
        Alert.alert("Error", result.message || "Could not add plan");
      }
    } catch (error) {
      Alert.alert("Error", "Connection error");
    } finally {
      setAdding(false);
    }
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

  const getDifficultyLabel = (dificultad: string) => {
    switch (dificultad) {
      case "fácil":
        return "Easy";
      case "intermedio":
        return "Intermediate";
      case "difícil":
        return "Difficult";
      default:
        return dificultad;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
          <Text style={styles.loadingText}>Plan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyColor = getDifficultyColor(plan.dificultad);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Header */}
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{plan.meta_principal}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: difficultyColor + "15" }]}>
              <Text style={[styles.badgeText, { color: difficultyColor }]}>
                {getDifficultyLabel(plan.dificultad)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="folder-outline" size={12} color={colors.primary[600]} />
              <Text style={[styles.badgeText, { color: colors.primary[600] }]}>
                {plan.categoria_nombre}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>{plan.descripcion}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="calendar" size={18} color={colors.primary[600]} />
            </View>
            <Text style={styles.statValue}>{plan.plazo_dias_estimado}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="layers" size={18} color={colors.secondary[600]} />
            </View>
            <Text style={styles.statValue}>{plan.total_fases}</Text>
            <Text style={styles.statLabel}>Phases</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent.amber + "20" }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent.amber} />
            </View>
            <Text style={styles.statValue}>{plan.total_tareas}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>

        {/* Custom Duration */}
        <View style={styles.customDurationSection}>
          <TouchableOpacity
            style={styles.customDurationToggle}
            onPress={() => setShowCustomDuration(!showCustomDuration)}
          >
            <Ionicons
              name={showCustomDuration ? "checkbox" : "square-outline"}
              size={22}
              color={showCustomDuration ? colors.primary[600] : colors.neutral[400]}
            />
            <Text style={styles.customDurationToggleText}>Customize duration</Text>
          </TouchableOpacity>

          {showCustomDuration && (
            <View style={styles.customDurationInput}>
              <TextInput
                style={styles.durationInput}
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="number-pad"
                placeholder="Days"
                placeholderTextColor={colors.neutral[400]}
              />
              <Text style={styles.durationLabel}>days</Text>
            </View>
          )}
        </View>

        {/* Phases */}
        <View style={styles.phasesSection}>
          <Text style={styles.sectionTitle}>Plan Phases</Text>
          {plan.fases.map((fase, index) => (
            <View key={fase.fase_id} style={styles.phaseCard}>
              <View style={styles.phaseHeader}>
                <View style={styles.phaseNumber}>
                  <Text style={styles.phaseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.phaseInfo}>
                  <Text style={styles.phaseName}>{fase.nombre}</Text>
                  <Text style={styles.phaseDescription}>{fase.descripcion}</Text>
                </View>
              </View>
              <View style={styles.tasksList}>
                {fase.tareas.slice(0, 3).map((tarea) => (
                  <View key={tarea.tarea_id} style={styles.taskItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.neutral[400]} />
                    <Text style={styles.taskText} numberOfLines={2}>
                      {tarea.descripcion}
                    </Text>
                  </View>
                ))}
                {fase.tareas.length > 3 && (
                  <Text style={styles.moreTasks}>+{fase.tareas.length - 3} more tasks</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={agregarPlan}
          disabled={adding}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colors.gradients.secondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingButtonGradient}
          >
            {adding ? (
              <ActivityIndicator color={colors.neutral[0]} size="small" />
            ) : (
              <>
                <Ionicons name="add-circle" size={22} color={colors.neutral[0]} />
                <Text style={styles.floatingButtonText}>Add This Plan</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
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
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
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
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: 120,
  },
  planHeader: {
    marginBottom: spacing[4],
  },
  planTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  badges: {
    flexDirection: "row",
    gap: spacing[2],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    gap: 4,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  section: {
    marginBottom: spacing[6],
  },
  description: {
    fontSize: typography.size.base,
    color: colors.neutral[600],
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  customDurationSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  customDurationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  customDurationToggleText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[700],
  },
  customDurationInput: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[4],
    gap: spacing[3],
  },
  durationInput: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
    width: 100,
    textAlign: "center",
  },
  durationLabel: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  phasesSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  phaseCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  phaseHeader: {
    flexDirection: "row",
    marginBottom: spacing[3],
  },
  phaseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  phaseNumberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  phaseInfo: {
    flex: 1,
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
    lineHeight: 20,
  },
  tasksList: {
    paddingLeft: spacing[3] + 32,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  taskText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  moreTasks: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
    marginTop: spacing[2],
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: spacing[8],
    left: spacing[5],
    right: spacing[5],
  },
  floatingButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.lg,
    shadowColor: colors.secondary[600],
  },
  floatingButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[5],
    gap: spacing[2],
  },
  floatingButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
