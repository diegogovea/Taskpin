import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

// Configuración de estados de ánimo
const MOOD_OPTIONS = [
  { key: 'great', label: 'Excelente', color: '#22C55E', icon: 'sunny' },
  { key: 'good', label: 'Bien', color: '#84CC16', icon: 'partly-sunny' },
  { key: 'neutral', label: 'Neutral', color: '#F59E0B', icon: 'cloudy' },
  { key: 'low', label: 'Bajo', color: '#F97316', icon: 'rainy' },
  { key: 'bad', label: 'Mal', color: '#EF4444', icon: 'thunderstorm' },
];

interface ReflectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    estado_animo: string;
    que_salio_bien?: string;
    que_mejorar?: string;
  }) => Promise<void>;
  existingReflection?: {
    estado_animo: string;
    que_salio_bien?: string | null;
    que_mejorar?: string | null;
  } | null;
}

export default function ReflectionModal({
  visible,
  onClose,
  onSave,
  existingReflection,
}: ReflectionModalProps) {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [queSalioBien, setQueSalioBien] = useState('');
  const [queMejorar, setQueMejorar] = useState('');
  const [saving, setSaving] = useState(false);

  // Cargar datos existentes
  useEffect(() => {
    if (existingReflection) {
      setSelectedMood(existingReflection.estado_animo || '');
      setQueSalioBien(existingReflection.que_salio_bien || '');
      setQueMejorar(existingReflection.que_mejorar || '');
    } else {
      setSelectedMood('');
      setQueSalioBien('');
      setQueMejorar('');
    }
  }, [existingReflection, visible]);

  const handleSave = async () => {
    if (!selectedMood) return;
    
    setSaving(true);
    try {
      await onSave({
        estado_animo: selectedMood,
        que_salio_bien: queSalioBien.trim() || undefined,
        que_mejorar: queMejorar.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving reflection:', error);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!existingReflection;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? 'Editar Reflexión' : 'Reflexión Diaria'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mood Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Cómo te sientes hoy?</Text>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood.key}
                    style={[
                      styles.moodButton,
                      selectedMood === mood.key && {
                        backgroundColor: mood.color + '20',
                        borderColor: mood.color,
                      },
                    ]}
                    onPress={() => setSelectedMood(mood.key)}
                  >
                    <Ionicons
                      name={mood.icon as any}
                      size={28}
                      color={selectedMood === mood.key ? mood.color : colors.neutral[400]}
                    />
                    <Text
                      style={[
                        styles.moodLabel,
                        selectedMood === mood.key && { color: mood.color },
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* What went well */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Qué salió bien hoy?</Text>
              <Text style={styles.sectionHint}>Opcional - celebra tus logros</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ej: Completé mi rutina de la mañana..."
                placeholderTextColor={colors.neutral[400]}
                value={queSalioBien}
                onChangeText={setQueSalioBien}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* What to improve */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Qué podría ser mejor?</Text>
              <Text style={styles.sectionHint}>Opcional - áreas de crecimiento</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ej: Necesito dormir más temprano..."
                placeholderTextColor={colors.neutral[400]}
                value={queMejorar}
                onChangeText={setQueMejorar}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !selectedMood && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!selectedMood || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '90%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing[5],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  sectionHint: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[3],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  moodButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[50],
    borderWidth: 2,
    borderColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
  },
  moodLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[600],
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[800],
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  footer: {
    flexDirection: 'row',
    padding: spacing[5],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[600],
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
