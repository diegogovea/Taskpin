// Frontend/MATH.M1M/app/seccion_planes/bienestarYSalud.tsx

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator,
  Alert 
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Interfaz para el tipo de plan
interface Plan {
  plan_id: number;
  meta_principal: string;
  descripcion: string;
  plazo_dias_estimado: number;
  dificultad: 'fácil' | 'intermedio' | 'difícil';
  imagen: string | null;
}

export default function BienestarSaludScreen() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener planes de la categoría Salud y Bienestar
  const fetchPlanes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar al endpoint de categoría 1 (Salud y Bienestar)
      const response = await fetch('http://localhost:8000/api/planes/categoria/1');
      const data = await response.json();
      
      if (data.success) {
        setPlanes(data.planes);
      } else {
        setError('Error al cargar los planes');
      }
    } catch (error) {
      console.error('Error fetching planes:', error);
      setError('Error de conexión. Verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar planes al montar el componente
  useEffect(() => {
    fetchPlanes();
  }, []);

  // Función para retroceder
  const goBack = () => {
    console.log('Intentando retroceder...');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/home');
    }
  };

  // Función para navegar al detalle del plan
  const navigateToPlanDetail = (planId: number) => {
    console.log(`Navegando al plan ${planId}`);
    // TODO: Navegar a pantalla de detalle
    router.push(`/seccion_planes/detallePlan?planId=${planId}` as any);
  };

  // Función para obtener el icono basado en el título del plan
  const getPlanIcon = (titulo: string): string => {
    const tituloLower = titulo.toLowerCase();
    if (tituloLower.includes('ejercicio') || tituloLower.includes('rutina')) return 'barbell-outline';
    if (tituloLower.includes('postura')) return 'body-outline';
    if (tituloLower.includes('sueño') || tituloLower.includes('dormir')) return 'moon-outline';
    if (tituloLower.includes('hidratación') || tituloLower.includes('agua')) return 'water-outline';
    if (tituloLower.includes('autocuidado') || tituloLower.includes('cuidado')) return 'heart-outline';
    return 'fitness-outline'; // Por defecto
  };

  // Función para obtener el color basado en la dificultad
  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case 'fácil': return '#10B981'; // Verde
      case 'intermedio': return '#F59E0B'; // Naranja
      case 'difícil': return '#EF4444'; // Rojo
      default: return '#6B7280'; // Gris
    }
  };

  // Componente para renderizar cada plan
  const PlanItem = ({ plan }: { plan: Plan }) => {
    const iconName = getPlanIcon(plan.meta_principal);
    const difficultyColor = getDifficultyColor(plan.dificultad);

    return (
      <TouchableOpacity 
        style={styles.planCard} 
        activeOpacity={0.8}
        onPress={() => navigateToPlanDetail(plan.plan_id)}
      >
        {/* Contenido principal */}
        <View style={styles.planContent}>
          {/* Icono y título */}
          <View style={styles.planHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${difficultyColor}20` }]}>
              <Ionicons name={iconName as any} size={24} color={difficultyColor} />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle} numberOfLines={2}>
                {plan.meta_principal}
              </Text>
              <Text style={styles.planDescription} numberOfLines={2}>
                {plan.descripcion}
              </Text>
            </View>
          </View>
          
          {/* Footer con información del plan */}
          <View style={styles.planFooter}>
            <View style={styles.planStats}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.statText}>{plan.plazo_dias_estimado} días</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flag-outline" size={14} color={difficultyColor} />
                <Text style={[styles.statText, { color: difficultyColor }]}>
                  {plan.dificultad}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando planes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error al cargar planes</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlanes}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            {planes.length} planes disponibles - Elige el que mejor se adapte a ti
          </Text>
        </View>
        
        {/* Lista de planes */}
        <View style={styles.listContainer}>
          {planes.map((plan) => (
            <PlanItem key={plan.plan_id} plan={plan} />
          ))}
        </View>
        
        {/* Mensaje si no hay planes */}
        {planes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay planes disponibles</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Lista de planes
  listContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planContent: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
});