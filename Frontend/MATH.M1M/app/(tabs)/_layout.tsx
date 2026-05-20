import { Tabs, useRouter } from "expo-router";
import { View, Platform, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import { colors, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTutorial } from "../../contexts/TutorialContext";
import { TutorialTab } from "../../constants/tutorialSteps";
import TutorialOverlay from "../../components/ui/TutorialOverlay";

// Tab icon component with modern styling
function TabIcon({
  name,
  focused,
  isCenter = false,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  isCenter?: boolean;
}) {
  if (isCenter) {
    return (
      <View style={styles.centerIconContainer}>
        <View style={[styles.centerIcon, focused && styles.centerIconFocused]}>
          <Ionicons
            name={name}
            size={26}
            color={focused ? colors.neutral[0] : colors.primary[600]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.iconWrapper}>
      <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
        <Ionicons
          name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
          size={22}
          color={focused ? colors.primary[600] : colors.neutral[400]}
        />
      </View>
      {focused && <View style={styles.focusIndicator} />}
    </View>
  );
}

const TAB_ROUTES: Record<TutorialTab, string> = {
  home: "/(tabs)/home",
  habitos: "/(tabs)/habitos",
  planes: "/(tabs)/planes",
  ai: "/(tabs)/ai",
  perfil: "/(tabs)/perfil",
};

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const { palette } = useTheme();
  const router = useRouter();
  const { setTabChangeHandler } = useTutorial();

  // Registrar el handler para cambio de tab desde el tutorial
  useEffect(() => {
    setTabChangeHandler((tab: TutorialTab) => {
      router.push(TAB_ROUTES[tab] as any);
    });
  }, [setTabChangeHandler]);

  // 🔐 Protección: Si no hay sesión, redirigir al login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading]);

  // Mientras verifica sesión, mostrar loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // Si no hay usuario, no renderizar nada (está redirigiendo)
  if (!user) {
    return null;
  }

  // Si hay usuario, mostrar las tabs normalmente
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: palette.surface }],
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="habitos"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="checkmark-circle" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="planes"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bar-chart" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} isCenter />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="sparkles" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
    <TutorialOverlay />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral[0],
  },
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 20,
    right: 20,
    height: 72,
    backgroundColor: colors.neutral[0],
    borderRadius: radius["2xl"],
    borderTopWidth: 0,
    paddingHorizontal: 8,
    ...shadows.lg,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerFocused: {
    backgroundColor: colors.primary[50],
  },
  focusIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[600],
    marginTop: 4,
  },
  centerIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  centerIconFocused: {
    backgroundColor: colors.primary[600],
  },
});
