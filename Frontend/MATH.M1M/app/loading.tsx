import { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing } from "../constants/theme";

const ONBOARDING_KEY = "@taskpin_onboarding_completed";

export default function LoadingScreen() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Fade in and scale animation
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
    ]).start();

    // Progress bar animation → then route to onboarding or login
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start(async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (completed === "true") {
          router.replace("/login");
        } else {
          router.replace("/onboarding");
        }
      } catch {
        router.replace("/onboarding");
      }
    });
  }, []);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral[0], colors.neutral[50]]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../components/images/iconoLogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Brand Name */}
          <Text style={styles.brandName}>taskpin</Text>
          <Text style={styles.tagline}>Build better habits</Text>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressWrapper, { width: animatedWidth }]}>
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressBar}
                />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Loading your journey...</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing[8],
  },
  logoContainer: {
    marginBottom: spacing[8],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  brandName: {
    fontSize: 42,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    letterSpacing: -1,
    marginBottom: spacing[2],
  },
  tagline: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
    marginBottom: spacing[12],
  },
  progressSection: {
    width: 200,
    alignItems: "center",
  },
  progressBarBackground: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[200],
    overflow: "hidden",
  },
  progressWrapper: {
    height: "100%",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: spacing[12],
  },
  footerText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[400],
  },
});
