/**
 * TutorialOverlay
 *
 * Componente visual del tutorial interactivo.
 * Renderiza:
 *  1. Cuatro rectángulos semitransparentes que crean el efecto "spotlight"
 *     alrededor del área que se quiere destacar.
 *  2. Una flecha animada (bounce) que apunta al spotlight.
 *  3. Una tarjeta flotante con ícono, título, descripción, barra de progreso
 *     y botones "Omitir" / "Siguiente".
 *  4. Una pantalla de celebración al completar todos los pasos.
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTutorial } from "../../contexts/TutorialContext";
import { TUTORIAL_STEPS } from "../../constants/tutorialSteps";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_COLOR = "rgba(10, 10, 30, 0.72)";

// ─────────────────────────────────────────
// Pantalla de celebración final
// ─────────────────────────────────────────

function CelebrationScreen({ onDismiss }: { onDismiss: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Loop estrella
    Animated.loop(
      Animated.sequence([
        Animated.timing(starAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(starAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const starScale = starAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.celebrationBg}>
        <Animated.View
          style={[styles.celebrationCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: starScale }] }]}>
            🎉
          </Animated.Text>
          <Text style={styles.celebrationTitle}>¡Ya estás listo!</Text>
          <Text style={styles.celebrationSubtitle}>
            Conoces todas las secciones de Taskpin. Ahora es momento de construir hábitos increíbles.
          </Text>
          <Text style={styles.celebrationMotto}>
            Un hábito a la vez. Un día a la vez. 💪
          </Text>
          <TouchableOpacity onPress={onDismiss} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.celebrationBtn}
            >
              <Text style={styles.celebrationBtnText}>¡Comenzar ahora!</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.neutral[0]} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────
// Tutorial Overlay principal
// ─────────────────────────────────────────

export default function TutorialOverlay() {
  const { isActive, currentStep, currentStepIndex, next, skip, showCelebration, dismissCelebration } =
    useTutorial();


  // Animaciones
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Arrow bounce loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: -10, duration: 500, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [currentStepIndex]);

  // Fade in al cambiar de paso
  useEffect(() => {
    if (!isActive) return;
    cardAnim.setValue(0);
    overlayAnim.setValue(0);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [currentStepIndex, isActive]);

  if (showCelebration) {
    return <CelebrationScreen onDismiss={dismissCelebration} />;
  }

  if (!isActive || !currentStep) return null;

  const totalSteps = TUTORIAL_STEPS.length;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  // Calcular posición del spotlight
  const spotlightTop = currentStep.spotlight.topPercent * SCREEN_HEIGHT;
  const spotlightHeight = currentStep.spotlight.heightPercent * SCREEN_HEIGHT;
  const spotlightBottom = spotlightTop + spotlightHeight;

  const isTooltipBottom = currentStep.tooltipPosition === "bottom";

  // La flecha apunta hacia el spotlight desde la tarjeta
  const arrowRotation = isTooltipBottom ? "0deg" : "180deg";

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.container, { opacity: overlayAnim }]}>
        {/* ── Spotlight: 4 rectángulos oscuros ── */}
        {/* Arriba del spotlight */}
        <View
          style={[
            styles.overlayRect,
            { top: 0, left: 0, right: 0, height: spotlightTop },
          ]}
        />
        {/* Abajo del spotlight */}
        <View
          style={[
            styles.overlayRect,
            {
              top: spotlightBottom,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
        />
        {/* Izquierda del spotlight */}
        <View
          style={[
            styles.overlayRect,
            {
              top: spotlightTop,
              left: 0,
              width: 12,
              height: spotlightHeight,
            },
          ]}
        />
        {/* Derecha del spotlight */}
        <View
          style={[
            styles.overlayRect,
            {
              top: spotlightTop,
              right: 0,
              width: 12,
              height: spotlightHeight,
            },
          ]}
        />

        {/* ── Borde del spotlight ── */}
        <View
          style={[
            styles.spotlightBorder,
            {
              top: spotlightTop - 3,
              left: 9,
              right: 9,
              height: spotlightHeight + 6,
            },
          ]}
        />

        {/* ── Flecha animada ── */}
        <Animated.View
          style={[
            styles.arrowContainer,
            {
              top: isTooltipBottom
                ? spotlightBottom + 6
                : spotlightTop - 46,
              transform: [{ translateY: arrowAnim }],
            },
          ]}
        >
          <Ionicons
            name={isTooltipBottom ? "chevron-up" : "chevron-down"}
            size={28}
            color={colors.primary[400]}
            style={{ transform: [{ rotate: arrowRotation }] }}
          />
        </Animated.View>

        {/* ── Tarjeta tutorial ── */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isTooltipBottom ? 20 : -20, 0],
                  }),
                },
              ],
              ...(isTooltipBottom
                ? { top: spotlightBottom + 50, bottom: undefined }
                : { top: undefined, bottom: SCREEN_HEIGHT - spotlightTop + 50 }),
            },
          ]}
        >
          {/* Header: ícono + barra de progreso + skip */}
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons
                name={currentStep.icon as any}
                size={20}
                color={colors.primary[600]}
              />
            </View>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>

            <Text style={styles.stepCount}>
              {currentStepIndex + 1}/{totalSteps}
            </Text>
          </View>

          {/* Título y descripción */}
          <Text style={styles.cardTitle}>{currentStep.title}</Text>
          <Text style={styles.cardDescription}>{currentStep.description}</Text>

          {/* Botones */}
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={skip} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Omitir</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={next} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.primary[500], colors.primary[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  {currentStepIndex === totalSteps - 1 ? "¡Listo! 🎉" : "Siguiente"}
                </Text>
                {currentStepIndex < totalSteps - 1 && (
                  <Ionicons name="arrow-forward" size={16} color={colors.neutral[0]} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  overlayRect: {
    position: "absolute",
    backgroundColor: OVERLAY_COLOR,
  },
  spotlightBorder: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: colors.primary[400],
    borderRadius: radius.xl,
  },
  arrowContainer: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  // ── Tarjeta ──
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: colors.neutral[0],
    borderRadius: radius["2xl"],
    padding: spacing[5],
    ...shadows.xl,
    shadowColor: colors.primary[700],
    shadowOpacity: 0.18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  stepCount: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[400],
    minWidth: 32,
    textAlign: "right",
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  cardDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  skipBtnText: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    fontWeight: typography.weight.medium,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  nextBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },

  // ── Celebración ──
  celebrationBg: {
    flex: 1,
    backgroundColor: "rgba(10,10,30,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  celebrationCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius["3xl"],
    padding: spacing[8],
    alignItems: "center",
    width: "100%",
    ...shadows.xl,
    shadowColor: colors.primary[700],
    shadowOpacity: 0.3,
  },
  celebrationEmoji: {
    fontSize: 72,
    marginBottom: spacing[4],
  },
  celebrationTitle: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
    textAlign: "center",
  },
  celebrationSubtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing[4],
  },
  celebrationMotto: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
    textAlign: "center",
    marginBottom: spacing[6],
  },
  celebrationBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  celebrationBtnText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
});
