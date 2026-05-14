import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../constants/theme";

const DARK_MODE_KEY = "@taskpin_dark_mode";

// Paleta oscura — sólo sobreescribe los neutrales y los fondos
const darkColors = {
  bg:        "#121212",   // fondo de pantalla
  surface:   "#1e1e1e",   // tarjetas / modales
  border:    "#2e2e2e",   // bordes divisores
  text:      "#f0f0f0",   // texto principal
  textMuted: "#9e9e9e",   // texto secundario
};

const lightColors = {
  bg:        colors.neutral[50],
  surface:   colors.neutral[0],
  border:    colors.neutral[100],
  text:      colors.neutral[900],
  textMuted: colors.neutral[500],
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
