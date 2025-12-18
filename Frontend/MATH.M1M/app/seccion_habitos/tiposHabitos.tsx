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
}

const categories: CategoryItem[] = [
  {
    id: "1",
    title: "Daily Wellness",
    description: "Self-care and healthy routines",
    icon: "heart",
    route: "/seccion_habitos/catH1",
    gradient: [colors.secondary[100], colors.secondary[50]],
    iconColor: colors.secondary[600],
  },
  {
    id: "2",
    title: "Energy & Movement",
    description: "Physical activities to stay active",
    icon: "flash",
    route: "/seccion_habitos/catH2",
    gradient: [colors.accent.amber + "30", colors.accent.amber + "15"],
    iconColor: colors.accent.amber,
  },
  {
    id: "3",
    title: "Mind & Focus",
    description: "Mental development and concentration",
    icon: "bulb",
    route: "/seccion_habitos/catH3",
    gradient: [colors.primary[100], colors.primary[50]],
    iconColor: colors.primary[600],
  },
  {
    id: "4",
    title: "Home Organization",
    description: "Domestic order and maintenance",
    icon: "home",
    route: "/seccion_habitos/catH4",
    gradient: [colors.accent.cyan + "30", colors.accent.cyan + "15"],
    iconColor: colors.accent.cyan,
  },
  {
    id: "5",
    title: "Personal Finance",
    description: "Money management habits",
    icon: "wallet",
    route: "/seccion_habitos/catH5",
    gradient: [colors.accent.rose + "30", colors.accent.rose + "15"],
    iconColor: colors.accent.rose,
  },
];

export default function TiposHabitosScreen() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/home");
    }
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
          <Text style={styles.title}>Add New Habit</Text>
          <Text style={styles.subtitle}>
            Choose a category to find habits that match your goals
          </Text>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              activeOpacity={0.8}
              onPress={() => router.push(category.route as any)}
            >
              <LinearGradient
                colors={category.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryGradient}
              >
                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.iconColor + "20" },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={category.iconColor}
                    />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.neutral[400]}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Habit Button */}
        <View style={styles.customSection}>
          <TouchableOpacity
            style={styles.customButton}
            activeOpacity={0.9}
            onPress={() => router.push("/seccion_habitos/catHCustom")}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.customButtonGradient}
            >
              <Ionicons name="create-outline" size={22} color={colors.neutral[0]} />
              <Text style={styles.customButtonText}>Create Custom Habit</Text>
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
  categoryTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  categoryDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
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
