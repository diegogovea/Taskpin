import React from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView 
} from "react-native";
import { useRouter } from "expo-router";

// Interface para definir la estructura de cada materia
interface Subject {
  id: number;
  title: string;
  description: string;
  topics: string[];
  icon: string;
  color: string;
  route: string;
}

export default function SubjectsHomeScreen() {
  const router = useRouter();

  // Configuración de las materias matemáticas
  const subjects: Subject[] = [
    {
      id: 1,
      title: "Álgebra",
      description: "Ecuaciones y expresiones algebraicas",
      topics: [
        "Ecuaciones de 1er grado",
        "Ecuaciones de 2do grado", 
        "Sistemas de ecuaciones",
        "Factorización"
      ],
      icon: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png", // Ícono de álgebra
      color: "#4CAF50", // Verde
      route: "/algebra"
    },
    {
      id: 2,
      title: "Geometría",
      description: "Formas, espacios y medidas",
      topics: [
        "Figuras planas",
        "Áreas y perímetros",
        "Volúmenes",
        "Teoremas geométricos"
      ],
      icon: "https://cdn-icons-png.flaticon.com/512/2103/2103658.png", // Ícono de geometría
      color: "#2196F3", // Azul
      route: "/geometria"
    },
    {
      id: 3,
      title: "Trigonometría",
      description: "Funciones trigonométricas y aplicaciones",
      topics: [
        "Funciones sen, cos, tan",
        "Identidades trigonométricas",
        "Ley de senos y cosenos",
        "Aplicaciones prácticas"
      ],
      icon: "https://cdn-icons-png.flaticon.com/512/2103/2103679.png", // Ícono de trigonometría
      color: "#FF9800", // Naranja
      route: "/trigonometria"
    },
    {
      id: 4,
      title: "Cálculo",
      description: "Límites, derivadas e integrales",
      topics: [
        "Límites y continuidad",
        "Derivadas",
        "Integrales",
        "Aplicaciones del cálculo"
      ],
      icon: "https://cdn-icons-png.flaticon.com/512/2103/2103665.png", // Ícono de cálculo
      color: "#9C27B0", // Púrpura
      route: "/calculo"
    }
  ];

  // Función para navegar a la materia seleccionada
  const navigateToSubject = (subject: Subject) => {
    try {
      console.log('Navegando a:', subject.route);
      // Temporalmente navega a home hasta crear las rutas específicas
      router.push('/(tabs)/home');
    } catch (error) {
      console.error('Error de navegación:', error);
    }
  };

  // Función que renderiza cada tarjeta de materia
  const renderSubject = (subject: Subject) => (
    <TouchableOpacity
      key={subject.id}
      style={[styles.subjectCard, { borderLeftColor: subject.color }]}
      onPress={() => navigateToSubject(subject)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* SECCIÓN IZQUIERDA: Ícono */}
        <View style={[styles.iconContainer, { backgroundColor: subject.color + '20' }]}>
          <Image source={{ uri: subject.icon }} style={styles.icon} />
        </View>
        
        {/* SECCIÓN DERECHA: Información */}
        <View style={styles.textContainer}>
          <Text style={styles.subjectTitle}>{subject.title}</Text>
          <Text style={styles.subjectDescription}>{subject.description}</Text>
          
          {/* Lista de temas */}
          <View style={styles.topicsContainer}>
            {subject.topics.map((topic, index) => (
              <View key={index} style={styles.topicItem}>
                <View style={[styles.bullet, { backgroundColor: subject.color }]} />
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* INDICADOR DE NAVEGACIÓN */}
        <View style={[styles.arrowContainer, { backgroundColor: subject.color }]}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>📚 Matemáticas</Text>
          <Text style={styles.subtitle}>Selecciona el área que quieres estudiar</Text>
        </View>

        {/* TARJETAS DE MATERIAS */}
        <View style={styles.subjectsContainer}>
          {subjects.map(renderSubject)}
        </View>

        {/* PIE DE PÁGINA CON INFORMACIÓN ADICIONAL */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Cada sección incluye ejercicios interactivos y explicaciones paso a paso
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS DEL COMPONENTE
const styles = StyleSheet.create({
  // CONTENEDORES PRINCIPALES
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Fondo gris muy claro
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ENCABEZADO
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
  },

  // CONTENEDOR DE MATERIAS
  subjectsContainer: {
    paddingHorizontal: 20,
  },

  // TARJETA DE MATERIA
  subjectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    borderLeftWidth: 6, // Línea de color izquierda
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Sombra para Android
    elevation: 3,
  },

  // CONTENIDO DE LA TARJETA
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // CONTENEDOR DEL ÍCONO
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    width: 32,
    height: 32,
    tintColor: "#2c3e50", // Color del ícono
  },

  // CONTENEDOR DE TEXTO
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  subjectDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
    lineHeight: 20,
  },

  // LISTA DE TEMAS
  topicsContainer: {
    marginTop: 4,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  topicText: {
    fontSize: 13,
    color: "#5a6c7d",
    lineHeight: 18,
  },

  // INDICADOR DE NAVEGACIÓN
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  arrowText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // PIE DE PÁGINA
  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#e8f4f8",
    marginHorizontal: 20,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#2c3e50",
    textAlign: "center",
    lineHeight: 20,
  },
});