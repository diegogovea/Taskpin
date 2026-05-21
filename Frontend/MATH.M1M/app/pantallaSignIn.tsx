import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTutorial } from "../contexts/TutorialContext";

interface FieldErrors {
  nombre: string;
  correo: string;
  contraseña: string;
  confirmar: string;
}

export default function SignInScreen() {
  const router = useRouter();
  const { register, user, isLoading: authLoading } = useAuth();
  const { scheduleTutorial } = useTutorial();
  const { isDark, palette } = useTheme();

  useEffect(() => {
    if (!authLoading && user) router.replace("/(tabs)/home");
  }, [user, authLoading]);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({ nombre: "", correo: "", contraseña: "", confirmar: "" });
  const [serverError, setServerError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const showBanner = (msg: string) => {
    setServerError(msg);
    bannerAnim.setValue(0);
    Animated.spring(bannerAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(bannerAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setServerError(""));
    }, 4000);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateField = (field: keyof FieldErrors, value: string): string => {
    switch (field) {
      case "nombre":
        if (!value.trim()) return "El nombre es obligatorio";
        if (value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
        return "";
      case "correo":
        if (!value.trim()) return "El correo es obligatorio";
        if (!validateEmail(value)) return "Ingresa un correo válido (ej: usuario@correo.com)";
        return "";
      case "contraseña":
        if (!value) return "La contraseña es obligatoria";
        if (value.length < 8) return "Mínimo 8 caracteres";
        return "";
      case "confirmar":
        if (!value) return "Confirma tu contraseña";
        if (value !== contraseña) return "Las contraseñas no coinciden";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field: keyof FieldErrors, value: string) => {
    const err = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleRegister = async () => {
    const newErrors: FieldErrors = {
      nombre: validateField("nombre", nombre),
      correo: validateField("correo", correo),
      contraseña: validateField("contraseña", contraseña),
      confirmar: validateField("confirmar", confirmarContraseña),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(e => e !== "")) return;

    setLoading(true);
    setServerError("");

    try {
      const result = await register(nombre.trim(), correo.trim().toLowerCase(), contraseña);
      if (result.success) {
        await scheduleTutorial();
        router.replace("/bienvenida");
      } else {
        const msg = result.message || "Error al crear la cuenta";
        if (msg.toLowerCase().includes("correo") || msg.toLowerCase().includes("email") || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exist")) {
          setErrors(prev => ({ ...prev, correo: "Este correo ya está registrado" }));
        } else {
          showBanner(msg);
        }
      }
    } catch {
      showBanner("Sin conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!contraseña) return { level: 0, text: "", color: colors.neutral[300] };
    if (contraseña.length < 8) return { level: 1, text: "Débil", color: colors.semantic.error };
    if (contraseña.length < 12) return { level: 2, text: "Regular", color: colors.semantic.warning };
    return { level: 3, text: "Fuerte", color: colors.semantic.success };
  };

  const passwordStrength = getPasswordStrength();

  const hasError = (field: keyof FieldErrors) => errors[field] !== "";

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: isDark ? '#121212' : colors.neutral[50] }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/login")}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require("../components/images/iconoLogo.png")} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.heading }]}>Crear cuenta</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>Comienza tu camino hacia mejores hábitos hoy</Text>
          </View>

          {/* ── Server Error Banner ── */}
          {serverError !== "" && (
            <Animated.View style={[styles.errorBanner, { opacity: bannerAnim, transform: [{ scale: bannerAnim }] }]}>
              <View style={styles.errorBannerIcon}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
              </View>
              <Text style={styles.errorBannerText}>{serverError}</Text>
              <TouchableOpacity onPress={() => setServerError("")} style={{ padding: 4 }}>
                <Ionicons name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo</Text>
              <View style={[styles.inputContainer, nameFocused && styles.inputContainerFocused, hasError("nombre") && styles.inputContainerError]}>
                <Ionicons name="person-outline" size={20} color={hasError("nombre") ? "#EF4444" : nameFocused ? colors.primary[600] : colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                  placeholder="Tu nombre"
                  placeholderTextColor={palette.textSubtle}
                  value={nombre}
                  onChangeText={t => { setNombre(t); if (errors.nombre) setErrors(p => ({ ...p, nombre: "" })); }}
                  autoCapitalize="words"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => { setNameFocused(false); handleBlur("nombre", nombre); }}
                />
              </View>
              {hasError("nombre") && <FieldError msg={errors.nombre} />}
            </View>

            {/* Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused, hasError("correo") && styles.inputContainerError]}>
                <Ionicons name="mail-outline" size={20} color={hasError("correo") ? "#EF4444" : emailFocused ? colors.primary[600] : colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                  placeholder="tucorreo@email.com"
                  placeholderTextColor={palette.textSubtle}
                  keyboardType="email-address"
                  value={correo}
                  onChangeText={t => { setCorreo(t); if (errors.correo) setErrors(p => ({ ...p, correo: "" })); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => { setEmailFocused(false); handleBlur("correo", correo); }}
                />
              </View>
              {hasError("correo") && <FieldError msg={errors.correo} />}
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused, hasError("contraseña") && styles.inputContainerError]}>
                <Ionicons name="lock-closed-outline" size={20} color={hasError("contraseña") ? "#EF4444" : passwordFocused ? colors.primary[600] : colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={palette.textSubtle}
                  secureTextEntry={!showPassword}
                  value={contraseña}
                  onChangeText={t => { setContraseña(t); if (errors.contraseña) setErrors(p => ({ ...p, contraseña: "" })); }}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => { setPasswordFocused(false); handleBlur("contraseña", contraseña); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              </View>
              {contraseña.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map(level => (
                      <View key={level} style={[styles.strengthBar, { backgroundColor: level <= passwordStrength.level ? passwordStrength.color : colors.neutral[200] }]} />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.text}</Text>
                </View>
              )}
              {hasError("contraseña") && <FieldError msg={errors.contraseña} />}
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.inputContainer, confirmFocused && styles.inputContainerFocused, hasError("confirmar") && styles.inputContainerError]}>
                <Ionicons name="lock-closed-outline" size={20} color={hasError("confirmar") ? "#EF4444" : confirmFocused ? colors.primary[600] : colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={palette.textSubtle}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmarContraseña}
                  onChangeText={t => { setConfirmarContraseña(t); if (errors.confirmar) setErrors(p => ({ ...p, confirmar: "" })); }}
                  autoCapitalize="none"
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => { setConfirmFocused(false); handleBlur("confirmar", confirmarContraseña); }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              </View>
              {hasError("confirmar") && <FieldError msg={errors.confirmar} />}
              {!hasError("confirmar") && confirmarContraseña.length > 0 && contraseña === confirmarContraseña && (
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.semantic.success} />
                  <Text style={styles.successText}>Las contraseñas coinciden</Text>
                </View>
              )}
            </View>

            {/* Botón */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <Ionicons name="reload-outline" size={18} color={colors.neutral[0]} style={{ marginRight: 8 }} />
                  <Text style={styles.registerButtonText}>Creando cuenta...</Text>
                </View>
              ) : (
                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace("/inicio")}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons name="alert-circle" size={13} color="#EF4444" />
      <Text style={styles.fieldErrorText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  content: { flex: 1 },
  logoContainer: { alignItems: "center", marginBottom: spacing[4] },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: { marginBottom: spacing[5] },
  title: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.neutral[500],
    lineHeight: 24,
  },
  // ── Error Banner ──
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  errorBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: "#B91C1C",
    lineHeight: 18,
  },
  // ── Form ──
  form: { flex: 1 },
  inputGroup: { marginBottom: spacing[4] },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
  },
  inputContainerFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.neutral[0],
  },
  inputContainerError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
  },
  inputIcon: { marginRight: spacing[3] },
  input: {
    flex: 1,
    paddingVertical: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[900],
  },
  eyeButton: { padding: spacing[2] },
  // ── Inline field error ──
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: spacing[2],
  },
  fieldErrorText: {
    fontSize: typography.size.xs,
    color: "#EF4444",
    flex: 1,
  },
  // ── Confirm match success ──
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: spacing[2],
  },
  successText: {
    fontSize: typography.size.xs,
    color: colors.semantic.success,
  },
  // ── Password strength ──
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[2],
    gap: spacing[3],
  },
  strengthBars: { flexDirection: "row", gap: spacing[1] },
  strengthBar: { width: 32, height: 4, borderRadius: 2 },
  strengthText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  // ── Button ──
  loadingRow: { flexDirection: "row", alignItems: "center" },
  registerButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[5],
    borderRadius: radius.xl,
    alignItems: "center",
    marginTop: spacing[4],
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  registerButtonDisabled: {
    backgroundColor: colors.neutral[300],
    shadowOpacity: 0,
  },
  registerButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  // ── Footer ──
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing[8],
  },
  loginText: { fontSize: typography.size.base, color: colors.neutral[500] },
  loginLink: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
});
