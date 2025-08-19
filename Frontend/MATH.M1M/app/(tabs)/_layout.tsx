// =====================================
// IMPORTACIONES NECESARIAS
// =====================================
import { Tabs } from "expo-router";
import { Ionicons, FontAwesome5, MaterialIcons, Entypo } from "@expo/vector-icons";
import { View, Platform, Text, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Para los gradientes bonitos

// =====================================
// COMPONENTE DEL HEADER GLOBAL BONITO
// Este header se verá en TODAS las secciones de la app
// =====================================
function GlobalHeader({ title }: { title: string }) {
  return (
    <>
      {/* SafeAreaView para evitar que se pegue con la barra de estado del celular */}
      <SafeAreaView style={{ backgroundColor: "#FFC043" }} />
      
      {/* Header principal con gradiente naranja */}
      <LinearGradient colors={["#FFC043", "#FF8A00"]} style={styles.header}>
        <View style={styles.headerContent}>
          
          {/* ========== LADO IZQUIERDO: AVATAR + TEXTO ========== */}
          <View style={styles.userInfo}>
            {/* Avatar circular con icono de persona */}
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            
            {/* Textos del usuario */}
            <View>
              <Text style={styles.welcomeText}>¡Hola!</Text>
              {/* Este texto cambia según la sección actual */}
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          </View>
          
          {/* ========== LADO DERECHO: ESTADÍSTICAS ========== */}
          <View style={styles.statsContainer}>
            {/* Racha de días consecutivos */}
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#FF6B35" />
              <Text style={styles.statText}>5</Text>
            </View>
            
            {/* Gemas/Puntos del usuario */}
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={20} color="#00BCD4" />
              <Text style={styles.statText}>250</Text>
            </View>
          </View>
          
        </View>
      </LinearGradient>
    </>
  );
}

// =====================================
// LAYOUT PRINCIPAL DE LAS PESTAÑAS
// Aquí se configura toda la navegación y diseño
// =====================================
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        
        // ========== HEADER PERSONALIZADO PARA CADA SECCIÓN ==========
        header: () => {
          let sectionName = "";
          
          // Determina qué texto mostrar según la pestaña actual
          switch (route.name) {
            case "home":
              sectionName = "Matemático";        // Para la pantalla principal
              break;
            case "perfil":
              sectionName = "Mi Perfil";         // Para perfil del usuario
              break;
            case "configuracion":
              sectionName = "Configuración";     // Para ajustes
              break;
            case "favoritos":
              sectionName = "Favoritos";         // Para ejercicios favoritos
              break;
            case "estadisticas":
              sectionName = "Estadísticas";      // Para progreso y datos
              break;
            case "materia":
              sectionName = "Materias";          // Para categorías de matemáticas
              break;
            default:
              sectionName = "MATH.M1M";          // Texto por defecto
          }
          
          // Retorna el componente del header con el título correspondiente
          return <GlobalHeader title={sectionName} />;
        },
        
        // ========== ESTILOS DE LA BARRA DE NAVEGACIÓN INFERIOR ==========
        tabBarStyle: {
          backgroundColor: "#FFC043",                    // Color principal (amarillo)
          borderTopWidth: 0,                             // Sin borde superior
          height: Platform.OS === 'ios' ? 85 : 70,      // Altura según dispositivo
          paddingTop: 8,                                 // Espaciado superior
          paddingBottom: Platform.OS === 'ios' ? 25 : 8, // Espaciado inferior (más en iOS)
          paddingHorizontal: 10,                         // Espaciado lateral
          
          // Sombra elegante hacia arriba
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 10,                                 // Sombra en Android
          
          // Esquinas redondeadas en la parte superior
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        
        tabBarShowLabel: false, // Ocultar texto de las pestañas (solo iconos)
        
        // ========== CONFIGURACIÓN DE ICONOS PARA CADA PESTAÑA ==========
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          
          // CONFIGURACIÓN: Icono cuando está en la sección actual
          if (route.name === "configuracion") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon, // Estilo según si está seleccionado
                styles.iconContainer
              ]}>
                <Ionicons 
                  name="settings" 
                  size={24} 
                  color={focused ? "#FFC043" : "white"}  // Color según estado
                />
              </View>
            );
          } 
          
          // ESTADÍSTICAS: Gráficos y progreso
          else if (route.name === "estadisticas") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <MaterialIcons 
                  name="bar-chart" 
                  size={24} 
                  color={focused ? "#FFC043" : "white"} 
                />
              </View>
            );
          } 
          
          // HOME: Icono especial más grande (pantalla principal)
          else if (route.name === "home") {
            icon = (
              <View style={styles.homeIcon}>
                <Entypo name="home" size={28} color="#FFC043" />
              </View>
            );
          } 
          
          // FAVORITOS: Ejercicios marcados como favoritos
          else if (route.name === "favoritos") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <FontAwesome5 
                  name="star" 
                  size={20} 
                  color={focused ? "#FFC043" : "white"} 
                />
              </View>
            );
          } 
          
          // PERFIL: Información del usuario
          else if (route.name === "perfil") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <Ionicons 
                  name="person-circle-outline" 
                  size={24} 
                  color={focused ? "#FFC043" : "white"} 
                />
              </View>
            );
          } 
          
          // MATERIAS: Categorías de matemáticas (suma, resta, etc.)
          else if (route.name === "materia") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <FontAwesome5 
                  name="book" 
                  size={20} 
                  color={focused ? "#FFC043" : "white"} 
                />
              </View>
            );
          }

          return icon;
        },
      })}
    >
      {/* ========== DEFINICIÓN DE LAS PANTALLAS/PESTAÑAS ========== */}
      <Tabs.Screen name="perfil" />      {/* Pantalla de perfil */}
      <Tabs.Screen name="configuracion" /> {/* Pantalla de configuración */}
      <Tabs.Screen name="home" />        {/* Pantalla principal */}
      <Tabs.Screen name="favoritos" />   {/* Pantalla de favoritos */}
      <Tabs.Screen name="estadisticas" /> {/* Pantalla de estadísticas */}
      <Tabs.Screen name="materia" />     {/* Pantalla de materias */}
    </Tabs>
  );
}

