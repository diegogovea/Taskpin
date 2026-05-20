import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext"; // ← NUEVO: Hook de autenticación

export default function LoginScreen() {
  const router = useRouter();
  
  // ✅ Usamos el login del AuthContext
  const { login, user, isLoading: authLoading } = useAuth();

  // Flag para distinguir entre "sesión restaurada" vs "login recién hecho"
  const [isNewLogin, setIsNewLogin] = useState(false);

  // 🔐 Si ya hay sesión (restaurada, no login nuevo), redirigir a home
  useEffect(() => {
    if (!authLoading && user && !isNewLogin) {
      router.replace("/(tabs)/home");
    }
  }, [user, authLoading, isNewLogin]);
  
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ SIMPLIFICADO: Usa login() del AuthContext
  const handleLogin = async () => {
    if (!correo.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    if (!contraseña.trim()) {
      Alert.alert("Error", "Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);
    setIsNewLogin(true); // Marcar que es un login nuevo (no sesión restaurada)

    try {
      // Usamos el login del AuthContext (guarda token + user correctamente)
      const result = await login(correo.trim().toLowerCase(), contraseña);

      if (result.success) {
        router.replace("/bienvenida");
      } else {
        setIsNewLogin(false); // Reset si falló el login
        Alert.alert("Error", result.message || "Correo o contraseña incorrectos");
      }
    } catch (err) {
      setIsNewLogin(false); // Reset si hubo error
      Alert.alert("Error", "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/login")}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para continuar construyendo tus hábitos
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? colors.primary[600] : colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tucorreo@email.com"
                  placeholderTextColor={colors.neutral[400]}
                  value={correo}
                  onChangeText={setCorreo}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordFocused ? colors.primary[600] : colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.neutral[400]}
                  secureTextEntry={!showPassword}
                  value={contraseña}
                  onChangeText={setContraseña}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.neutral[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push("/pantallaSignIn")}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: spacing[6],
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
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
  header: {
    marginBottom: spacing[8],
  },
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
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing[5],
  },
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
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    paddingVertical: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[900],
  },
  eyeButton: {
    padding: spacing[2],
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: spacing[6],
  },
  forgotText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  loginButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[5],
    borderRadius: radius.xl,
    alignItems: "center",
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  loginButtonDisabled: {
    backgroundColor: colors.neutral[300],
    shadowOpacity: 0,
  },
  loginButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing[8],
  },
  registerText: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  registerLink: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
});
