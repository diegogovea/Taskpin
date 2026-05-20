// Importa el componente 'Stack' desde 'expo-router'.
// Este componente se utiliza para manejar la navegación tipo pila (stack navigation),
// es decir, navegar de una pantalla a otra apilándolas como en un historial.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { TutorialProvider } from "../contexts/TutorialContext";

function AppStack() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TutorialProvider>
          <AppStack />
        </TutorialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
