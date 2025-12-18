import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";

export default function BienvenidaScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState("User");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const savedNombre = await AsyncStorage.getItem("nombre");
      if (savedNombre) {
        setNombre(savedNombre.split(" ")[0]); // First name only
      }
    } catch (error) {
      console.log("Error loading user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["access_token", "user_id", "nombre"]);
      router.replace("/login");
    } catch (error) {
      console.log("Error during logout:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[0]} />

      {/* Background decoration */}
      <View style={styles.backgroundDecoration}>
        <LinearGradient
          colors={[colors.primary[100], "transparent"]}
          style={styles.gradientCircle}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.mainSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.iconGradient}
            >
              <Ionicons name="sparkles" size={40} color={colors.neutral[0]} />
            </LinearGradient>
          </View>

          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{nombre}!</Text>

          {/* Message */}
          <Text style={styles.message}>
            Ready to continue building{"\n"}your habits today?
          </Text>

          {/* Stats Preview */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.accent.amber + "20" }]}>
                <Ionicons name="flame" size={20} color={colors.accent.amber} />
              </View>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="diamond" size={20} color={colors.primary[600]} />
              </View>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.secondary[100] }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.secondary[600]} />
              </View>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/home")}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Let's Go</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.neutral[0]} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sign out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  backgroundDecoration: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
  },
  gradientCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
    paddingBottom: spacing[8],
    justifyContent: "space-between",
  },
  mainSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: spacing[8],
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  greeting: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  userName: {
    fontSize: typography.size["4xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
    letterSpacing: -1,
  },
  message: {
    fontSize: typography.size.md,
    color: colors.neutral[500],
    textAlign: "center",
    lineHeight: 26,
    marginBottom: spacing[10],
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral[50],
    borderRadius: radius["2xl"],
    padding: spacing[5],
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
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
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.neutral[200],
  },
  buttonContainer: {
    gap: spacing[3],
  },
  primaryButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[5],
    gap: spacing[2],
  },
  primaryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  logoutButton: {
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
});
