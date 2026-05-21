import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isDark, palette } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [legalModal, setLegalModal] = useState<"privacidad" | "terminos" | null>(null);

  // 🔐 Si ya hay sesión, redirigir a home
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)/home");
    }
  }, [user, authLoading]);

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
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <LinearGradient
        colors={isDark ? ["#1a1a1a", "#121212"] : [colors.neutral[0], colors.neutral[50]]}
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
            <Image
              source={require("../components/images/iconoLogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Brand */}
          <Text style={styles.brandName}>taskpin</Text>
          <Text style={styles.tagline}>Construye hábitos que perduran</Text>
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
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button - Login */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.replace("/inicio")}
          >
            <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            Al continuar, aceptas nuestros{" "}
            <Text
              style={styles.termsLink}
              onPress={() => setLegalModal("terminos")}
            >
              Términos de Servicio
            </Text>
            {" "}y{" "}
            <Text
              style={styles.termsLink}
              onPress={() => setLegalModal("privacidad")}
            >
              Política de Privacidad
            </Text>
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* ── Modal Legal ── */}
      <Modal
        visible={legalModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModal(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: palette.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.heading }]}>
              {legalModal === "privacidad" ? "Política de Privacidad" : "Términos de Servicio"}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setLegalModal(null)}
            >
              <Ionicons name="close" size={22} color={palette.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {legalModal === "privacidad" ? (
              <>
                <Text style={styles.legalDate}>Última actualización: 1 de enero de 2026</Text>
                <Text style={styles.legalBody}>
                  En Taskpin nos comprometemos a proteger tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información personal.
                </Text>
                <Text style={styles.legalSubtitle}>1. Información que recopilamos</Text>
                <Text style={styles.legalBody}>
                  Recopilamos información que nos proporcionas directamente, como nombre, correo electrónico y contraseña al crear una cuenta. También recopilamos datos sobre tus hábitos y progreso dentro de la aplicación.
                </Text>
                <Text style={styles.legalSubtitle}>2. Uso de la información</Text>
                <Text style={styles.legalBody}>
                  Usamos tu información para proporcionar y mejorar nuestros servicios, personalizar tu experiencia, y enviarte notificaciones relevantes sobre tus hábitos y logros.
                </Text>
                <Text style={styles.legalSubtitle}>3. Protección de datos</Text>
                <Text style={styles.legalBody}>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado, pérdida o alteración.
                </Text>
                <Text style={styles.legalSubtitle}>4. Tus derechos</Text>
                <Text style={styles.legalBody}>
                  Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento desde la sección de Configuración de la app.
                </Text>
                <Text style={styles.legalSubtitle}>5. Contacto</Text>
                <Text style={styles.legalBody}>
                  Si tienes preguntas sobre esta política, contáctanos en privacidad@taskpin.app
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.legalDate}>Última actualización: 1 de enero de 2026</Text>
                <Text style={styles.legalBody}>
                  Bienvenido a Taskpin. Al usar nuestra aplicación, aceptas los siguientes términos y condiciones.
                </Text>
                <Text style={styles.legalSubtitle}>1. Uso de la aplicación</Text>
                <Text style={styles.legalBody}>
                  Taskpin es una aplicación de seguimiento de hábitos para uso personal. Te comprometes a usar la app de manera responsable y no para actividades ilegales o perjudiciales.
                </Text>
                <Text style={styles.legalSubtitle}>2. Cuenta de usuario</Text>
                <Text style={styles.legalBody}>
                  Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.
                </Text>
                <Text style={styles.legalSubtitle}>3. Propiedad intelectual</Text>
                <Text style={styles.legalBody}>
                  Todo el contenido de Taskpin, incluyendo diseño, código y marca, es propiedad de Taskpin y está protegido por derechos de autor.
                </Text>
                <Text style={styles.legalSubtitle}>4. Limitación de responsabilidad</Text>
                <Text style={styles.legalBody}>
                  Taskpin no se hace responsable por pérdida de datos o interrupciones del servicio. La app se proporciona "tal cual", sin garantías de ningún tipo.
                </Text>
                <Text style={styles.legalSubtitle}>5. Modificaciones</Text>
                <Text style={styles.legalBody}>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados dentro de la aplicación.
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    ...shadows.xl,
    shadowColor: colors.primary[600],
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    padding: spacing[6],
    paddingBottom: spacing[12],
  },
  legalDate: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    marginBottom: spacing[4],
  },
  legalSubtitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  legalBody: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    lineHeight: 22,
  },
});
