import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

interface Stats {
  totalHabits: number;
  completedToday: number;
  streak: number;
  totalPoints: number;
  level: number;
}

export default function PerfilScreen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  
  const [stats, setStats] = useState<Stats>({
    totalHabits: 0,
    completedToday: 0,
    streak: 0,
    totalPoints: 0,
    level: 1,
  });
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Cargar estadísticas de gamificación desde el backend
  const loadEstadisticas = async (userId: number) => {
    try {
      const response = await authFetch(`/api/usuario/${userId}/estadisticas`);
      const data = await response.json();
      
      if (data.success) {
        setStats(prev => ({
          ...prev,
          streak: data.data.racha_actual,
          totalPoints: data.data.puntos_totales,
          level: data.data.nivel,
        }));
      }
    } catch (error) {
      console.error("Error loading estadisticas:", error);
    }
  };

  // ✅ Cargar estadísticas de hábitos del día
  const loadHabitosStats = async (userId: number) => {
    try {
      const response = await authFetch(`/api/usuario/${userId}/habitos/hoy`);
      const data = await response.json();
      
      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalHabits: data.data.estadisticas.total,
          completedToday: data.data.estadisticas.completados,
        }));
      }
    } catch (error) {
      console.error("Error loading habitos stats:", error);
    }
  };

  // ✅ Cargar todos los datos
  const loadAllData = async () => {
    if (!user?.user_id) return;
    
    await Promise.all([
      loadEstadisticas(user.user_id),
      loadHabitosStats(user.user_id),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.user_id) {
      loadAllData();
    }
  }, [user?.user_id]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const MenuButton = ({
    icon,
    title,
    subtitle,
    onPress,
    iconBg,
    iconColor,
    showBadge = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    iconBg: string;
    iconColor: string;
    showBadge?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuButton} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        {showBadge && <View style={styles.menuBadge} />}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/configuracion")}
          >
            <Ionicons name="settings-outline" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getInitials(user?.nombre || "User")}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.nombre || "User"}</Text>
                <Text style={styles.profileEmail}>{user?.correo || ""}</Text>
                <View style={styles.levelBadge}>
                  <Ionicons name="trophy" size={14} color={colors.accent.amber} />
                  <Text style={styles.levelText}>Level {stats.level}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color={colors.accent.amber} />
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="diamond" size={24} color={colors.primary[600]} />
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.secondary[500]} />
            <Text style={styles.statValue}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Progress</Text>
          <View style={styles.menuCard}>
            <MenuButton
              icon="checkmark-done"
              title="My Habits"
              subtitle={`${stats.totalHabits} habits tracked`}
              iconBg={colors.secondary[100]}
              iconColor={colors.secondary[600]}
              onPress={() => router.push("/(tabs)/habitos")}
            />
            <View style={styles.menuDivider} />
            <MenuButton
              icon="bar-chart"
              title="My Plans"
              subtitle="View active plans"
              iconBg={colors.primary[100]}
              iconColor={colors.primary[600]}
              onPress={() => router.push("/(tabs)/planes")}
            />
            <View style={styles.menuDivider} />
            <MenuButton
              icon="stats-chart"
              title="Statistics"
              subtitle="Track your progress"
              iconBg={colors.accent.amber + "20"}
              iconColor={colors.accent.amber}
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuButton
              icon="person"
              title="Edit Profile"
              iconBg={colors.accent.cyan + "20"}
              iconColor={colors.accent.cyan}
              onPress={() => router.push("/configuracion")}
            />
            <View style={styles.menuDivider} />
            <MenuButton
              icon="notifications"
              title="Notifications"
              iconBg={colors.accent.rose + "20"}
              iconColor={colors.accent.rose}
              showBadge
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuButton
              icon="shield-checkmark"
              title="Privacy"
              iconBg={colors.neutral[200]}
              iconColor={colors.neutral[600]}
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuButton
              icon="help-circle"
              title="Help Center"
              iconBg={colors.primary[100]}
              iconColor={colors.primary[600]}
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuButton
              icon="chatbubbles"
              title="Contact Us"
              iconBg={colors.secondary[100]}
              iconColor={colors.secondary[600]}
              onPress={() => {}}
            />
          </View>
        </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[6],
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[0],
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  profileCard: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[6],
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  profileGradient: {
    padding: spacing[6],
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[4],
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
  },
  profileEmail: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing[2],
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    alignSelf: "flex-start",
    gap: spacing[1],
  },
  levelText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  statsGrid: {
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
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  menuSection: {
    marginBottom: spacing[6],
  },
  menuSectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[500],
    marginBottom: spacing[3],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  menuBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.error,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginLeft: spacing[4] + 44 + spacing[3],
  },
});
