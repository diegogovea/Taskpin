import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
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
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
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
          {/* Logo */}
          <View style={styles.iconContainer}>
            <Image
              source={require("../components/images/iconoLogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{nombre}!</Text>

          {/* Message */}
          <Text style={styles.message}>
            ¿Listo para continuar construyendo{"\n"}tus hábitos hoy?
          </Text>
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
              <Text style={styles.primaryButtonText}>¡Vamos!</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.neutral[0]} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
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
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    marginBottom: spacing[6],
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
