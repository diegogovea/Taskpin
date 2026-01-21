import { Tabs } from "expo-router";
import { View, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { colors, radius, shadows } from "../../constants/theme";

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

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
