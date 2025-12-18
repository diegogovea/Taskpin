import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral[0], colors.neutral[50]]}
        style={styles.gradient}
      >
        {/* Top Section */}
        <Animated.View
          style={[
            styles.topSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.logoGradient}
            >
              <Image
                source={require("../components/images/iconoLogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>

          {/* Brand */}
          <Text style={styles.brandName}>taskpin</Text>
          <Text style={styles.tagline}>Build habits that stick</Text>
        </Animated.View>

        {/* Bottom Section - Buttons */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Primary Button - Create Account */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => router.replace("/pantallaSignIn")}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button - Login */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.replace("/inicio")}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
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
    paddingHorizontal: spacing[6],
    paddingTop: spacing[20],
    paddingBottom: spacing[12],
  },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: spacing[8],
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.xl,
    shadowColor: colors.primary[600],
  },
  logo: {
    width: 56,
    height: 56,
    tintColor: colors.neutral[0],
  },
  brandName: {
    fontSize: 48,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    letterSpacing: -1.5,
    marginBottom: spacing[2],
  },
  tagline: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
  bottomSection: {
    paddingBottom: spacing[4],
  },
  primaryButton: {
    marginBottom: spacing[4],
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  primaryButtonGradient: {
    paddingVertical: spacing[5],
    alignItems: "center",
    borderRadius: radius.xl,
  },
  primaryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  secondaryButton: {
    paddingVertical: spacing[5],
    alignItems: "center",
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    marginBottom: spacing[6],
  },
  secondaryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
  },
  termsText: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary[600],
    fontWeight: typography.weight.medium,
  },
});
