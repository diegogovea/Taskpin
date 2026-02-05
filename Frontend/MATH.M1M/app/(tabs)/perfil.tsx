import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
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
  completionRate: number;
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
  color: string;
  unlocked: boolean;
  description: string;
}

export default function PerfilScreen() {
  const router = useRouter();
  const { user, authFetch, logout } = useAuth();
  
  const [stats, setStats] = useState<Stats>({
    totalHabits: 0,
    completedToday: 0,
    streak: 0,
    totalPoints: 0,
    level: 1,
    completionRate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Achievements basados en stats
  const getAchievements = (): Achievement[] => {
    return [
      {
        id: "first_habit",
        name: "First Step",
        icon: "footsteps",
        color: colors.secondary[500],
        unlocked: stats.totalHabits >= 1,
        description: "Create your first habit",
      },
      {
        id: "streak_7",
        name: "Week Warrior",
        icon: "flame",
        color: colors.accent.amber,
        unlocked: stats.streak >= 7,
        description: "7 day streak",
      },
      {
        id: "streak_30",
        name: "Monthly Master",
        icon: "calendar",
        color: colors.primary[600],
        unlocked: stats.streak >= 30,
        description: "30 day streak",
      },
      {
        id: "points_100",
        name: "Point Collector",
        icon: "diamond",
        color: colors.accent.cyan,
        unlocked: stats.totalPoints >= 100,
        description: "Earn 100 points",
      },
      {
        id: "points_500",
        name: "Point Hunter",
        icon: "trophy",
        color: colors.accent.rose,
        unlocked: stats.totalPoints >= 500,
        description: "Earn 500 points",
      },
      {
        id: "habits_5",
        name: "Habit Builder",
        icon: "construct",
        color: colors.secondary[600],
        unlocked: stats.totalHabits >= 5,
        description: "Track 5 habits",
      },
    ];
  };

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

  const loadHabitosStats = async (userId: number) => {
    try {
      const response = await authFetch(`/api/usuario/${userId}/habitos/hoy`);
      const data = await response.json();
      
      if (data.success) {
        const total = data.data.estadisticas.total;
        const completed = data.data.estadisticas.completados;
        setStats(prev => ({
          ...prev,
          totalHabits: total,
          completedToday: completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        }));
      }
    } catch (error) {
      console.error("Error loading habitos stats:", error);
    }
  };

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

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/inicio");
          }
        },
      ]
    );
  };

  const getLevelProgress = () => {
    const pointsPerLevel = 100;
    const currentLevelPoints = stats.totalPoints % pointsPerLevel;
    return (currentLevelPoints / pointsPerLevel) * 100;
  };

  const achievements = getAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

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

        {/* Profile Card con Stats Integrados */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            {/* Avatar y Nombre */}
            <View style={styles.profileTop}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getInitials(user?.nombre || "User")}</Text>
              </View>
              <Text style={styles.profileName}>{user?.nombre || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.correo || ""}</Text>
            </View>

            {/* Stats integrados */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="flame" size={18} color={colors.accent.amber} />
                </View>
                <Text style={styles.statValue}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="diamond" size={18} color={colors.accent.cyan} />
                </View>
                <Text style={styles.statValue}>{stats.totalPoints}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={18} color={colors.accent.amber} />
                </View>
                <Text style={styles.statValue}>{stats.level}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>

            {/* Level Progress */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${getLevelProgress()}%` }]} />
              </View>
              <Text style={styles.levelProgressText}>
                {Math.round(getLevelProgress())}% to Level {stats.level + 1}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Today's Progress */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Ionicons name="today" size={20} color={colors.primary[600]} />
            <Text style={styles.todayTitle}>Today's Progress</Text>
          </View>
          <View style={styles.todayContent}>
            <View style={styles.todayStats}>
              <Text style={styles.todayNumber}>{stats.completedToday}</Text>
              <Text style={styles.todayOf}>of</Text>
              <Text style={styles.todayNumber}>{stats.totalHabits}</Text>
            </View>
            <Text style={styles.todayLabel}>habits completed</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={colors.gradients.secondary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${stats.completionRate}%` }]}
                />
              </View>
              <Text style={styles.progressPercent}>{stats.completionRate}%</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>{unlockedCount} of {achievements.length} unlocked</Text>
          </View>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[
                  styles.achievementItem,
                  !achievement.unlocked && styles.achievementLocked
                ]}
              >
                <View 
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.unlocked ? achievement.color + "20" : colors.neutral[100] }
                  ]}
                >
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={24} 
                    color={achievement.unlocked ? achievement.color : colors.neutral[300]} 
                  />
                </View>
                <Text 
                  style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementNameLocked
                  ]}
                >
                  {achievement.name}
                </Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.semantic.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

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

  // Profile Card
  profileCard: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[5],
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  profileGradient: {
    padding: spacing[6],
  },
  profileTop: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  avatarText: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
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
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.7)",
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Level Progress
  levelProgressContainer: {
    alignItems: "center",
  },
  levelProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  levelProgressFill: {
    height: "100%",
    backgroundColor: colors.neutral[0],
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.7)",
    marginTop: spacing[2],
  },

  // Today Card
  todayCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadows.sm,
  },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  todayTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  todayContent: {
    alignItems: "center",
  },
  todayStats: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[2],
  },
  todayNumber: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  todayOf: {
    fontSize: typography.size.base,
    color: colors.neutral[400],
  },
  todayLabel: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[4],
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.secondary[600],
    minWidth: 40,
  },

  // Achievements
  achievementsSection: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  achievementItem: {
    width: "31%",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[3],
    alignItems: "center",
    ...shadows.sm,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  achievementName: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    textAlign: "center",
    marginBottom: spacing[1],
  },
  achievementNameLocked: {
    color: colors.neutral[400],
  },
  achievementDesc: {
    fontSize: 10,
    color: colors.neutral[400],
    textAlign: "center",
  },

  // Log Out
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.semantic.error + "30",
  },
  logoutText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.semantic.error,
  },
});
