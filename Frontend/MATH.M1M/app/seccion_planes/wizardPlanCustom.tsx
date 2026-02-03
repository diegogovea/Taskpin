import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// =====================
// INTERFACES
// =====================

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'diaria' | 'semanal' | 'única';
}

interface Fase {
  id: string;
  titulo: string;
  descripcion: string;
  duracion_dias: number;
  tareas: Tarea[];
}

interface PlanConfig {
  meta_principal: string;
  descripcion: string;
  plazo_dias: number;
  dificultad: 'fácil' | 'intermedio' | 'difícil';
  fases: Fase[];
}

// =====================
// HELPERS
// =====================

const generateId = () => Math.random().toString(36).substr(2, 9);

const DIFICULTADES = [
  { key: 'fácil', label: 'Easy', color: colors.secondary[500] },
  { key: 'intermedio', label: 'Medium', color: colors.accent.amber },
  { key: 'difícil', label: 'Hard', color: colors.semantic.error },
];

const DURACIONES_SUGERIDAS = [30, 60, 90, 120];

const TIPOS_TAREA = [
  { key: 'diaria', label: 'Daily', icon: 'today' },
  { key: 'semanal', label: 'Weekly', icon: 'calendar' },
  { key: 'única', label: 'One-time', icon: 'checkmark-done' },
];

// =====================
// MAIN COMPONENT
// =====================

