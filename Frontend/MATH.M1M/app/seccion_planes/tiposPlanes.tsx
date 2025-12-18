import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";

interface CategoryItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  gradient: string[];
  iconColor: string;
  available: boolean;
}

const categories: CategoryItem[] = [
  {
    id: "1",
    title: "Health & Wellness",
    description: "Fitness, nutrition, and self-care plans",
    icon: "heart",
    route: "/seccion_planes/bienestarYSalud",
    gradient: [colors.secondary[100], colors.secondary[50]],
    iconColor: colors.secondary[600],
    available: true,
  },
  {
    id: "2",
    title: "Personal Finance",
    description: "Savings, budgeting, and financial goals",
    icon: "wallet",
    route: "/",
    gradient: [colors.accent.amber + "30", colors.accent.amber + "15"],
    iconColor: colors.accent.amber,
    available: false,
  },
  {
    id: "3",
    title: "Personal Development",
    description: "Skills, learning, and growth plans",
    icon: "rocket",
    route: "/",
    gradient: [colors.primary[100], colors.primary[50]],
    iconColor: colors.primary[600],
    available: false,
  },
  {
    id: "4",
    title: "Career Growth",
    description: "Professional development plans",
    icon: "briefcase",
    route: "/",
    gradient: [colors.accent.cyan + "30", colors.accent.cyan + "15"],
    iconColor: colors.accent.cyan,
    available: false,
  },
];

export default function TiposPlanesScreen() {
  const router = useRouter();

  const goBack = () => {
    router.canGoBack() ? router.back() : router.push("/(tabs)/home");
  };

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
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Choose a Plan</Text>
          <Text style={styles.subtitle}>
            Select a category to explore available plans that match your goals
          </Text>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, !category.available && styles.categoryCardDisabled]}
              activeOpacity={category.available ? 0.8 : 1}
              onPress={() => category.available && router.push(category.route as any)}
            >
              <LinearGradient
                colors={category.available ? category.gradient : [colors.neutral[100], colors.neutral[50]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryGradient}
              >
                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: category.available
                          ? category.iconColor + "20"
                          : colors.neutral[200],
                      },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={category.available ? category.iconColor : colors.neutral[400]}
                    />
                  </View>
                  <View style={styles.categoryText}>
                    <View style={styles.categoryTitleRow}>
                      <Text
                        style={[
                          styles.categoryTitle,
                          !category.available && styles.categoryTitleDisabled,
                        ]}
                      >
                        {category.title}
                      </Text>
                      {!category.available && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.categoryDescription,
                        !category.available && styles.categoryDescriptionDisabled,
                      ]}
                    >
                      {category.description}
                    </Text>
                  </View>
                  {category.available && (
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Plan Button */}
        <View style={styles.customSection}>
          <TouchableOpacity style={styles.customButton} activeOpacity={0.9}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.customButtonGradient}
            >
              <Ionicons name="create-outline" size={22} color={colors.neutral[0]} />
              <Text style={styles.customButtonText}>Create Custom Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
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
    marginBottom: spacing[8],
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
    lineHeight: 22,
  },
  categoriesContainer: {
    gap: spacing[3],
  },
  categoryCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  categoryCardDisabled: {
    opacity: 0.7,
  },
  categoryGradient: {
    padding: spacing[4],
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[4],
  },
  categoryText: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  categoryTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  categoryTitleDisabled: {
    color: colors.neutral[500],
  },
  comingSoonBadge: {
    backgroundColor: colors.neutral[200],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  comingSoonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
  categoryDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  categoryDescriptionDisabled: {
    color: colors.neutral[400],
  },
  customSection: {
    marginTop: spacing[8],
  },
  customButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  customButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[5],
    gap: spacing[2],
  },
  customButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
