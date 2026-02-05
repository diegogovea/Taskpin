import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";

const ONBOARDING_KEY = "@taskpin_onboarding_completed";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Proporciones fijas para que las 3 pantallas se vean iguales
const TITLE_FONT_SIZE = 32;
const DESCRIPTION_FONT_SIZE = 18;
const DESCRIPTION_LINE_HEIGHT = 28;
const ILLUSTRATION_HEIGHT = 600;
const CONTENT_PADDING_H = spacing[5];

const SLIDES = [
  {
    title: "Welcome to Taskpin",
    description:
      "We're here to help you build habits that stick. Let's make self-improvement easy and fun!",
    image: require("../components/images/pic1-onboarding.png"),
  },
  {
    title: "Track Your Progress",
    description:
      "Easily set goals, track your habits, and see your progress over time with our intuitive tools.",
    image: require("../components/images/pic2-onboarding.png"),
  },
  {
    title: "Stay Motivated",
    description:
      "Unlock achievements and get reminders to keep you motivated and on track to reach your goals.",
    image: require("../components/images/pic3-onboarding.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (e) {
      console.warn("Onboarding save failed", e);
    }
    router.replace("/login");
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStep(step + 1);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStep(step - 1);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const slide = SLIDES[step];
  const isFirst = step === 0;
  const isLast = step === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.neutral[0], colors.neutral[50]]}
        style={styles.gradient}
      >
        {/* Skip */}
        <View style={styles.skipRow}>
          <View style={styles.skipPlaceholder} />
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          {/* Illustration - tu imagen por pantalla */}
          <View style={styles.illustrationContainer}>
            <Image
              source={slide.image}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i === step && { backgroundColor: colors.primary[600] },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Buttons */}
        <View style={styles.footer}>
          {!isFirst ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary[600]} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {isLast ? "Get Started" : "Next"}
                  </Text>
                  {!isLast && (
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral[0]} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nextButtonFull}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.neutral[0]} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  gradient: {
    flex: 1,
    paddingHorizontal: CONTENT_PADDING_H,
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    minHeight: 48,
  },
  skipPlaceholder: { width: 60 },
  skipButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  skipText: {
    fontSize: 16,
    color: colors.neutral[500],
    fontWeight: typography.weight.medium,
  },
  content: {
    flex: 1,
    paddingTop: spacing[4],
    alignItems: "center",
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
    letterSpacing: -0.5,
    lineHeight: TITLE_FONT_SIZE * 1.15,
    textAlign: "center",
  },
  description: {
    fontSize: DESCRIPTION_FONT_SIZE,
    color: colors.neutral[500],
    lineHeight: DESCRIPTION_LINE_HEIGHT,
    marginBottom: spacing[5],
    minHeight: DESCRIPTION_LINE_HEIGHT * 3,
    textAlign: "center",
    paddingHorizontal: spacing[2],
  },
  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  illustrationImage: {
    width: SCREEN_WIDTH - spacing[8],
    height: ILLUSTRATION_HEIGHT,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[2],
    marginTop: spacing[5],
    marginBottom: spacing[2],
    minHeight: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  dotActive: {
    width: 24,
  },
  footer: {
    paddingTop: spacing[2],
    paddingBottom: spacing[8],
    minHeight: 64,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
    gap: spacing[2],
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  nextButton: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  nextButtonFull: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
