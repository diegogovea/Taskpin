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
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/3004/3004298.png",
        }}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>MATE APP</Text>

      <View style={styles.loadingBarBackground}>
        <Animated.View style={[styles.progressWrapper, { width: animatedWidth }]}>
          <LinearGradient
            colors={["#A0E869", "#FCE38A"]}
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
    color: "#f4af40",
    marginBottom: 40,
    letterSpacing: 2,
    textShadowColor: "#82cc55",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingBarBackground: {
    width: 180,
    height: 20,
    borderRadius: 50,
    backgroundColor: "#eee",
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
    color: "#666",
  },
});