// =====================================
// ESTILOS PARA TODOS LOS COMPONENTES
// =====================================
const styles = {
  
  // ========== ESTILOS DEL HEADER GLOBAL ==========
  header: {
    paddingHorizontal: 20,                        // Espaciado lateral
    paddingTop: Platform.OS === 'ios' ? 15 : 20, // Espaciado superior (más en Android)
    paddingBottom: 20,                            // Espaciado inferior
    borderBottomLeftRadius: 20,                   // Esquina inferior izquierda redondeada
    borderBottomRightRadius: 20,                  // Esquina inferior derecha redondeada
  },
  
  headerContent: {
    flexDirection: "row" as const,        // Elementos en fila horizontal
    justifyContent: "space-between" as const, // Separar elementos a los extremos
    alignItems: "center" as const,        // Centrar verticalmente
  },
  
  // Contenedor del avatar + texto del usuario
  userInfo: {
    flexDirection: "row" as const,        // Avatar y texto en fila
    alignItems: "center" as const,        // Centrar verticalmente
  },
  
  // Avatar circular del usuario
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,                     // Radio para hacer círculo perfecto
    backgroundColor: "rgba(255,255,255,0.3)", // Fondo blanco semi-transparente
    justifyContent: "center" as const,    // Centrar icono horizontalmente
    alignItems: "center" as const,        // Centrar icono verticalmente
    marginRight: 12,                      // Espacio entre avatar y texto
  },
  
  // Texto "¡Hola!" pequeño
  welcomeText: {
    color: "white",
    fontSize: 14,
    opacity: 0.9,                         // Ligeramente transparente
  },
  
  // Texto principal (nombre de la sección)
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold" as const,          // Texto en negritas
  },
  
  // Contenedor de las estadísticas (racha + gemas)
  statsContainer: {
    flexDirection: "row" as const,        // Stats en fila horizontal
    gap: 15,                              // Espacio entre cada stat
  },
  
  // Cada elemento de estadística individual
  statItem: {
    flexDirection: "row" as const,        // Icono y número en fila
    alignItems: "center" as const,        // Centrar verticalmente
    backgroundColor: "rgba(255,255,255,0.2)", // Fondo blanco semi-transparente
    paddingHorizontal: 12,                // Espaciado horizontal interno
    paddingVertical: 6,                   // Espaciado vertical interno
    borderRadius: 15,                     // Bordes redondeados
    gap: 5,                               // Espacio entre icono y número
  },
  
  // Texto de los números de estadísticas
  statText: {
    color: "white",
    fontWeight: "bold" as const,
    fontSize: 14,
  },
  
  // ========== ESTILOS DE LA BARRA DE NAVEGACIÓN ==========
  
  // Contenedor base para todos los iconos
  iconContainer: {
    justifyContent: 'center' as const,    // Centrar icono horizontalmente
    alignItems: 'center' as const,        // Centrar icono verticalmente
    minWidth: 40,                         // Ancho mínimo para área táctil
    minHeight: 40,                        // Alto mínimo para área táctil
  },
  
  // Estilo para iconos NO seleccionados
  normalIcon: {
    padding: 8,                           // Espaciado interno
    borderRadius: 10,                     // Bordes ligeramente redondeados
    backgroundColor: "rgba(255,255,255,0.15)", // Fondo sutil semi-transparente
  },
  
  // Estilo para icono SÍ seleccionado (pestaña actual)
  focusedIcon: {
    padding: 10,                          // Más espaciado interno
    borderRadius: 12,                     // Más redondeado
    backgroundColor: "white",             // Fondo blanco sólido
    
    // Sombra elegante para destacar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,                         // Sombra en Android
  },
  
  // Estilo especial para el icono de HOME (siempre destacado)
  homeIcon: {
    padding: 12,                          // Espaciado generoso
    borderRadius: 25,                     // Círculo perfecto
    backgroundColor: "white",             // Fondo blanco
    justifyContent: 'center' as const,    // Centrar horizontalmente
    alignItems: 'center' as const,        // Centrar verticalmente
    
    // Sombra más pronunciada para que sobresalga
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,                         // Sombra en Android
    
    minWidth: 50,                         // Tamaño mínimo para que se vea grande
    minHeight: 50,
  },
};