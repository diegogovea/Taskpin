import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../constants/theme";

const DARK_MODE_KEY = "@taskpin_dark_mode";

const lightColors = {
  // Fondos
  bg:          colors.neutral[50],   // fondo de pantalla
  surface:     colors.neutral[0],    // tarjetas / modales
  surfaceAlt:  colors.neutral[100],  // cards secundarias, inputs
  inputBg:     colors.neutral[100],  // fondos de input
  // Bordes
  border:      colors.neutral[100],  // bordes suaves
  divider:     colors.neutral[100],  // separadores
  // Texto
  heading:     colors.neutral[900],  // títulos fuertes
  text:        colors.neutral[900],  // texto principal
  textMuted:   colors.neutral[500],  // texto secundario
  textSubtle:  colors.neutral[400],  // texto tenue (placeholders, hints)
  // Iconos
  icon:        colors.neutral[500],
  iconSubtle:  colors.neutral[300],
};

const darkColors: ThemePalette = {
  // Fondos
  bg:          "#121212",
  surface:     "#1E1E1E",
  surfaceAlt:  "#2A2A2A",
  inputBg:     "#2A2A2A",
  // Bordes
  border:      "#2E2E2E",
  divider:     "#1A1A1A",
  // Texto
  heading:     "#FFFFFF",
  text:        "#F0F0F0",
  textMuted:   "#9E9E9E",
  textSubtle:  "#666666",
  // Iconos
  icon:        "#9E9E9E",
  iconSubtle:  "#444444",
};

export type ThemePalette = typeof lightColors;

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  palette: ThemePalette;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleDark: () => {},
  palette: lightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then((val) => {
      if (val === "true") setIsDark(true);
    });
  }, []);

  const toggleDark = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(DARK_MODE_KEY, String(next));
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, palette: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
