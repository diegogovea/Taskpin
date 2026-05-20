import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { getCategoryColor } from "../../constants/categoryColors";
import { ConfirmModal } from "../../components/modals";
import { Toast, HabitCalendar } from "../../components/ui";

interface HabitoDetalle {
  habito_usuario_id: number;
  user_id: number;
  habito_id: number;
  fecha_agregado: string;
  activo: boolean;
  frecuencia_personal: string;
  nombre: string;
  descripcion: string | null;
  puntos_base: number;
  frecuencia_recomendada: string;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_id: number;
  color?: string | null;
  icono?: string | null;
  tipo?: string | null;
  fecha_fin?: string | null;
  meta_valor?: number | null;
  meta_unidad?: string | null;
  estadisticas: {
    dias_completados: number;
    racha_actual: number;
  };
}

interface HistorialDia {
  fecha: string;
  completado: boolean;
  hora_completado: string | null;
}

interface HistorialResumen {
  total_dias: number;
  dias_completados: number;
  porcentaje_completado: number;
}

interface RachasData {
  racha_actual: number;
  racha_maxima: number;
  fecha_inicio_racha_actual: string | null;
  estadisticas: {
    total_rachas: number;
    promedio_racha: number;
    dias_desde_primera_actividad: number;
  };
}

const FRECUENCIAS = [
  { value: 'diario',         label: 'Cada día',       icon: 'sunny-outline' },
  { value: 'cada_2_dias',    label: 'Cada 2 días',    icon: 'partly-sunny-outline' },
  { value: 'semanal',        label: 'Cada semana',    icon: 'calendar-outline' },
  { value: 'cada_2_semanas', label: 'Cada 2 semanas', icon: 'calendar-clear-outline' },
  { value: 'mensual',        label: 'Cada mes',       icon: 'calendar-number-outline' },
  { value: 'cada_2_meses',   label: 'Cada 2 meses',  icon: 'time-outline' },
];

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#14B8A6',
  '#3B82F6', '#06B6D4', '#84CC16', '#64748B',
];

const PRESET_ICONS = [
  'leaf-outline', 'fitness-outline', 'barbell-outline', 'bicycle-outline',
  'heart-outline', 'water-outline', 'moon-outline', 'sunny-outline',
  'book-outline', 'musical-notes-outline', 'brush-outline', 'code-slash-outline',
  'restaurant-outline', 'walk-outline', 'medkit-outline', 'brain',
];

