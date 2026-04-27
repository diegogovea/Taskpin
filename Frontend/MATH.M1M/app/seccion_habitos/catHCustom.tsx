import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Toast } from "../../components/ui";

const FRECUENCIAS = [
  { value: 'diario', label: 'Diario', icon: 'today' },
  { value: 'semanal', label: 'Semanal', icon: 'calendar' },
  { value: 'mensual', label: 'Mensual', icon: 'calendar-outline' },
];

export default function CatHCustomScreen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [frecuencia, setFrecuencia] = useState('diario');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/seccion_habitos/tiposHabitos");
    }
  };

  const isValidForm = () => {
    return nombre.trim().length >= 3;
  };

  const handleCreate = async () => {
    if (!user?.user_id || !isValidForm() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/habitos/custom`, {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          frecuencia_personal: frecuencia,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ visible: true, message: '¡Hábito creado exitosamente!', type: 'success' });
        setTimeout(() => {
          router.replace("/(tabs)/habitos");
        }, 1200);
      } else {
        setToast({ visible: true, message: data.detail || 'Error al crear el hábito', type: 'error' });
      }
    } catch (error) {
      console.error("Error creating custom habit:", error);
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={32} color={colors.primary[600]} />
            </View>
            <Text style={styles.title}>Crear Hábito Personalizado</Text>
            <Text style={styles.subtitle}>
              Crea tu propio hábito personalizado
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del Hábito *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  nombre.length > 0 && nombre.length < 3 && styles.textInputError,
                ]}
                placeholder="ej., Leer 10 páginas"
                placeholderTextColor={colors.neutral[400]}
                value={nombre}
                onChangeText={setNombre}
                maxLength={100}
              />
              {nombre.length > 0 && nombre.length < 3 && (
                <Text style={styles.errorText}>El nombre debe tener al menos 3 caracteres</Text>
              )}
              <Text style={styles.charCount}>{nombre.length}/100</Text>
            </View>

            {/* Descripción */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Agrega más detalles sobre tu hábito..."
                placeholderTextColor={colors.neutral[400]}
                value={descripcion}
                onChangeText={setDescripcion}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{descripcion.length}/500</Text>
            </View>

            {/* Frecuencia */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frecuencia</Text>
              <View style={styles.frequencyContainer}>
                {FRECUENCIAS.map((freq) => {
                  const isSelected = frecuencia === freq.value;
                  return (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyOption,
                        isSelected && styles.frequencyOptionSelected,
                      ]}
                      onPress={() => setFrecuencia(freq.value)}
                    >
                      <Ionicons
                        name={freq.icon as any}
                        size={20}
                        color={isSelected ? colors.primary[600] : colors.neutral[400]}
                      />
                      <Text
                        style={[
                          styles.frequencyLabel,
                          isSelected && styles.frequencyLabelSelected,
                        ]}
                      >
                        {freq.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark" size={12} color={colors.neutral[0]} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="diamond" size={20} color={colors.primary[600]} />
            <Text style={styles.infoText}>
              Los hábitos personalizados dan <Text style={styles.infoHighlight}>10 puntos</Text> cada vez que los completas
            </Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, !isValidForm() && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!isValidForm() || isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isValidForm() ? colors.gradients.primary : [colors.neutral[300], colors.neutral[300]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              {isLoading ? (
                <Text style={styles.createButtonText}>Creando...</Text>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color={colors.neutral[0]} />
                  <Text style={styles.createButtonText}>Crear Hábito</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius['2xl'],
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  formSection: {
    gap: spacing[5],
    marginBottom: spacing[6],
  },
  inputGroup: {
    gap: spacing[2],
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[900],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  textInputError: {
    borderColor: colors.semantic.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing[4],
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.semantic.error,
    marginTop: spacing[1],
  },
  charCount: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
    textAlign: 'right',
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
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  infoHighlight: {
    fontWeight: typography.weight.bold,
    color: colors.primary[700],
  },
  createButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  createButtonDisabled: {
    shadowOpacity: 0,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[5],
    gap: spacing[2],
  },
  createButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
