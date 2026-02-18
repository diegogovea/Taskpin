import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { API_BASE_URL } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";

// =====================
// INTERFACES
// =====================

interface PlanDetalle {
  plan_id: number;
  meta_principal: string;
  descripcion: string;
  plazo_dias_estimado: number;
  dificultad: "fácil" | "intermedio" | "difícil";
  categoria_nombre: string;
  total_fases: number;
  total_tareas: number;
  fases: Fase[];
}

interface Fase {
  fase_id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  tareas: Tarea[];
}

interface Tarea {
  tarea_id: number;
  descripcion: string;
  dia_relativo: number;
}

interface HabitoUsuario {
  habito_usuario_id: number;
  habito_id: number;
  nombre: string;
  descripcion: string;
  categoria_nombre: string;
  puntos_base: number;
}

interface WizardConfig {
  fechaInicio: Date;
  diasPersonalizados: number;
  habitosSeleccionados: number[];
}

// =====================
// MAIN COMPONENT
// =====================

export default function WizardPlanScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams();
  const { user, authFetch } = useAuth();

  // States
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<PlanDetalle | null>(null);
  const [misHabitos, setMisHabitos] = useState<HabitoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [config, setConfig] = useState<WizardConfig>({
    fechaInicio: new Date(),
    diasPersonalizados: 0,
    habitosSeleccionados: [],
  });

  // =====================
  // FETCH DATA
  // =====================

  useEffect(() => {
    if (planId) {
      Promise.all([fetchPlanDetalle(), fetchMisHabitos()]).finally(() => {
        setLoading(false);
      });
    }
  }, [planId]);

  const fetchPlanDetalle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/planes/detalle/${planId}`);
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
        setConfig(prev => ({
          ...prev,
          diasPersonalizados: data.plan.plazo_dias_estimado,
        }));
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
      Alert.alert("Error", "No se pudieron cargar los detalles del plan");
    }
  };

  const fetchMisHabitos = async () => {
    if (!user?.user_id) return;
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/habitos`);
      const data = await response.json();
      if (data.success) {
        setMisHabitos(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  // =====================
  // HANDLERS
  // =====================

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.canGoBack() ? router.back() : router.replace("/(tabs)/planes");
    }
  };

  const goNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const toggleHabito = (habitoUsuarioId: number) => {
    setConfig(prev => ({
      ...prev,
      habitosSeleccionados: prev.habitosSeleccionados.includes(habitoUsuarioId)
        ? prev.habitosSeleccionados.filter(id => id !== habitoUsuarioId)
        : [...prev.habitosSeleccionados, habitoUsuarioId],
    }));
  };

  const togglePhase = (phaseId: number) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId) ? prev.filter(id => id !== phaseId) : [...prev, phaseId]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setConfig(prev => ({ ...prev, fechaInicio: selectedDate }));
    }
  };

  const calcularFechaObjetivo = (): Date => {
    const fecha = new Date(config.fechaInicio);
    fecha.setDate(fecha.getDate() + config.diasPersonalizados);
    return fecha;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!plan || !user?.user_id) return;

    setSubmitting(true);
    try {
      console.log("[WizardPlan] Submitting plan:", {
        user_id: user.user_id,
        plan_id: plan.plan_id,
        dias: config.diasPersonalizados,
        habitos: config.habitosSeleccionados.length,
      });

      const response = await authFetch(`/api/planes/agregar-con-habitos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          plan_id: plan.plan_id,
          dias_personalizados: config.diasPersonalizados,
          fecha_inicio: config.fechaInicio.toISOString().split("T")[0],
          habitos_a_vincular: config.habitosSeleccionados,
        }),
      });

      console.log("[WizardPlan] Response status:", response.status);

      // Handle auth errors
      if (response.status === 401) {
        Alert.alert(
          "Sesión Expirada",
          "Por favor inicia sesión nuevamente para continuar.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await response.json();

      if (result.success) {
        const msg = result.habitos_vinculados > 0 
          ? `Tu plan ha sido creado con ${result.habitos_vinculados} hábitos vinculados.`
          : "Tu plan ha sido creado exitosamente.";
        setSuccessMessage(msg);
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", result.message || result.detail || "No se pudo crear el plan");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================
  // HELPER FUNCTIONS
  // =====================

  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case "fácil": return colors.secondary[500];
      case "intermedio": return colors.accent.amber;
      case "difícil": return colors.semantic.error;
      default: return colors.neutral[500];
    }
  };

  const getDifficultyLabel = (dificultad: string) => {
    switch (dificultad) {
      case "fácil": return "Fácil";
      case "intermedio": return "Intermedio";
      case "difícil": return "Difícil";
      default: return dificultad;
    }
  };

  // =====================
  // LOADING STATE
  // =====================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
          <Text style={styles.loadingText}>Plan no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================
  // STEP 1: PREVIEW
  // =====================

  const renderStep1 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Plan Header */}
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{plan.meta_principal}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: getDifficultyColor(plan.dificultad) + "15" }]}>
            <Text style={[styles.badgeText, { color: getDifficultyColor(plan.dificultad) }]}>
              {getDifficultyLabel(plan.dificultad)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primary[100] }]}>
            <Text style={[styles.badgeText, { color: colors.primary[600] }]}>
              {plan.plazo_dias_estimado} días
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.secondary[100] }]}>
            <Text style={[styles.badgeText, { color: colors.secondary[600] }]}>
              {plan.total_fases} fases
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{plan.descripcion}</Text>

      {/* Phases */}
      <View style={styles.phasesSection}>
        <Text style={styles.sectionTitle}>Fases del Plan</Text>
        {plan.fases.map((fase, index) => {
          const isExpanded = expandedPhases.includes(fase.fase_id);
          return (
            <TouchableOpacity 
              key={fase.fase_id} 
              style={styles.phaseCard}
              onPress={() => togglePhase(fase.fase_id)}
              activeOpacity={0.7}
            >
              <View style={styles.phaseHeader}>
                <View style={styles.phaseNumber}>
                  <Text style={styles.phaseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.phaseInfo}>
                  <Text style={styles.phaseName}>{fase.nombre}</Text>
                  <Text style={styles.phaseDescription}>{fase.descripcion}</Text>
                </View>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.neutral[400]} 
                />
              </View>
              
              {isExpanded && (
                <View style={styles.tasksList}>
                  {fase.tareas.map((tarea) => (
                    <View key={tarea.tarea_id} style={styles.taskItem}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.neutral[400]} />
                      <Text style={styles.taskText}>{tarea.descripcion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  // =====================
  // STEP 2: DATES
  // =====================

  const renderStep2 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepIcon}>
        <Ionicons name="calendar" size={48} color={colors.primary[600]} />
      </View>
      <Text style={styles.stepTitle}>¿Cuándo empiezas?</Text>
      <Text style={styles.stepSubtitle}>Elige tu fecha de inicio y personaliza la duración</Text>

      {/* Start Date */}
      <View style={styles.dateSection}>
        <Text style={styles.fieldLabel}>Fecha de Inicio</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.dateButtonText}>{formatDate(config.fechaInicio)}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={config.fechaInicio}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Duration */}
      <View style={styles.dateSection}>
        <Text style={styles.fieldLabel}>Duración (días)</Text>
        <View style={styles.durationSelector}>
          <TouchableOpacity 
            style={styles.durationButton}
            onPress={() => setConfig(prev => ({ 
              ...prev, 
              diasPersonalizados: Math.max(7, prev.diasPersonalizados - 7) 
            }))}
          >
            <Ionicons name="remove" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
          <View style={styles.durationValue}>
            <Text style={styles.durationNumber}>{config.diasPersonalizados}</Text>
            <Text style={styles.durationLabel}>días</Text>
          </View>
          <TouchableOpacity 
            style={styles.durationButton}
            onPress={() => setConfig(prev => ({ 
              ...prev, 
              diasPersonalizados: prev.diasPersonalizados + 7 
            }))}
          >
            <Ionicons name="add" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>
        <Text style={styles.recommendedText}>
          Recomendado: {plan.plazo_dias_estimado} días
        </Text>
      </View>

      {/* Target Date Preview */}
      <View style={styles.targetDateCard}>
        <View style={styles.targetDateIcon}>
          <Ionicons name="flag" size={24} color={colors.secondary[600]} />
        </View>
        <View>
          <Text style={styles.targetDateLabel}>Fecha objetivo</Text>
          <Text style={styles.targetDateValue}>{formatDate(calcularFechaObjetivo())}</Text>
        </View>
      </View>
    </ScrollView>
  );

  // =====================
  // STEP 3: HABITS
  // =====================

  const renderStep3 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepIcon}>
        <Ionicons name="refresh" size={48} color={colors.secondary[600]} />
      </View>
      <Text style={styles.stepTitle}>Vincula tus hábitos</Text>
      <Text style={styles.stepSubtitle}>
        Opcional: Selecciona hábitos para seguir junto con las tareas de tu plan
      </Text>

      {misHabitos.length === 0 ? (
        <View style={styles.emptyHabits}>
          <Ionicons name="leaf-outline" size={48} color={colors.neutral[300]} />
          <Text style={styles.emptyHabitsText}>Sin hábitos aún</Text>
          <Text style={styles.emptyHabitsSubtext}>
            Puedes agregar hábitos desde la sección de Hábitos
          </Text>
        </View>
      ) : (
        <View style={styles.habitsList}>
          {misHabitos.map((habito) => {
            const isSelected = config.habitosSeleccionados.includes(habito.habito_usuario_id);
            return (
              <TouchableOpacity
                key={habito.habito_usuario_id}
                style={[styles.habitCard, isSelected && styles.habitCardSelected]}
                onPress={() => toggleHabito(habito.habito_usuario_id)}
                activeOpacity={0.7}
              >
                <View style={[styles.habitCheckbox, isSelected && styles.habitCheckboxSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color={colors.neutral[0]} />}
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habito.nombre}</Text>
                  <Text style={styles.habitCategory}>{habito.categoria_nombre}</Text>
                </View>
                <View style={styles.habitPoints}>
                  <Text style={styles.habitPointsText}>+{habito.puntos_base}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.selectedCount}>
        <Text style={styles.selectedCountText}>
          {config.habitosSeleccionados.length} hábito{config.habitosSeleccionados.length !== 1 ? "s" : ""} seleccionado{config.habitosSeleccionados.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </ScrollView>
  );

  // =====================
  // STEP 4: SUMMARY
  // =====================

  const renderStep4 = () => {
    const selectedHabits = misHabitos.filter(h => 
      config.habitosSeleccionados.includes(h.habito_usuario_id)
    );

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.stepIcon}>
          <Ionicons name="checkmark-circle" size={48} color={colors.semantic.success} />
        </View>
        <Text style={styles.stepTitle}>¡Listo para empezar!</Text>
        <Text style={styles.stepSubtitle}>Revisa la configuración de tu plan</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="flag" size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{plan.meta_principal}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calendar" size={20} color={colors.secondary[600]} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Fecha de Inicio</Text>
              <Text style={styles.summaryValue}>{formatDate(config.fechaInicio)}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="flag-outline" size={20} color={colors.accent.amber} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Fecha Objetivo</Text>
              <Text style={styles.summaryValue}>{formatDate(calcularFechaObjetivo())}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="time" size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Duración</Text>
              <Text style={styles.summaryValue}>{config.diasPersonalizados} días</Text>
            </View>
          </View>

          {selectedHabits.length > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="refresh" size={20} color={colors.secondary[600]} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Hábitos Vinculados</Text>
                  <View style={styles.linkedHabitsList}>
                    {selectedHabits.map(h => (
                      <Text key={h.habito_usuario_id} style={styles.linkedHabitItem}>
                        • {h.nombre}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  // =====================
  // RENDER CURRENT STEP
  // =====================

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Vista Previa";
      case 2: return "Fechas";
      case 3: return "Vincular Hábitos";
      case 4: return "Confirmar";
      default: return "";
    }
  };

  // =====================
  // MAIN RENDER
  // =====================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>{step}/4</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>

      {/* Content */}
      {renderStep()}

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {step < 4 ? (
          <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.9}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.neutral[0]} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleSubmit} 
            disabled={submitting}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={colors.gradients.secondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {submitting ? (
                <ActivityIndicator color={colors.neutral[0]} size="small" />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color={colors.neutral[0]} />
                  <Text style={styles.nextButtonText}>Iniciar Plan</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={colors.gradients.secondary}
                style={styles.modalIconGradient}
              >
                <Ionicons name="checkmark" size={40} color={colors.neutral[0]} />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>¡Plan Iniciado!</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/(tabs)/planes");
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>¡Vamos!</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.neutral[0]} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  stepIndicator: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  stepIndicatorText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.neutral[100],
    marginHorizontal: spacing[5],
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary[600],
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  
  // Step Icon & Title
  stepIcon: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  stepTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    textAlign: "center",
    marginBottom: spacing[2],
  },
  stepSubtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: "center",
    marginBottom: spacing[6],
  },

  // Plan Header (Step 1)
  planHeader: {
    marginBottom: spacing[4],
  },
  planTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    gap: 4,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.neutral[600],
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  phasesSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  phaseCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  phaseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  phaseNumberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  phaseDescription: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  tasksList: {
    marginTop: spacing[3],
    paddingLeft: spacing[3] + 32,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  taskText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },

  // Step 2: Dates
  dateSection: {
    marginBottom: spacing[6],
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  dateButtonText: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[900],
  },
  durationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
  durationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  durationValue: {
    alignItems: "center",
    minWidth: 100,
  },
  durationNumber: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  durationLabel: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  recommendedText: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    textAlign: "center",
    marginTop: spacing[3],
  },
  targetDateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  targetDateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  targetDateLabel: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  targetDateValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.secondary[700],
  },

  // Step 3: Habits
  emptyHabits: {
    alignItems: "center",
    paddingVertical: spacing[8],
  },
  emptyHabitsText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[400],
    marginTop: spacing[3],
  },
  emptyHabitsSubtext: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  habitsList: {
    gap: spacing[3],
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  habitCardSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  habitCheckboxSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[900],
  },
  habitCategory: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  habitPoints: {
    backgroundColor: colors.accent.amber + "20",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  habitPointsText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.accent.amber,
  },
  selectedCount: {
    alignItems: "center",
    marginTop: spacing[6],
  },
  selectedCountText: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },

  // Step 4: Summary
  summaryCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing[5],
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[4],
  },
  linkedHabitsList: {
    marginTop: spacing[1],
  },
  linkedHabitItem: {
    fontSize: typography.size.sm,
    color: colors.neutral[700],
    lineHeight: 22,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  nextButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  nextButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  modalContent: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius["2xl"],
    padding: spacing[8],
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    ...shadows.xl,
  },
  modalIconContainer: {
    marginBottom: spacing[5],
  },
  modalIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  modalMessage: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: "center",
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  modalButton: {
    width: "100%",
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  modalButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  modalButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
