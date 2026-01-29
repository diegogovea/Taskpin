import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces
interface Reflexion {
  reflexion_id: number;
  fecha: string;
  estado_animo: string;
  que_salio_bien?: string | null;
  que_mejorar?: string | null;
}

interface ResumenAnimo {
  great: number;
  good: number;
  neutral: number;
  low: number;
  bad: number;
}

// Configuración de estados de ánimo
const MOOD_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  great: { color: '#22C55E', icon: 'sunny', label: 'Great' },
  good: { color: '#84CC16', icon: 'partly-sunny', label: 'Good' },
  neutral: { color: '#F59E0B', icon: 'cloudy', label: 'Neutral' },
  low: { color: '#F97316', icon: 'rainy', label: 'Low' },
  bad: { color: '#EF4444', icon: 'thunderstorm', label: 'Bad' },
};

export default function HistorialReflexiones() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reflexiones, setReflexiones] = useState<Reflexion[]>([]);
  const [resumen, setResumen] = useState<ResumenAnimo>({
    great: 0, good: 0, neutral: 0, low: 0, bad: 0
  });
  const [total, setTotal] = useState(0);

  const loadHistorial = async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/reflexiones?limite=50`);
      const data = await response.json();
      
      if (data.success) {
        setReflexiones(data.reflexiones || []);
        setResumen(data.resumen || { great: 0, good: 0, neutral: 0, low: 0, bad: 0 });
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error loading historial:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadHistorial();
    }
  }, [user?.user_id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        loadHistorial();
      }
    }, [user?.user_id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistorial();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const totalReflexiones = Object.values(resumen).reduce((a, b) => a + b, 0);

  const MoodStat = ({ mood, count }: { mood: string; count: number }) => {
    const config = MOOD_CONFIG[mood];
    const percentage = totalReflexiones > 0 ? Math.round((count / totalReflexiones) * 100) : 0;
    
    return (
      <View style={styles.moodStat}>
        <View style={[styles.moodStatIcon, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={16} color={config.color} />
        </View>
        <Text style={styles.moodStatCount}>{count}</Text>
        <Text style={styles.moodStatPercent}>{percentage}%</Text>
      </View>
    );
  };

  const renderReflexion = ({ item }: { item: Reflexion }) => {
    const mood = MOOD_CONFIG[item.estado_animo] || MOOD_CONFIG.neutral;
    
    return (
      <View style={styles.reflexionCard}>
        <View style={styles.reflexionHeader}>
          <View style={[styles.moodBadge, { backgroundColor: mood.color + '20' }]}>
            <Ionicons name={mood.icon as any} size={18} color={mood.color} />
            <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          </View>
          <Text style={styles.reflexionDate}>{formatDate(item.fecha)}</Text>
        </View>
        
        {item.que_salio_bien && (
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>What went well</Text>
            <Text style={styles.textContent}>{item.que_salio_bien}</Text>
          </View>
        )}
        
        {item.que_mejorar && (
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>To improve</Text>
            <Text style={styles.textContent}>{item.que_mejorar}</Text>
          </View>
        )}
        
        {!item.que_salio_bien && !item.que_mejorar && (
          <Text style={styles.noNotesText}>No notes added</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reflection History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={reflexiones}
        keyExtractor={(item) => item.reflexion_id.toString()}
        renderItem={renderReflexion}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Stats Summary */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.summaryGradient}
              >
                <Text style={styles.summaryTitle}>Your Mood Journey</Text>
                <Text style={styles.summarySubtitle}>
                  {total} reflection{total !== 1 ? 's' : ''} recorded
                </Text>
                
                <View style={styles.moodStatsRow}>
                  <MoodStat mood="great" count={resumen.great} />
                  <MoodStat mood="good" count={resumen.good} />
                  <MoodStat mood="neutral" count={resumen.neutral} />
                  <MoodStat mood="low" count={resumen.low} />
                  <MoodStat mood="bad" count={resumen.bad} />
                </View>
              </LinearGradient>
            </View>
            
            {reflexiones.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Reflections</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="journal-outline" size={48} color={colors.neutral[400]} />
            </View>
            <Text style={styles.emptyTitle}>No reflections yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your reflection journey from the home screen
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  listContent: {
    padding: spacing[5],
    paddingBottom: spacing[10],
  },
  summaryCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[6],
    ...shadows.md,
  },
  summaryGradient: {
    padding: spacing[5],
  },
  summaryTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
  },
  summarySubtitle: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing[5],
  },
  moodStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodStat: {
    alignItems: 'center',
  },
  moodStatIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  moodStatCount: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  moodStatPercent: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[4],
  },
  reflexionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  reflexionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    gap: spacing[1],
  },
  moodLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  reflexionDate: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  textSection: {
    marginBottom: spacing[2],
  },
  textLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContent: {
    fontSize: typography.size.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  noNotesText: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
