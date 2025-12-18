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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";

interface Plan {
  plan_id: number;
  categoria_id: number;
  meta_principal: string;
  descripcion: string;
  duracion_estimada_dias: number;
  dificultad: "fácil" | "intermedio" | "difícil";
  total_fases: number;
  total_tareas: number;
}

export default function BienestarYSaludScreen() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "http://localhost:8000";

  const fetchPlanes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/planes/categoria/1`);
      const data = await response.json();
      if (data.success) {
        setPlanes(data.planes);
      }
    } catch (error) {
      console.error("Error fetching planes:", error);
      Alert.alert("Error", "Could not load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const goBack = () => {
    router.canGoBack() ? router.back() : router.push("/(tabs)/home");
  };

  const navigateToPlanDetail = (planId: number) => {
    router.push(`/seccion_planes/detallePlan?planId=${planId}` as any);
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
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.categoryIcon}>
            <Ionicons name="heart" size={28} color={colors.secondary[600]} />
          </View>
          <Text style={styles.title}>Health & Wellness</Text>
          <Text style={styles.subtitle}>
            Choose a plan to improve your health and well-being
          </Text>
        </View>

        {/* Plans List */}
        <View style={styles.plansContainer}>
          {planes.map((plan) => {
            const difficultyColor = getDifficultyColor(plan.dificultad);
            return (
              <TouchableOpacity
                key={plan.plan_id}
                style={styles.planCard}
                activeOpacity={0.8}
                onPress={() => navigateToPlanDetail(plan.plan_id)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{plan.meta_principal}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + "15" }]}>
                    <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                      {getDifficultyLabel(plan.dificultad)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.planDescription} numberOfLines={3}>
                  {plan.descripcion}
                </Text>

                <View style={styles.planMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.neutral[400]} />
                    <Text style={styles.metaText}>{plan.duracion_estimada_dias} days</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="layers-outline" size={14} color={colors.neutral[400]} />
                    <Text style={styles.metaText}>{plan.total_fases} phases</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.neutral[400]} />
                    <Text style={styles.metaText}>{plan.total_tareas} tasks</Text>
                  </View>
                </View>

                <View style={styles.planFooter}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {planes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.neutral[300]} />
            </View>
            <Text style={styles.emptyTitle}>No plans available</Text>
            <Text style={styles.emptySubtitle}>Check back later for new wellness plans</Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  backButton: {
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
    paddingBottom: spacing[10],
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing[8],
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.secondary[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: "center",
    lineHeight: 22,
  },
  plansContainer: {
    gap: spacing[4],
  },
  planCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[3],
  },
  planTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginRight: spacing[3],
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
    marginBottom: spacing[4],
  },
  planMeta: {
    flexDirection: "row",
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  planFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing[1],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  viewDetailsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
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
    textAlign: "center",
  },
});
