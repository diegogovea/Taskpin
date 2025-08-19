// Importaciones necesarias de React Native y Expo Router
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

// Interfaz que define la estructura de cada nivel
interface Level {
  id: number;           // Identificador único del nivel
  title: string;        // Título mostrado en la tarjeta
  description: string;  // Descripción breve del contenido
  topics: string[];     // Lista de temas que incluye el nivel
  color: string;        // Color de fondo de la tarjeta
  isUnlocked: boolean;  // Estado de disponibilidad del nivel
  route: string;        // Ruta de navegación cuando se selecciona
}

export default function HomeScreen() {
  // Hook para manejar la navegación entre pantallas
  const router = useRouter();

  // Array que contiene la configuración de todos los niveles disponibles
  const levels: Level[] = [
    // NIVEL 1: Matemáticas básicas (siempre disponible)
    {
      id: 1,
      title: 'PRIMER NIVEL',
      description: '10 ejercicios matemáticos básicos',
      topics: ['Suma y resta', 'Multiplicación', 'Álgebra simple', 'Fracciones'],
      color: '#6cc24a',        // Verde - Color amigable para principiantes
      isUnlocked: true,        // Único nivel disponible desde el inicio
      route: '/(tabs)/home'    // Ruta que sabemos existe (temporal)
    },
    // NIVEL 2: Matemáticas intermedias
    {
      id: 2,
      title: 'SEGUNDO NIVEL',
      description: 'Matemáticas intermedias',
      topics: ['Ecuaciones', 'Geometría', 'Porcentajes', 'Raíces'],
      color: '#4a90e2',        // Azul - Indica progresión
      isUnlocked: false,       // Se desbloquea al completar nivel 1
      route: '/(tabs)/home'    // Ruta temporal
    },
    // NIVEL 3: Matemáticas avanzadas
    {
      id: 3,
      title: 'TERCER NIVEL',
      description: 'Matemáticas avanzadas',
      topics: ['Funciones', 'Trigonometría', 'Logaritmos', 'Derivadas'],
      color: '#f5a623',        // Naranja - Mayor dificultad
      isUnlocked: false,       // Requiere completar niveles anteriores
      route: '/(tabs)/home'    // Ruta temporal
    },
    // NIVEL 4: Nivel experto (máxima dificultad)
    {
      id: 4,
      title: 'NIVEL EXPERTO',
      description: 'Desafíos matemáticos',
      topics: ['Integrales', 'Matrices', 'Estadística', 'Cálculo'],
      color: '#d0021b',        // Rojo - Indica máxima dificultad
      isUnlocked: false,       // Solo para usuarios avanzados
      route: '/(tabs)/home'    // Ruta temporal
    }
  ];

  // Función para manejar la navegación a un nivel específico
  const navigateToLevel = (level: Level) => {
    // Solo permite navegación si el nivel está desbloqueado
    if (level.isUnlocked) {
      try {
        console.log('Navegando a:', level.route); // Para debug
        router.push(level.route as any); // Forzamos el tipo
      } catch (error) {
        console.error('Error de navegación:', error);
        // Fallback: navegar a home si hay error
        router.push('/(tabs)/home');
      }
    }
    // Si está bloqueado, no hace nada (el TouchableOpacity está disabled)
  };

  // Función que renderiza una tarjeta individual de nivel
  const renderLevel = (level: Level) => (
    <TouchableOpacity
      key={level.id}  // Key único para la lista
      style={[
        styles.levelCard,
        // Cambia color según si está desbloqueado (color original) o bloqueado (gris)
        { backgroundColor: level.isUnlocked ? level.color : '#cccccc' }
      ]}
      onPress={() => navigateToLevel(level)}
      activeOpacity={level.isUnlocked ? 0.8 : 1}  // Efecto visual solo si está activo
      disabled={!level.isUnlocked}                // Deshabilita touch si está bloqueado
    >
      <View style={styles.levelCardContent}>
        {/* SECCIÓN IZQUIERDA: Información del nivel */}
        <View style={styles.levelInfo}>
          {/* Título del nivel con color dinámico */}
          <Text style={[
            styles.levelTitle,
            { color: level.isUnlocked ? '#fff' : '#888' }
          ]}>
            {level.title}
          </Text>
          
          {/* Descripción del nivel */}
          <Text style={[
            styles.levelDescription,
            { color: level.isUnlocked ? '#e8f5e8' : '#aaa' }
          ]}>
            {level.description}
          </Text>
          
          {/* Lista de temas incluidos en el nivel */}
          <Text style={[
            styles.levelDetails,
            { color: level.isUnlocked ? '#e8f5e8' : '#aaa' }
          ]}>
            {level.topics.map(topic => `• ${topic}`).join('\n')}
          </Text>
          
          {/* Mensaje de bloqueo (solo visible si el nivel está bloqueado) */}
          {!level.isUnlocked && (
            <Text style={styles.lockedText}>
              🔒 Completa el nivel anterior
            </Text>
          )}
        </View>
        
        {/* SECCIÓN DERECHA: Ícono circular con número y estado */}
        <View style={[
          styles.levelIcon,
          { backgroundColor: level.isUnlocked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }
        ]}>
          {/* Número del nivel */}
          <Text style={[
            styles.levelNumber,
            { color: level.isUnlocked ? '#fff' : '#888' }
          ]}>
            {level.id}
          </Text>
          
          {/* Texto de acción (INICIAR/BLOQUEADO) */}
          <Text style={[
            styles.startText,
            { color: level.isUnlocked ? '#fff' : '#888' }
          ]}>
            {level.isUnlocked ? 'INICIAR' : 'BLOQUEADO'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // RENDERIZADO PRINCIPAL DEL COMPONENTE
  return (
    <SafeAreaView style={styles.container}>
      {/* ScrollView permite desplazamiento vertical en pantallas pequeñas */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* ENCABEZADO: Título y subtítulo de bienvenida */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>¡Comienza tu aprendizaje!</Text>
          <Text style={styles.headerSubtitle}>
            Progresa a través de los niveles y domina las matemáticas
          </Text>
        </View>
        
        {/* CONTENEDOR DE NIVELES: Renderiza todas las tarjetas de nivel */}
        <View style={styles.levelsContainer}>
          {levels.map(renderLevel)}  {/* Itera sobre el array y crea una tarjeta por nivel */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS DEL COMPONENTE
const styles = StyleSheet.create({
  // Contenedor principal - ocupa toda la pantalla
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',  // Fondo gris claro
  },
  
  // ScrollView que permite desplazamiento vertical
  scrollView: {
    flex: 1,
  },
  
  // ESTILOS DEL ENCABEZADO
  header: {
    paddingHorizontal: 20,    // Espaciado lateral
    paddingTop: 20,           // Espaciado superior
    paddingBottom: 10,        // Espaciado inferior
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',            // Gris oscuro
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',            // Gris medio
    textAlign: 'center',
    marginBottom: 20,
  },
  
  // ESTILOS DE LOS NIVELES
  levelsContainer: {
    paddingHorizontal: 20,    // Margen lateral para las tarjetas
    paddingBottom: 20,        // Espaciado inferior
  },
  
  // Tarjeta individual de cada nivel
  levelCard: {
    borderRadius: 16,         // Bordes redondeados
    padding: 20,              // Espaciado interno
    marginBottom: 16,         // Separación entre tarjetas
    // Sombra para efecto de elevación
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,             // Sombra en Android
  },
  
  // Contenedor horizontal de la tarjeta (info + ícono)
  levelCardContent: {
    flexDirection: 'row',     // Disposición horizontal
    justifyContent: 'space-between',  // Espacio entre elementos
    alignItems: 'center',     // Centrado vertical
  },
  
  // ESTILOS DE LA INFORMACIÓN DEL NIVEL (lado izquierdo)
  levelInfo: {
    flex: 1,                  // Ocupa el espacio disponible
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  levelDescription: {
    fontSize: 16,
    marginBottom: 12,
  },
  levelDetails: {
    fontSize: 14,
    lineHeight: 20,           // Espaciado entre líneas
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 12,
    color: '#ff6b6b',         // Rojo suave para indicar bloqueo
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // ESTILOS DEL ÍCONO CIRCULAR (lado derecho)
  levelIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,         // Forma circular
    width: 80,
    height: 80,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  startText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});