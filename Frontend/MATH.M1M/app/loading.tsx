import { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function LoadingScreen() {
  const router = useRouter();
  const [dots, setDots] = useState("");
  const maxDots = 3;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de barra de progreso: 0% a 100% en 2 segundos
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      // Cuando termine la animación, redirige
      router.replace("/login");
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < maxDots ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* 🔽 LOGO LOCAL 🔽 */}
      <Image
        source={require("../components/images/iconoLogo.png")} // Ajusta el nombre del archivo
        style={styles.logo}
        resizeMode="contain"
      />
      {/* 🔼 LOGO LOCAL 🔼 */}

      <Text style={styles.title}>TASKPIN</Text>

      <View style={styles.loadingBarBackground}>
        <Animated.View style={[styles.progressWrapper, { width: animatedWidth }]}>
          <LinearGradient
            colors={["#7DD3FC", "#8B5CF6"]} // Colores de azul claro a morado
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loadingBar}
          />
        </Animated.View>
      </View>

      <Text style={styles.text}>Cargando{dots}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937", // Color gris oscuro como en la imagen
    marginBottom: 40,
    letterSpacing: 2,
  },
  loadingBarBackground: {
    width: 180,
    height: 20,
    borderRadius: 50,
    backgroundColor: "#E5E7EB", // Gris claro para el fondo
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  progressWrapper: {
    height: "100%",
  },
  loadingBar: {
    height: "100%",
    borderRadius: 50,
  },
  text: {
    fontSize: 16,
    color: "#6B7280", // Gris medio para el texto
  },
});