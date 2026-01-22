// Importa el componente 'Stack' desde 'expo-router'.
// Este componente se utiliza para manejar la navegación tipo pila (stack navigation),
// es decir, navegar de una pantalla a otra apilándolas como en un historial.
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";

// Define el componente RootLayout, que es el layout raíz de la aplicación.
// Expo Router buscará automáticamente este componente en '/app/_layout.tsx'
// para definir cómo se estructura la navegación general de la app.
export default function RootLayout() {
  // Envolvemos TODA la app con AuthProvider para que cualquier pantalla
  // pueda acceder al estado de autenticación usando useAuth()
  return (
    <AuthProvider>
    <Stack
      screenOptions={{
        headerShown: false, // Oculta la barra superior en todas las pantallas
      }}
    />
    </AuthProvider>
  );
}