export default function WizardPlanCustom() {
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PlanConfig>({
    meta_principal: '',
    descripcion: '',
    plazo_dias: 60,
    dificultad: 'intermedio',
    fases: [],
  });

  // Para edición de fase/tarea
  const [editingFaseId, setEditingFaseId] = useState<string | null>(null);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [tempFase, setTempFase] = useState<Partial<Fase>>({});
  const [tempTarea, setTempTarea] = useState<Partial<Tarea>>({});

  // Calcular días usados
  const diasUsados = config.fases.reduce((acc, f) => acc + f.duracion_dias, 0);
  const diasRestantes = config.plazo_dias - diasUsados;

  // =====================
  // HANDLERS
  // =====================

  const handleNext = () => {
    if (step === 1) {
      if (!config.meta_principal.trim() || config.meta_principal.length < 5) {
        Alert.alert('Required', 'Please enter a goal with at least 5 characters');
        return;
      }
    }
    if (step === 2) {
      if (config.fases.length === 0) {
        Alert.alert('Required', 'Add at least one phase to your plan');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(step - 1);
    }
  };

  // Fase handlers
  const addFase = () => {
    if (diasRestantes <= 0) {
      Alert.alert('No days left', 'All days are assigned. Increase plan duration or reduce phase durations.');
      return;
    }
    setTempFase({
      titulo: '',
      descripcion: '',
      duracion_dias: Math.min(14, diasRestantes),
    });
    setEditingFaseId('new');
  };

  const saveFase = () => {
    if (!tempFase.titulo || tempFase.titulo.trim().length < 3) {
      Alert.alert('Required', 'Phase title must have at least 3 characters');
      return;
    }
    if (!tempFase.duracion_dias || tempFase.duracion_dias < 1) {
      Alert.alert('Required', 'Duration must be at least 1 day');
      return;
    }

    if (editingFaseId === 'new') {
      const newFase: Fase = {
        id: generateId(),
        titulo: tempFase.titulo!.trim(),
        descripcion: tempFase.descripcion || '',
        duracion_dias: tempFase.duracion_dias!,
        tareas: [],
      };
      setConfig({ ...config, fases: [...config.fases, newFase] });
    } else {
      setConfig({
        ...config,
        fases: config.fases.map((f) =>
          f.id === editingFaseId
            ? { ...f, titulo: tempFase.titulo!.trim(), descripcion: tempFase.descripcion || '', duracion_dias: tempFase.duracion_dias! }
            : f
        ),
      });
    }
    setEditingFaseId(null);
    setTempFase({});
  };

  const deleteFase = (faseId: string) => {
    Alert.alert('Delete Phase', 'Are you sure? All tasks in this phase will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setConfig({ ...config, fases: config.fases.filter((f) => f.id !== faseId) }),
      },
    ]);
  };

  // Tarea handlers
  const addTarea = (faseId: string) => {
    setTempTarea({ titulo: '', descripcion: '', tipo: 'diaria' });
    setEditingTareaId('new');
    setEditingFaseId(faseId);
  };

  const saveTarea = () => {
    if (!tempTarea.titulo || tempTarea.titulo.trim().length < 3) {
      Alert.alert('Required', 'Task title must have at least 3 characters');
      return;
    }

    const newTarea: Tarea = {
      id: editingTareaId === 'new' ? generateId() : editingTareaId!,
      titulo: tempTarea.titulo!.trim(),
      descripcion: tempTarea.descripcion || '',
      tipo: tempTarea.tipo || 'diaria',
    };

    setConfig({
      ...config,
      fases: config.fases.map((f) => {
        if (f.id !== editingFaseId) return f;
        if (editingTareaId === 'new') {
          return { ...f, tareas: [...f.tareas, newTarea] };
        } else {
          return { ...f, tareas: f.tareas.map((t) => (t.id === editingTareaId ? newTarea : t)) };
        }
      }),
    });

    setEditingTareaId(null);
    setTempTarea({});
    setEditingFaseId(null);
  };

  const deleteTarea = (faseId: string, tareaId: string) => {
    setConfig({
      ...config,
      fases: config.fases.map((f) =>
        f.id === faseId ? { ...f, tareas: f.tareas.filter((t) => t.id !== tareaId) } : f
      ),
    });
  };

  // Submit
  const handleSubmit = async () => {
    if (!user?.user_id) {
      Alert.alert('Error', 'Session expired. Please login again.');
      return;
    }

    // Validación final
    const fasesConTareas = config.fases.filter((f) => f.tareas.length > 0);
    if (fasesConTareas.length === 0) {
      Alert.alert('Required', 'Add at least one task to your plan');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.user_id,
        meta_principal: config.meta_principal,
        descripcion: config.descripcion || null,
        plazo_dias_estimado: config.plazo_dias,
        dificultad: config.dificultad,
        fases: config.fases.map((f, i) => ({
          titulo: f.titulo,
          descripcion: f.descripcion || null,
          duracion_dias: f.duracion_dias,
          orden_fase: i + 1,
          tareas: f.tareas.map((t, j) => ({
            titulo: t.titulo,
            descripcion: t.descripcion || null,
            tipo: t.tipo,
            orden: j + 1,
          })),
        })),
      };

      const response = await authFetch('/api/planes/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.plan_usuario_id) {
        // Redirigir automáticamente al plan creado
        router.replace(`/seccion_planes/seguimientoPlan?planUsuarioId=${data.plan_usuario_id}` as any);
      } else {
        Alert.alert('Error', data.detail || data.message || 'Could not create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      Alert.alert('Error', 'Could not create plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // =====================
  // RENDER HELPERS
  // =====================

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            {step > s ? (
              <Ionicons name="checkmark" size={14} color={colors.neutral[0]} />
            ) : (
              <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
            )}
          </View>
          {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  // =====================
  // STEP 1: Basic Info
  // =====================

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>What's your goal?</Text>
      <Text style={styles.stepSubtitle}>Give your plan a clear objective</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Main Goal *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Learn to play guitar"
          placeholderTextColor={colors.neutral[400]}
          value={config.meta_principal}
          onChangeText={(t) => setConfig({ ...config, meta_principal: t })}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe what you want to achieve..."
          placeholderTextColor={colors.neutral[400]}
          value={config.descripcion}
          onChangeText={(t) => setConfig({ ...config, descripcion: t })}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duration (days)</Text>
        <View style={styles.chipRow}>
          {DURACIONES_SUGERIDAS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, config.plazo_dias === d && styles.chipActive]}
              onPress={() => setConfig({ ...config, plazo_dias: d })}
            >
              <Text style={[styles.chipText, config.plazo_dias === d && styles.chipTextActive]}>
                {d} days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customDurationRow}>
          <Text style={styles.customLabel}>Custom:</Text>
          <TextInput
            style={styles.smallInput}
            keyboardType="number-pad"
            value={config.plazo_dias.toString()}
            onChangeText={(t) => {
              const num = parseInt(t) || 7;
              setConfig({ ...config, plazo_dias: Math.min(365, Math.max(7, num)) });
            }}
          />
          <Text style={styles.customLabel}>days</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFICULTADES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.chip,
                config.dificultad === d.key && { backgroundColor: d.color + '20', borderColor: d.color },
              ]}
              onPress={() => setConfig({ ...config, dificultad: d.key as any })}
            >
              <Text style={[styles.chipText, config.dificultad === d.key && { color: d.color }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // =====================
  // STEP 2: Phases
  // =====================

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Break it into phases</Text>
      <Text style={styles.stepSubtitle}>
        Divide your {config.plazo_dias}-day plan into manageable phases
      </Text>

      {/* Days progress */}
      <View style={styles.daysProgress}>
        <View style={styles.daysProgressBar}>
          <View
            style={[
              styles.daysProgressFill,
              { width: `${Math.min(100, (diasUsados / config.plazo_dias) * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.daysProgressText}>
          {diasUsados} of {config.plazo_dias} days assigned ({diasRestantes} remaining)
        </Text>
      </View>

      {/* Phases list */}
      {config.fases.map((fase, index) => (
        <View key={fase.id} style={styles.faseCard}>
          <View style={styles.faseHeader}>
            <View style={styles.faseBadge}>
              <Text style={styles.faseBadgeText}>Phase {index + 1}</Text>
            </View>
            <View style={styles.faseActions}>
              <TouchableOpacity
                onPress={() => {
                  setTempFase({ titulo: fase.titulo, descripcion: fase.descripcion, duracion_dias: fase.duracion_dias });
                  setEditingFaseId(fase.id);
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteFase(fase.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.faseTitulo}>{fase.titulo}</Text>
          <Text style={styles.faseDuracion}>{fase.duracion_dias} days</Text>
          {fase.descripcion && <Text style={styles.faseDesc}>{fase.descripcion}</Text>}
        </View>
      ))}

      {/* Add phase button */}
      <TouchableOpacity style={styles.addButton} onPress={addFase} disabled={diasRestantes <= 0}>
        <Ionicons name="add" size={20} color={diasRestantes > 0 ? colors.primary[600] : colors.neutral[400]} />
        <Text style={[styles.addButtonText, diasRestantes <= 0 && { color: colors.neutral[400] }]}>
          Add Phase
        </Text>
      </TouchableOpacity>

      </ScrollView>
  );

  // =====================
  // FASE MODAL (separate)
  // =====================
  const renderFaseModal = () => (
    <Modal
      visible={editingFaseId !== null && editingTareaId === null}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setEditingFaseId(null);
        setTempFase({});
      }}
    >
      <View style={styles.editModal}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>
            {editingFaseId === 'new' ? 'New Phase' : 'Edit Phase'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Phase title"
            placeholderTextColor={colors.neutral[400]}
            value={tempFase.titulo || ''}
            onChangeText={(t) => setTempFase({ ...tempFase, titulo: t })}
          />
          <TextInput
            style={[styles.textInput, styles.textArea, { marginTop: spacing[3] }]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.neutral[400]}
            value={tempFase.descripcion || ''}
            onChangeText={(t) => setTempFase({ ...tempFase, descripcion: t })}
            multiline
          />
          <View style={styles.durationRow}>
            <Text style={styles.inputLabel}>Duration:</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="number-pad"
              value={(tempFase.duracion_dias || '').toString()}
              onChangeText={(t) => setTempFase({ ...tempFase, duracion_dias: parseInt(t) || 1 })}
            />
            <Text style={styles.inputLabel}>days</Text>
          </View>
          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditingFaseId(null);
                setTempFase({});
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveFase}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // =====================
  // TAREA MODAL (separate)
  // =====================
  const renderTareaModal = () => (
    <Modal
      visible={editingTareaId !== null}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setEditingTareaId(null);
        setTempTarea({});
        setEditingFaseId(null);
      }}
    >
      <View style={styles.editModal}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>
            {editingTareaId === 'new' ? 'New Task' : 'Edit Task'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Task title"
            placeholderTextColor={colors.neutral[400]}
            value={tempTarea.titulo || ''}
            onChangeText={(t) => setTempTarea({ ...tempTarea, titulo: t })}
          />
          <TextInput
            style={[styles.textInput, styles.textArea, { marginTop: spacing[3] }]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.neutral[400]}
            value={tempTarea.descripcion || ''}
            onChangeText={(t) => setTempTarea({ ...tempTarea, descripcion: t })}
            multiline
          />
          <Text style={[styles.inputLabel, { marginTop: spacing[3] }]}>Task Type</Text>
          <View style={styles.chipRow}>
            {TIPOS_TAREA.map((tipo) => (
              <TouchableOpacity
                key={tipo.key}
                style={[styles.chip, tempTarea.tipo === tipo.key && styles.chipActive]}
                onPress={() => setTempTarea({ ...tempTarea, tipo: tipo.key as any })}
              >
                <Ionicons
                  name={tipo.icon as any}
                  size={14}
                  color={tempTarea.tipo === tipo.key ? colors.primary[600] : colors.neutral[500]}
                />
                <Text style={[styles.chipText, tempTarea.tipo === tipo.key && styles.chipTextActive]}>
                  {tipo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditingTareaId(null);
                setTempTarea({});
                setEditingFaseId(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveTarea}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // =====================
  // STEP 3: Tasks
  // =====================

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Add tasks to each phase</Text>
      <Text style={styles.stepSubtitle}>Define what you'll do in each phase</Text>

      {config.fases.map((fase, faseIndex) => (
        <View key={fase.id} style={styles.faseTasksCard}>
          <View style={styles.faseTasksHeader}>
            <Text style={styles.faseTasksTitle}>Phase {faseIndex + 1}: {fase.titulo}</Text>
            <Text style={styles.faseTasksDuration}>{fase.duracion_dias} days</Text>
          </View>

          {/* Tasks list */}
          {fase.tareas.map((tarea) => (
            <View key={tarea.id} style={styles.tareaItem}>
              <View style={styles.tareaInfo}>
                <View style={[styles.tareaTipoBadge, { backgroundColor: getTipoColor(tarea.tipo) + '20' }]}>
                  <Text style={[styles.tareaTipoText, { color: getTipoColor(tarea.tipo) }]}>
                    {tarea.tipo}
                  </Text>
                </View>
                <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteTarea(fase.id, tarea.id)}>
                <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add task button */}
          <TouchableOpacity style={styles.addTaskBtn} onPress={() => addTarea(fase.id)}>
            <Ionicons name="add" size={18} color={colors.primary[600]} />
            <Text style={styles.addTaskBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      ))}


      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Plan Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Goal:</Text>
          <Text style={styles.summaryValue}>{config.meta_principal}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{config.plazo_dias} days</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phases:</Text>
          <Text style={styles.summaryValue}>{config.fases.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total tasks:</Text>
          <Text style={styles.summaryValue}>
            {config.fases.reduce((acc, f) => acc + f.tareas.length, 0)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'diaria':
        return colors.primary[500];
      case 'semanal':
        return colors.accent.amber;
      case 'única':
        return colors.secondary[500];
      default:
        return colors.neutral[500];
    }
  };

  // =====================
  // RENDER
  // =====================

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Custom Plan</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Footer */}
        <View style={styles.footer}>
          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.neutral[0]} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.createButton]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.neutral[0]} />
                  <Text style={styles.nextButtonText}>Create Plan</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderFaseModal()}
      {renderTareaModal()}
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    backgroundColor: colors.neutral[0],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary[600],
  },
  stepNumber: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[500],
  },
  stepNumberActive: {
    color: colors.neutral[0],
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing[2],
  },
  stepLineActive: {
    backgroundColor: colors.primary[600],
  },
  stepContent: {
    flex: 1,
    padding: spacing[5],
  },
  stepTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  stepSubtitle: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    marginBottom: spacing[6],
  },
  inputGroup: {
    marginBottom: spacing[5],
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  textInput: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.primary[600],
  },
  customDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  customLabel: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
  },
  smallInput: {
    width: 60,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: spacing[2],
    fontSize: typography.size.base,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    textAlign: 'center',
  },
  daysProgress: {
    marginBottom: spacing[5],
  },
  daysProgressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  daysProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  daysProgressText: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  faseCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  faseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  faseBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  faseBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  faseActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  faseTitulo: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  faseDuracion: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  faseDesc: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    marginTop: spacing[2],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  editModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing[5],
  },
  editModalContent: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
  },
  editModalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[5],
  },
  cancelBtn: {
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[600],
  },
  saveBtn: {
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  faseTasksCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  faseTasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  faseTasksTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  faseTasksDuration: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  tareaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  tareaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  tareaTipoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tareaTipoText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  tareaTitulo: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[700],
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  addTaskBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  summaryCard: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginTop: spacing[4],
  },
  summaryTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[700],
    marginBottom: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    color: colors.primary[600],
  },
  summaryValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary[700],
  },
  footer: {
    padding: spacing[5],
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
  },
  createButton: {
    backgroundColor: colors.secondary[500],
  },
  nextButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
