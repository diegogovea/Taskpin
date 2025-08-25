import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BienestarSaludScreen() {
  const router = useRouter();

  // Función para retroceder
  const goBack = () => {
    console.log('Intentando retroceder...');
    if (router.canGoBack()) {
      router.back();
    } else {
      // Si no puede retroceder, navegar a home
      router.push('/(tabs)/home');
    }
  };

  // Datos de los planes de salud
  const planesData = [
    {
      id: 1,
      titulo: "Pérdida de Peso",
      meta: "Perder 5 kg",
      progreso: 0.6,
      color: "#10B981", // Verde
      icono: "fitness-outline",
      diasRestantes: 23,
      tareasCompletadas: 3,
      tareasTotales: 4
    },
    {
      id: 2,
      titulo: "Rutina de Ejercicio", 
      meta: "4 veces por semana",
      progreso: 0.75,
      color: "#3B82F6", // Azul
      icono: "barbell-outline",
      diasRestantes: 15,
      tareasCompletadas: 4,
      tareasTotales: 4
    },
    {
      id: 3,
      titulo: "Mejorar Sueño",
      meta: "8 horas diarias",
      progreso: 0.4,
      color: "#8B5CF6", // Púrpura
      icono: "moon-outline",
      diasRestantes: 45,
      tareasCompletadas: 2,
      tareasTotales: 5
    },
    {
      id: 4,
      titulo: "Hidratación",
      meta: "2.5L agua diarios",
      progreso: 0.85,
      color: "#06B6D4", // Cyan
      icono: "water-outline",
      diasRestantes: 8,
      tareasCompletadas: 7,
      tareasTotales: 8
    },
    {
      id: 5,
      titulo: "Bienestar Mental",
      meta: "15 min meditación",
      progreso: 0.3,
      color: "#F59E0B", // Naranja
      icono: "leaf-outline",
      diasRestantes: 37,
      tareasCompletadas: 1,
      tareasTotales: 3
    }
  ];

  // Componente para renderizar las estrellas
  const StarRating = ({ rating = 0 }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#FFD700" : "#C0C0C0"}
          style={{ marginRight: 1 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Componente para cada plan
  type Plan = {
    id: number;
    titulo: string;
    meta: string;
    progreso: number;
    color: string;
    icono: string;
    diasRestantes: number;
    tareasCompletadas: number;
    tareasTotales: number;
  };

  const PlanItem: React.FC<{ plan: Plan }> = ({ plan }) => {
    // Calcular rating basado en progreso
    const rating = Math.round(plan.progreso * 5);
    
    return (
      <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7}>
        {/* Icono del plan */}
        <View style={[styles.iconContainer, { backgroundColor: plan.color + '20' }]}>
          <Ionicons 
            name={plan.icono as keyof typeof Ionicons.glyphMap} 
            size={28} 
            color={plan.color} 
          />
          {/* Indicador de color */}
          <View style={[styles.colorIndicator, { backgroundColor: plan.color }]} />
        </View>
        
        {/* Contenido del plan */}
        <View style={styles.contentContainer}>
          {/* Título y meta */}
          <View style={styles.headerContainer}>
            <Text style={styles.titulo}>{plan.titulo}</Text>
            <Text style={styles.meta}>{plan.meta}</Text>
          </View>
          
          {/* Información adicional */}
          <View style={styles.infoContainer}>
            <View style={styles.taskInfo}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#666" />
              <Text style={styles.taskText}>
                {plan.tareasCompletadas}/{plan.tareasTotales} tareas
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.timeText}>{plan.diasRestantes} días</Text>
            </View>
          </View>
          
          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${plan.progreso * 100}%`,
                    backgroundColor: plan.color
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(plan.progreso * 100)}%
            </Text>
          </View>
          
          {/* Rating con estrellas */}
          <StarRating rating={rating} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER CON FLECHA ATRÁS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TÍTULO PRINCIPAL */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Salud y Bienestar</Text>
          <Text style={styles.subtitle}>
            {planesData.length} planes activos - Elige el que mejor se adapte a ti
          </Text>
        </View>
        
        {/* Lista de planes */}
        <View style={styles.listContainer}>
          {planesData.map((plan) => (
            <PlanItem key={plan.id} plan={plan} />
          ))}
        </View>
        
        {/* Botón para crear nuevo plan */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Crear nuevo plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Mismo fondo que el código 1
  },

  // Header elegante con flecha atrás
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    // Sombra flotante igual al código 1
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  
  // Contenedor del título (igual al código 1)
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Lista de planes
  listContainer: {
    marginBottom: 24,
  },
  
  // Item de plan individual
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Contenedor del icono
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  colorIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Contenido principal
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Información adicional
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskText: {
    fontSize: 12,
    color: '#6b7280',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Barra de progreso
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    minWidth: 32,
    textAlign: 'right',
  },
  
  // Estrellas
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Botón crear
  createButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});