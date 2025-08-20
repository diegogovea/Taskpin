// =====================================
// IMPORTACIONES NECESARIAS
// =====================================
import { Tabs } from "expo-router";
import { Ionicons, FontAwesome5, MaterialIcons, Entypo, AntDesign } from "@expo/vector-icons";
import { View, Platform, Text, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// =====================================
// COMPONENTE DEL HEADER GLOBAL BONITO
// Este header se verá en TODAS las secciones de la app
// =====================================
function GlobalHeader({ title }: { title: string }) {
  return (
    <>
      {/* SafeAreaView para evitar que se pegue con la barra de estado del celular */}
      <SafeAreaView style={{ backgroundColor: "#86EFAC" }} />
      
      {/* Header principal con gradiente verde pastel */}
      <LinearGradient colors={["#86EFAC", "#6EE7B7"]} style={styles.header}>
        <View style={styles.headerContent}>
          
          {/* ========== LADO IZQUIERDO: AVATAR + TEXTO ========== */}
          <View style={styles.userInfo}>
            {/* Avatar circular con icono de persona */}
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            
            {            /* Textos del usuario */}
            <View>
              <Text style={styles.welcomeText}>¡Bienvenido!</Text>
              {/* Este texto cambia según la sección actual */}
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          </View>
          
          {/* ========== LADO DERECHO: ESTADÍSTICAS ========== */}
          <View style={styles.statsContainer}>
            {/* Racha de días consecutivos */}
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#F59E0B" />
              <Text style={styles.statText}>5</Text>
            </View>
            
            {/* Gemas/Puntos del usuario */}
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={20} color="#06B6D4" />
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
              sectionName = "Inicio";               // Pantalla principal simplificada
              break;
            case "perfil":
              sectionName = "Mi Perfil";            // Para perfil del usuario
              break;
            case "habitos":
              sectionName = "Mis Hábitos";        // Para ajustes
              break;
            case "favoritos":
              sectionName = "Favoritos";            // Para ejercicios favoritos
              break;
            case "planes":
              sectionName = "Mis Planes";         // Para progreso y datos
              break;
            case "materia":
              sectionName = "Materias";             // Para categorías de matemáticas
              break;
            default:
              sectionName = "Taskpin";             // Texto por defecto
          }
          
          // Retorna el componente del header con el título correspondiente
          return <GlobalHeader title={sectionName} />;
        },
        
        // ========== ESTILOS DE LA BARRA DE NAVEGACIÓN INFERIOR ==========
        tabBarStyle: {
          backgroundColor: "#8B5CF6",                    // Color púrpura principal
          borderTopWidth: 0,                             // Sin borde superior
          height: Platform.OS === 'ios' ? 85 : 70,      // Altura según dispositivo
          paddingTop: 8,                                 // Espaciado superior
          paddingBottom: Platform.OS === 'ios' ? 25 : 8, // Espaciado inferior (más en iOS)
          paddingHorizontal: 15,                         // Más espaciado lateral
          
          // Sombra elegante hacia arriba
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 12,                                 // Sombra en Android
          
          // Esquinas redondeadas en la parte superior
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        },
        
        tabBarShowLabel: false, // Ocultar texto de las pestañas (solo iconos)
        
        // ========== CONFIGURACIÓN DE ICONOS PARA CADA PESTAÑA ==========
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          
          // CONFIGURACIÓN: Check ✓
          if (route.name === "habitos") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <AntDesign 
                  name="check" 
                  size={24} 
                  color={focused ? "#8B5CF6" : "rgba(255,255,255,0.8)"} 
                />
              </View>
            );
          } 
          
          // ESTADÍSTICAS: Gráfico de barras 📊
          else if (route.name === "planes") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <MaterialIcons 
                  name="bar-chart" 
                  size={24} 
                  color={focused ? "#8B5CF6" : "rgba(255,255,255,0.8)"} 
                />
              </View>
            );
          } 
          
          // HOME: Casa 🏠 (icono central más grande)
          else if (route.name === "home") {
            icon = (
              <View style={styles.homeIcon}>
                <Entypo name="home" size={28} color="#8B5CF6" />
              </View>
            );
          } 
          
          // FAVORITOS: Estrella ⭐
          else if (route.name === "favoritos") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <AntDesign 
                  name="star" 
                  size={22} 
                  color={focused ? "#8B5CF6" : "rgba(255,255,255,0.8)"} 
                />
              </View>
            );
          } 
          
          // PERFIL: Usuario 👤
          else if (route.name === "perfil") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={focused ? "#8B5CF6" : "rgba(255,255,255,0.8)"} 
                />
              </View>
            );
          } 
          
          // MATERIAS: Libro (si tienes esta pestaña)
          else if (route.name === "materia") {
            icon = (
              <View style={[
                focused ? styles.focusedIcon : styles.normalIcon,
                styles.iconContainer
              ]}>
                <FontAwesome5 
                  name="book" 
                  size={20} 
                  color={focused ? "#8B5CF6" : "rgba(255,255,255,0.8)"} 
                />
              </View>
            );
          }

          return icon;
        },
      })}
    >
      {/* ========== DEFINICIÓN DE LAS PANTALLAS/PESTAÑAS ========== */}
      <Tabs.Screen name="habitos" /> {/* Check / Settings */}
      <Tabs.Screen name="planes" />  {/* Gráfico */}
      <Tabs.Screen name="home" />          {/* Casa (centro) */}
      <Tabs.Screen name="favoritos" />     {/* Estrella */}
      <Tabs.Screen name="perfil" />        {/* Persona */}
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
    borderBottomLeftRadius: 25,                   // Esquina inferior izquierda redondeada
    borderBottomRightRadius: 25,                  // Esquina inferior derecha redondeada
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
    backgroundColor: "rgba(255,255,255,0.25)", // Fondo blanco semi-transparente
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
    minWidth: 45,                         // Ancho mínimo para área táctil
    minHeight: 45,                        // Alto mínimo para área táctil
  },
  
  // Estilo para iconos NO seleccionados
  normalIcon: {
    padding: 10,                          // Espaciado interno
    borderRadius: 15,                     // Bordes redondeados
    backgroundColor: "rgba(255,255,255,0.1)", // Fondo sutil semi-transparente
  },
  
  // Estilo para icono SÍ seleccionado (pestaña actual)
  focusedIcon: {
    padding: 12,                          // Más espaciado interno
    borderRadius: 18,                     // Más redondeado
    backgroundColor: "white",             // Fondo blanco sólido
    
    // Sombra elegante para destacar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,                         // Sombra en Android
  },
  
  // Estilo especial para el icono de HOME (siempre destacado)
  homeIcon: {
    padding: 15,                          // Espaciado generoso
    borderRadius: 30,                     // Círculo perfecto
    backgroundColor: "white",             // Fondo blanco
    justifyContent: 'center' as const,    // Centrar horizontalmente
    alignItems: 'center' as const,        // Centrar verticalmente
    
    // Sombra más pronunciada para que sobresalga
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,                         // Sombra en Android
    
    minWidth: 55,                         // Tamaño mínimo para que se vea grande
    minHeight: 55,
  },
};