export default function DetalleHabitoScreen() {
  const router = useRouter();
  const { habito_usuario_id } = useLocalSearchParams<{ habito_usuario_id: string }>();
  const { user, authFetch } = useAuth();

  const [habito, setHabito] = useState<HabitoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Historial & Rachas states
  const [historial, setHistorial] = useState<HistorialDia[]>([]);
  const [historialResumen, setHistorialResumen] = useState<HistorialResumen | null>(null);
  const [rachas, setRachas] = useState<RachasData | null>(null);
  
  // Modal & Toast states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editColor, setEditColor] = useState<string | null>(null);
  const [editIcono, setEditIcono] = useState<string | null>(null);
  const [editTipo, setEditTipo] = useState<string>('bueno');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editMetaValor, setEditMetaValor] = useState('');
  const [editMetaUnidad, setEditMetaUnidad] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const fetchHabitoDetalle = async () => {
    if (!user?.user_id || !habito_usuario_id) return;
    
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habito_usuario_id}/detalle`
      );
      const data = await response.json();
      
      if (data.success) {
        setHabito(data.data);
      } else {
        setToast({ visible: true, message: 'No se pudieron cargar los detalles del hábito', type: 'error' });
      }
    } catch (error) {
      console.error("Error fetching habit detail:", error);
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    }
  };

  const fetchHistorial = async () => {
    if (!user?.user_id || !habito_usuario_id) return;
    
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habito_usuario_id}/historial?dias=30`
      );
      const data = await response.json();
      
      if (data.success) {
        setHistorial(data.data.dias);
        setHistorialResumen(data.data.resumen);
      }
    } catch (error) {
      console.error("Error fetching historial:", error);
    }
  };

  const fetchRachas = async () => {
    if (!user?.user_id || !habito_usuario_id) return;
    
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habito_usuario_id}/rachas`
      );
      const data = await response.json();
      
      if (data.success) {
        setRachas(data.data);
      }
    } catch (error) {
      console.error("Error fetching rachas:", error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchHabitoDetalle(),
        fetchHistorial(),
        fetchRachas(),
      ]);
      setLoading(false);
    };
    loadAllData();
  }, [user?.user_id, habito_usuario_id]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/habitos");
    }
  };

  const updateFrecuencia = async (newFrecuencia: string) => {
    if (!user?.user_id || !habito_usuario_id || updating) return;
    if (habito?.frecuencia_personal === newFrecuencia) return;

    setUpdating(true);
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habito_usuario_id}/frecuencia`,
        {
          method: 'PUT',
          body: JSON.stringify({ frecuencia_personal: newFrecuencia }),
        }
      );
      const data = await response.json();

      if (data.success) {
        setHabito(prev => prev ? { ...prev, frecuencia_personal: newFrecuencia } : null);
        setToast({ visible: true, message: '¡Frecuencia actualizada!', type: 'success' });
      } else {
        setToast({ visible: true, message: 'No se pudo actualizar la frecuencia', type: 'error' });
      }
    } catch (error) {
      console.error("Error updating frequency:", error);
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePress = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user?.user_id || !habito?.habito_id) return;

    setDeleting(true);
    try {
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habito.habito_id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setToast({ visible: true, message: 'Hábito eliminado', type: 'success' });
        setTimeout(() => {
          router.replace("/(tabs)/habitos");
        }, 1000);
      } else {
        setShowDeleteModal(false);
        setToast({ visible: true, message: 'No se pudo eliminar el hábito', type: 'error' });
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
      setShowDeleteModal(false);
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = () => {
    setEditColor(habito?.color || null);
    setEditIcono(habito?.icono || null);
    setEditTipo(habito?.tipo || 'bueno');
    setEditFechaFin(habito?.fecha_fin ? habito.fecha_fin.slice(0, 10) : '');
    setEditMetaValor(habito?.meta_valor != null ? String(habito.meta_valor) : '');
    setEditMetaUnidad(habito?.meta_unidad || '');
    setShowEditModal(true);
  };

  const saveEditExtras = async () => {
    if (!user?.user_id || !habito_usuario_id || savingEdit) return;
    setSavingEdit(true);
    try {
      const body: Record<string, unknown> = {
        color: editColor || null,
        icono: editIcono || null,
        tipo: editTipo || null,
        fecha_fin: editFechaFin || null,
        meta_valor: editMetaValor ? parseFloat(editMetaValor) : null,
        meta_unidad: editMetaUnidad || null,
      };
      const response = await authFetch(
        `/api/usuario/${user.user_id}/habito/${habito_usuario_id}/campos-extra`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = await response.json();
      if (data.success) {
        setHabito(prev => prev ? {
          ...prev,
          color: editColor,
          icono: editIcono,
          tipo: editTipo,
          fecha_fin: editFechaFin || null,
          meta_valor: editMetaValor ? parseFloat(editMetaValor) : null,
          meta_unidad: editMetaUnidad || null,
        } : null);
        setShowEditModal(false);
        setToast({ visible: true, message: 'Hábito actualizado', type: 'success' });
      } else {
        setToast({ visible: true, message: data.detail || 'Error al guardar', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando hábito...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!habito) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.neutral[400]} />
          <Text style={styles.errorText}>No se encontró el hábito</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={goBack}>
            <Text style={styles.goBackButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor(habito.categoria_id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del hábito</Text>
        <TouchableOpacity style={styles.editHeaderBtn} onPress={openEditModal}>
          <Ionicons name="create-outline" size={22} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '15' }]}>
            <Ionicons 
              name={(habito.categoria_icono || 'leaf') as any} 
              size={40} 
              color={categoryColor} 
            />
          </View>
          <Text style={styles.habitName}>{habito.nombre}</Text>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
              {habito.categoria_nombre}
            </Text>
          </View>
        </View>

        {/* Description */}
        {habito.descripcion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{habito.descripcion}</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.accent.amber + '15' }]}>
            <Ionicons name="flame" size={24} color={colors.accent.amber} />
            <Text style={[styles.statValue, { color: colors.accent.amber }]}>
              {habito.estadisticas.racha_actual}
            </Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
            <Ionicons name="diamond" size={24} color={colors.primary[600]} />
            <Text style={[styles.statValue, { color: colors.primary[600] }]}>
              {habito.puntos_base}
            </Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.secondary[50] }]}>
            <Ionicons name="checkmark-done" size={24} color={colors.secondary[600]} />
            <Text style={[styles.statValue, { color: colors.secondary[600] }]}>
              {habito.estadisticas.dias_completados}
            </Text>
            <Text style={styles.statLabel}>Días Hechos</Text>
          </View>
        </View>

        {/* History Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial</Text>
          <View style={styles.calendarContainer}>
            <HabitCalendar historial={historial} />
          </View>
        </View>

        {/* Month Stats */}
        {historialResumen && (
          <View style={styles.monthStatsCard}>
            <View style={styles.monthStatItem}>
              <Text style={styles.monthStatValue}>
                {historialResumen.dias_completados}/{historialResumen.total_dias}
              </Text>
              <Text style={styles.monthStatLabel}>Días este mes</Text>
            </View>
            <View style={styles.monthStatDivider} />
            <View style={styles.monthStatItem}>
              <Text style={styles.monthStatValue}>
                {historialResumen.porcentaje_completado}%
              </Text>
              <Text style={styles.monthStatLabel}>Tasa de éxito</Text>
            </View>
          </View>
        )}

        {/* Extra info: meta, fecha fin, tipo */}
        {(habito.meta_valor || habito.fecha_fin || habito.tipo === 'por_eliminar') && (
          <View style={styles.extraInfoCard}>
            {habito.tipo === 'por_eliminar' && (
              <View style={styles.extraInfoRow}>
                <View style={[styles.extraInfoIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.extraInfoLabel}>Tipo</Text>
                  <Text style={[styles.extraInfoValue, { color: '#EF4444' }]}>Hábito a eliminar</Text>
                </View>
              </View>
            )}
            {habito.meta_valor != null && (
              <View style={styles.extraInfoRow}>
                <View style={[styles.extraInfoIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="flag" size={16} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.extraInfoLabel}>Meta diaria</Text>
                  <Text style={styles.extraInfoValue}>{habito.meta_valor} {habito.meta_unidad}</Text>
                </View>
              </View>
            )}
            {habito.fecha_fin && (
              <View style={styles.extraInfoRow}>
                <View style={[styles.extraInfoIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="calendar-clear" size={16} color="#F97316" />
                </View>
                <View>
                  <Text style={styles.extraInfoLabel}>Finaliza el</Text>
                  <Text style={styles.extraInfoValue}>
                    {new Date(habito.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Streaks Stats */}
        {rachas && (
          <View style={styles.streaksCard}>
            <View style={styles.streakItem}>
              <Ionicons name="trophy" size={20} color={colors.accent.amber} />
              <View>
                <Text style={styles.streakValue}>{rachas.racha_maxima} días</Text>
                <Text style={styles.streakLabel}>Mejor Racha</Text>
              </View>
            </View>
            <View style={styles.streakItem}>
              <Ionicons name="analytics" size={20} color={colors.primary[600]} />
              <View>
                <Text style={styles.streakValue}>{rachas.estadisticas.promedio_racha} días</Text>
                <Text style={styles.streakLabel}>Promedio</Text>
              </View>
            </View>
            <View style={styles.streakItem}>
              <Ionicons name="layers" size={20} color={colors.secondary[600]} />
              <View>
                <Text style={styles.streakValue}>{rachas.estadisticas.total_rachas}</Text>
                <Text style={styles.streakLabel}>Total Rachas</Text>
              </View>
            </View>
          </View>
        )}

        {/* Frequency Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frecuencia</Text>
          <View style={styles.frequencyContainer}>
            {FRECUENCIAS.map((freq) => {
              const isSelected = habito.frecuencia_personal === freq.value;
              return (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.frequencyOption,
                    isSelected && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => updateFrecuencia(freq.value)}
                  disabled={updating}
                >
                  {updating && isSelected ? (
                    <ActivityIndicator size="small" color={colors.primary[600]} />
                  ) : (
                    <>
                      <Ionicons 
                        name={freq.icon as any} 
                        size={20} 
                        color={isSelected ? colors.primary[600] : colors.neutral[400]} 
                      />
                      <Text style={[
                        styles.frequencyLabel,
                        isSelected && styles.frequencyLabelSelected,
                      ]}>
                        {freq.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark" size={14} color={colors.neutral[0]} />
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Added Date */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.neutral[400]} />
          <Text style={styles.infoText}>
            Agregado el {formatDate(habito.fecha_agregado)}
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDeletePress}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
          <Text style={styles.deleteButtonText}>Eliminar Hábito</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.neutral[50] }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Modal Header */}
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.editModalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Personalizar hábito</Text>
              <TouchableOpacity onPress={saveEditExtras} disabled={savingEdit}>
                <Text style={[styles.editModalSave, savingEdit && { opacity: 0.5 }]}>
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing[5] }}>
              {/* Color */}
              <Text style={styles.editSectionLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, editColor === c && styles.colorSwatchSelected]}
                    onPress={() => setEditColor(c)}
                  >
                    {editColor === c && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.colorSwatch, { backgroundColor: colors.neutral[100] }, !editColor && styles.colorSwatchSelected]}
                  onPress={() => setEditColor(null)}
                >
                  <Ionicons name="close" size={16} color={colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              {/* Icono */}
              <Text style={[styles.editSectionLabel, { marginTop: spacing[5] }]}>Icono</Text>
              <View style={styles.iconGrid}>
                {PRESET_ICONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconSwatch, editIcono === ic && styles.iconSwatchSelected]}
                    onPress={() => setEditIcono(ic)}
                  >
                    <Ionicons name={ic as any} size={22} color={editIcono === ic ? colors.primary[600] : colors.neutral[500]} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.iconSwatch, !editIcono && styles.iconSwatchSelected]}
                  onPress={() => setEditIcono(null)}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.neutral[400]} />
                </TouchableOpacity>
              </View>

              {/* Tipo */}
              <Text style={[styles.editSectionLabel, { marginTop: spacing[5] }]}>Tipo</Text>
              <View style={styles.tipoRow}>
                <TouchableOpacity
                  style={[styles.tipoBtn, editTipo === 'bueno' && styles.tipoBtnSelected]}
                  onPress={() => setEditTipo('bueno')}
                >
                  <Ionicons name="trending-up" size={16} color={editTipo === 'bueno' ? colors.secondary[600] : colors.neutral[400]} />
                  <Text style={[styles.tipoBtnText, editTipo === 'bueno' && { color: colors.secondary[600] }]}>Hábito positivo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tipoBtn, editTipo === 'por_eliminar' && styles.tipoBtnDanger]}
                  onPress={() => setEditTipo('por_eliminar')}
                >
                  <Ionicons name="trending-down" size={16} color={editTipo === 'por_eliminar' ? '#EF4444' : colors.neutral[400]} />
                  <Text style={[styles.tipoBtnText, editTipo === 'por_eliminar' && { color: '#EF4444' }]}>Hábito a eliminar</Text>
                </TouchableOpacity>
              </View>

              {/* Meta diaria */}
              <Text style={[styles.editSectionLabel, { marginTop: spacing[5] }]}>Meta diaria (opcional)</Text>
              <View style={styles.metaRow}>
                <TextInput
                  style={[styles.metaInput, { flex: 1 }]}
                  placeholder="Ej: 30"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="decimal-pad"
                  value={editMetaValor}
                  onChangeText={setEditMetaValor}
                />
                <TextInput
                  style={[styles.metaInput, { flex: 2 }]}
                  placeholder="Ej: minutos, vasos, km..."
                  placeholderTextColor={colors.neutral[400]}
                  value={editMetaUnidad}
                  onChangeText={setEditMetaUnidad}
                />
              </View>

              {/* Fecha fin */}
              <Text style={[styles.editSectionLabel, { marginTop: spacing[5] }]}>Fecha de fin (opcional)</Text>
              <TextInput
                style={styles.metaInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.neutral[400]}
                value={editFechaFin}
                onChangeText={setEditFechaFin}
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.editHint}>Déjalo en blanco si el hábito no tiene fecha límite</Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="¿Eliminar Hábito?"
        message={`Estás a punto de eliminar "${habito.nombre}". Esto eliminará todo tu progreso e historial. Esta acción no se puede deshacer.`}
        icon="trash-outline"
        danger={true}
        confirmText="Eliminar"
        cancelText="Conservar"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  errorText: {
    fontSize: typography.size.lg,
    color: colors.neutral[500],
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  goBackButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
  },
  goBackButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
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
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  editHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
  },
  editModalTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  editModalCancel: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  editModalSave: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  editSectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[3],
  },
  editHint: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
    marginTop: spacing[2],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.neutral[900],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  iconSwatch: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSwatchSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  tipoRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  tipoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
  },
  tipoBtnSelected: {
    backgroundColor: colors.secondary[50],
    borderWidth: 1.5,
    borderColor: colors.secondary[400],
  },
  tipoBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  tipoBtnText: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    fontWeight: typography.weight.medium,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  metaInput: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.size.base,
    color: colors.neutral[900],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: radius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  habitName: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  categoryBadge: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
  },
  categoryBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  descriptionCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  descriptionText: {
    fontSize: typography.size.base,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing[2],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  frequencyOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing[2],
  },
  frequencyOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  frequencyLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
  frequencyLabelSelected: {
    color: colors.primary[700],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.semantic.error + '40',
    backgroundColor: colors.semantic.error + '08',
    gap: spacing[2],
  },
  deleteButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.semantic.error,
  },
  calendarContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  monthStatsCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  monthStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[800],
  },
  monthStatLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  monthStatDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing[3],
  },
  extraInfoCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginTop: spacing[4],
    gap: spacing[4],
    ...shadows.sm,
  },
  extraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  extraInfoIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  extraInfoLabel: {
    fontSize: typography.size.xs, color: colors.neutral[500],
  },
  extraInfoValue: {
    fontSize: typography.size.sm, fontWeight: typography.weight.semibold,
    color: colors.neutral[800], marginTop: 2,
  },
  streaksCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    justifyContent: 'space-between',
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  streakValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.neutral[800],
  },
  streakLabel: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
});
