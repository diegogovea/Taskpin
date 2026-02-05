import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext"; // ← NUEVO: Hook de autenticación

export default function SignInScreen() {
  const router = useRouter();
  
  // ✅ Usamos el register del AuthContext
  const { register, user, isLoading: authLoading } = useAuth();

  // 🔐 Si ya hay sesión, redirigir a home
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)/home");
    }
  }, [user, authLoading]);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!correo.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!validateEmail(correo)) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }

    if (!contraseña.trim()) {
      Alert.alert("Error", "Please enter a password");
      return;
    }

    if (contraseña.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (contraseña !== confirmarContraseña) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      // ✅ Usamos register del AuthContext (registra + hace login automático)
      const result = await register(
        nombre.trim(),
        correo.trim().toLowerCase(),
        contraseña
      );

      if (result.success) {
        // El registro + login fueron exitosos, ir a bienvenida
        router.replace("/bienvenida");
      } else {
        Alert.alert("Error", result.message || "Error creating account");
      }
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!contraseña) return { level: 0, text: "", color: colors.neutral[300] };
    if (contraseña.length < 6) return { level: 1, text: "Weak", color: colors.semantic.error };
    if (contraseña.length < 10) return { level: 2, text: "Fair", color: colors.semantic.warning };
    return { level: 3, text: "Strong", color: colors.semantic.success };
  };

  const passwordStrength = getPasswordStrength();

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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start your journey to better habits today
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <View
                style={[
                  styles.inputContainer,
                  nameFocused && styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={nameFocused ? colors.primary[600] : colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={colors.neutral[400]}
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
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
                  placeholder="your@email.com"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="email-address"
                  value={correo}
                  onChangeText={setCorreo}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
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
              {/* Password Strength */}
              {contraseña.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              level <= passwordStrength.level
                                ? passwordStrength.color
                                : colors.neutral[200],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.strengthText, { color: passwordStrength.color }]}
                  >
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <View
                style={[
                  styles.inputContainer,
                  confirmFocused && styles.inputContainerFocused,
                  confirmarContraseña.length > 0 &&
                    contraseña !== confirmarContraseña &&
                    styles.inputContainerError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={confirmFocused ? colors.primary[600] : colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.neutral[400]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmarContraseña}
                  onChangeText={setConfirmarContraseña}
                  autoCapitalize="none"
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.neutral[400]}
                  />
                </TouchableOpacity>
              </View>
              {confirmarContraseña.length > 0 && contraseña !== confirmarContraseña && (
                <Text style={styles.errorText}>Passwords don't match</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.registerButtonText}>
                {loading ? "Creating account..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/inicio")}>
              <Text style={styles.loginLink}>Sign in</Text>
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
    marginBottom: spacing[4],
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing[4],
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
    marginBottom: spacing[6],
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
  inputContainerError: {
    borderColor: colors.semantic.error,
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
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[2],
    gap: spacing[3],
  },
  strengthBars: {
    flexDirection: "row",
    gap: spacing[1],
  },
  strengthBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    marginTop: spacing[1],
  },
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing[8],
  },
  loginText: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  loginLink: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
});
