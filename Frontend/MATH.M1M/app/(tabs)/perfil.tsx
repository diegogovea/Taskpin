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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

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
  category: string;
}

// ── Componente reutilizable para cada logro ──
function AchievementCard({ achievement, large }: { achievement: Achievement; large?: boolean }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.achievementItem,
        { backgroundColor: palette.surface },
        large && styles.achievementItemLarge,
        !achievement.unlocked && styles.achievementLocked,
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          large && styles.achievementIconLarge,
          { backgroundColor: achievement.unlocked ? achievement.color + "20" : palette.surfaceAlt },
        ]}
      >
        <Ionicons
          name={achievement.icon as any}
          size={large ? 28 : 24}
          color={achievement.unlocked ? achievement.color : palette.iconSubtle}
        />
      </View>
      <Text
        style={[
          styles.achievementName,
          { color: achievement.unlocked ? palette.text : palette.textSubtle },
          !achievement.unlocked && styles.achievementNameLocked,
        ]}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>
      <Text style={[styles.achievementDesc, { color: palette.textMuted }]} numberOfLines={2}>
        {achievement.description}
      </Text>
      {achievement.unlocked && (
        <View style={styles.unlockedBadge}>
          <Ionicons name="checkmark" size={10} color={colors.neutral[0]} />
        </View>
      )}
    </View>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const { user, authFetch, logout } = useAuth();
  const { palette } = useTheme();
  
  const [stats, setStats] = useState<Stats>({
    totalHabits: 0,
    completedToday: 0,
    streak: 0,
    totalPoints: 0,
    level: 1,
    completionRate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // ── Logros basados en stats reales ──
  const getAchievements = (): Achievement[] => [
    // Hábitos
    {
      id: "first_habit",
      name: "Primer Paso",
      icon: "footsteps",
      color: colors.secondary[500],
      unlocked: stats.totalHabits >= 1,
      description: "Añade tu primer hábito",
      category: "Hábitos",
    },
    {
      id: "habits_3",
      name: "Triatleta",
      icon: "barbell",
      color: colors.secondary[400],
      unlocked: stats.totalHabits >= 3,
      description: "Sigue 3 hábitos a la vez",
      category: "Hábitos",
    },
    {
      id: "habits_5",
      name: "Constructor",
      icon: "construct",
      color: colors.secondary[600],
      unlocked: stats.totalHabits >= 5,
      description: "Sigue 5 hábitos a la vez",
      category: "Hábitos",
    },
    {
      id: "habits_10",
      name: "Colección Épica",
      icon: "layers",
      color: colors.primary[700],
      unlocked: stats.totalHabits >= 10,
      description: "Sigue 10 hábitos a la vez",
      category: "Hábitos",
    },
    {
      id: "perfect_day",
      name: "Día Perfecto",
      icon: "checkmark-circle",
      color: colors.secondary[500],
      unlocked: stats.totalHabits > 0 && stats.completionRate === 100,
      description: "Completa el 100% de tus hábitos en un día",
      category: "Hábitos",
    },
    // Racha
    {
      id: "streak_3",
      name: "Arrancando",
      icon: "flash",
      color: colors.accent.amber,
      unlocked: stats.streak >= 3,
      description: "3 días de racha",
      category: "Racha",
    },
    {
      id: "streak_7",
      name: "Guerrero Semanal",
      icon: "flame",
      color: colors.accent.amber,
      unlocked: stats.streak >= 7,
      description: "7 días de racha",
      category: "Racha",
    },
    {
      id: "streak_14",
      name: "Imparable",
      icon: "rocket",
      color: colors.accent.rose,
      unlocked: stats.streak >= 14,
      description: "14 días de racha",
      category: "Racha",
    },
    {
      id: "streak_30",
      name: "Maestro Mensual",
      icon: "calendar",
      color: colors.primary[600],
      unlocked: stats.streak >= 30,
      description: "30 días de racha",
      category: "Racha",
    },
    {
      id: "streak_100",
      name: "Leyenda",
      icon: "star",
      color: "#F59E0B",
      unlocked: stats.streak >= 100,
      description: "100 días de racha",
      category: "Racha",
    },
    // Puntos
    {
      id: "points_100",
      name: "Coleccionista",
      icon: "diamond",
      color: colors.accent.cyan,
      unlocked: stats.totalPoints >= 100,
      description: "Acumula 100 puntos",
      category: "Puntos",
    },
    {
      id: "points_500",
      name: "Cazador de Puntos",
      icon: "trophy",
      color: colors.accent.rose,
      unlocked: stats.totalPoints >= 500,
      description: "Acumula 500 puntos",
      category: "Puntos",
    },
    {
      id: "points_1000",
      name: "Mil Glorias",
      icon: "medal",
      color: "#D97706",
      unlocked: stats.totalPoints >= 1000,
      description: "Acumula 1 000 puntos",
      category: "Puntos",
    },
    // Nivel
    {
      id: "level_5",
      name: "En Forma",
      icon: "trending-up",
      color: colors.primary[500],
      unlocked: stats.level >= 5,
      description: "Alcanza el nivel 5",
      category: "Nivel",
    },
    {
      id: "level_10",
      name: "Élite",
      icon: "infinite",
      color: colors.primary[700],
      unlocked: stats.level >= 10,
      description: "Alcanza el nivel 10",
      category: "Nivel",
    },
  ];

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
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar Sesión", 
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

  // En el perfil mostramos 6 logros: primero los desbloqueados, luego los bloqueados
  const previewAchievements = (() => {
    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);
    return [...unlocked, ...locked].slice(0, 6);
  })();

  // Agrupar todos los logros por categoría para el modal
  const achievementsByCategory = achievements.reduce<Record<string, Achievement[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Mi Perfil</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/configuracion")}
          >
            <Ionicons name="settings-outline" size={24} color={palette.text} />
          </TouchableOpacity>
        </View>

        {/* Identity Card — horizontal y compacto */}
        <View style={styles.identityCard}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityCard}
          >
            {/* Fila superior: avatar + info */}
            <View style={styles.identityRow}>
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{getInitials(user?.nombre || "U")}</Text>
                </View>
                {/* Badge de nivel sobre el avatar */}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Nv.{stats.level}</Text>
                </View>
              </View>

              {/* Nombre + correo */}
              <View style={styles.identityInfo}>
                <Text style={styles.identityName} numberOfLines={1}>
                  {user?.nombre || "Usuario"}
                </Text>
                <Text style={styles.identityEmail} numberOfLines={1}>
                  {user?.correo || ""}
                </Text>
              </View>
            </View>

            {/* Barra de XP */}
            <View style={styles.xpSection}>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${getLevelProgress()}%` }]} />
              </View>
              <Text style={styles.xpLabel}>
                {Math.round(getLevelProgress())}% para Nivel {stats.level + 1}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats únicos — no repetidos en Home */}
        <View style={[styles.uniqueStatsRow, { backgroundColor: palette.surface }]}>
          <View style={styles.uniqueStatCard}>
            <Ionicons name="list-circle" size={28} color={colors.primary[500]} />
            <Text style={[styles.uniqueStatValue, { color: palette.text }]}>{stats.totalHabits}</Text>
            <Text style={[styles.uniqueStatLabel, { color: palette.textMuted }]}>Hábitos activos</Text>
          </View>
          <View style={[styles.uniqueStatDivider, { backgroundColor: palette.border }]} />
          <View style={styles.uniqueStatCard}>
            <Ionicons name="ribbon" size={28} color={colors.accent.amber} />
            <Text style={[styles.uniqueStatValue, { color: palette.text }]}>{unlockedCount}</Text>
            <Text style={[styles.uniqueStatLabel, { color: palette.textMuted }]}>Logros obtenidos</Text>
          </View>
          <View style={[styles.uniqueStatDivider, { backgroundColor: palette.border }]} />
          <View style={styles.uniqueStatCard}>
            <Ionicons name="checkmark-done-circle" size={28} color={colors.secondary[500]} />
            <Text style={[styles.uniqueStatValue, { color: palette.text }]}>{stats.completionRate}%</Text>
            <Text style={[styles.uniqueStatLabel, { color: palette.textMuted }]}>Tasa de éxito</Text>
          </View>
        </View>

        {/* Achievements — preview */}
        <View style={[styles.achievementsSection, { backgroundColor: palette.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Logros</Text>
            <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>{unlockedCount} de {achievements.length} desbloqueados</Text>
          </View>

          {/* Grid de 6 logros preview (2 filas × 3 columnas) */}
          <View style={styles.achievementsGrid}>
            {previewAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>

          {/* Botón Ver todos */}
          {achievements.length > 6 && (
            <TouchableOpacity
              style={styles.verMasBtn}
              onPress={() => setShowAllAchievements(true)}
            >
              <Text style={styles.verMasText}>Ver todos los logros ({achievements.length})</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal: Todos los logros ── */}

      <Modal
        visible={showAllAchievements}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllAchievements(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: palette.bg }]}>
          {/* Handle + header */}
          <View style={[styles.modalHeader, { borderBottomColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.modalTitle, { color: palette.heading }]}>Todos los logros</Text>
            <Text style={[styles.modalSubtitle, { color: palette.textMuted }]}>{unlockedCount} de {achievements.length} desbloqueados</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowAllAchievements(false)}
            >
              <Ionicons name="close" size={22} color={palette.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScroll}
          >
            {Object.entries(achievementsByCategory).map(([category, items]) => (
              <View key={category} style={styles.modalCategory}>
                <Text style={[styles.modalCategoryTitle, { color: palette.textMuted }]}>{category}</Text>
                <View style={styles.achievementsGrid}>
                  {items.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} large />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  // Identity Card
  identityCard: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    marginBottom: spacing[4],
    ...shadows.lg,
    shadowColor: colors.primary[600],
    padding: spacing[5],
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  avatarWrap: {
    position: "relative",
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...shadows.sm,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.primary[600],
  },
  identityInfo: {
    flex: 1,
  },
  identityName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
  },
  identityEmail: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.75)",
  },

  // XP bar
  xpSection: {
    gap: spacing[2],
  },
  xpBarBg: {
    width: "100%",
    height: 7,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: colors.neutral[0],
    borderRadius: 4,
  },
  xpLabel: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },

  // Unique stats row
  uniqueStatsRow: {
    flexDirection: "row",
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
    alignItems: "center",
    ...shadows.sm,
  },
  uniqueStatCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing[1],
  },
  uniqueStatDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.neutral[100],
    marginHorizontal: spacing[2],
  },
  uniqueStatValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  uniqueStatLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: "center",
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
  achievementItemLarge: {
    width: "31%",
  },
  achievementIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  achievementDesc: {
    fontSize: 10,
    color: colors.neutral[400],
    textAlign: "center",
  },
  unlockedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary[500],
    justifyContent: "center",
    alignItems: "center",
  },

  // Ver más button
  verMasBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  verMasText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },

  // Modal logros
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  modalHeader: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  modalSubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  modalCloseBtn: {
    position: "absolute",
    top: spacing[5],
    right: spacing[5],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: 40,
  },
  modalCategory: {
    marginBottom: spacing[6],
  },
  modalCategoryTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.neutral[700],
    marginBottom: spacing[3],
    paddingLeft: spacing[1],
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
