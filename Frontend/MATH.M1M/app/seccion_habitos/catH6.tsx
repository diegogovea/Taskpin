import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Toast } from "../../components/ui";

interface CustomHabito {
  habito_id: number;
  nombre: string;
  descripcion: string | null;
  puntos_base: number;
  habito_usuario_id: number | null;
  frecuencia_personal: string | null;
  fecha_agregado: string | null;
  categoria_nombre: string;
}

export default function CatH6Screen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [habitos, setHabitos] = useState<CustomHabito[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const fetchCustomHabitos = async () => {
    if (!user?.user_id) return;

    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/habitos/custom`);
      const data = await response.json();

      if (data.success) {
        setHabitos(data.data);
      } else {
        setToast({ visible: true, message: 'No se pudieron cargar los hábitos', type: 'error' });
      }
    } catch (error) {
      console.error("Error fetching custom habits:", error);
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    }
  };

  useEffect(() => {
    fetchCustomHabitos().finally(() => setLoading(false));
  }, [user?.user_id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        fetchCustomHabitos();
      }
    }, [user?.user_id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomHabitos();
    setRefreshing(false);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/seccion_habitos/tiposHabitos");
    }
  };

  const navigateToDetail = (habito: CustomHabito) => {
    if (habito.habito_usuario_id) {
      router.push(`/seccion_habitos/detalleHabito?habito_usuario_id=${habito.habito_usuario_id}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando tus hábitos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="sparkles" size={20} color={colors.primary[600]} />
          </View>
          <Text style={styles.headerTitle}>Mis Hábitos Personalizados</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {habitos.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="sparkles-outline" size={48} color={colors.neutral[300]} />
            </View>
            <Text style={styles.emptyTitle}>No tienes hábitos personalizados</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer hábito personalizado para comenzar a seguir tus metas únicas
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/seccion_habitos/catHCustom")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={20} color={colors.neutral[0]} />
                <Text style={styles.emptyButtonText}>Crear Hábito Personalizado</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* Habits List */
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listCount}>{habitos.length} hábito{habitos.length !== 1 ? 's' : ''}</Text>
            </View>

            <View style={styles.habitsList}>
              {habitos.map((habito) => (
                <TouchableOpacity
                  key={habito.habito_id}
                  style={styles.habitCard}
                  onPress={() => navigateToDetail(habito)}
                  activeOpacity={0.8}
                >
                  <View style={styles.habitContent}>
                    <View style={styles.habitIconContainer}>
                      <Ionicons name="sparkles" size={20} color={colors.primary[600]} />
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habito.nombre}</Text>
                      {habito.descripcion && (
                        <Text style={styles.habitDescription} numberOfLines={1}>
                          {habito.descripcion}
                        </Text>
                      )}
                      <View style={styles.habitMeta}>
                        <View style={styles.metaBadge}>
                          <Ionicons name="diamond-outline" size={12} color={colors.primary[500]} />
                          <Text style={styles.metaBadgeText}>{habito.puntos_base} pts</Text>
                        </View>
                        {habito.frecuencia_personal && (
                          <View style={styles.metaBadge}>
                            <Ionicons name="calendar-outline" size={12} color={colors.neutral[500]} />
                            <Text style={styles.metaBadgeText}>
                              {habito.frecuencia_personal === 'diario' ? 'Diario' : 
                               habito.frecuencia_personal === 'semanal' ? 'Semanal' : 'Mensual'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add More Button */}
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={() => router.push("/seccion_habitos/catHCustom")}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.addMoreText}>Crear otro hábito personalizado</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[16],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  emptyButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  listHeader: {
    marginBottom: spacing[4],
  },
  listCount: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  habitsList: {
    gap: spacing[3],
  },
  habitCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  habitDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  habitMeta: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    marginTop: spacing[4],
    gap: spacing[2],
  },
  addMoreText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
});
