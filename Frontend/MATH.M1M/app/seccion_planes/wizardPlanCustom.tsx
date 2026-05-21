import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  prioridad: 'alta' | 'media' | 'baja';
  notas: string;
  fecha_limite: string | null;
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
  { key: 'fácil', label: 'Fácil', color: colors.secondary[500] },
  { key: 'intermedio', label: 'Medio', color: colors.accent.amber },
  { key: 'difícil', label: 'Difícil', color: colors.semantic.error },
];

const DURACIONES_SUGERIDAS = [14, 30, 60, 90, 120];

const TIPOS_TAREA = [
  { key: 'diaria', label: 'Diaria', icon: 'today' },
  { key: 'semanal', label: 'Semanal', icon: 'calendar' },
  { key: 'única', label: 'Única', icon: 'checkmark-done' },
];

const PRIORIDADES = [
  { key: 'alta', label: 'Alta', color: colors.semantic.error },
  { key: 'media', label: 'Media', color: colors.accent.amber },
  { key: 'baja', label: 'Baja', color: colors.secondary[500] },
];

const getTipoColor = (tipo: string) => {
  if (tipo === 'diaria') return colors.primary[500];
  if (tipo === 'semanal') return colors.accent.amber;
  return colors.secondary[500];
};

const getPrioridadColor = (p: string) => {
  if (p === 'alta') return colors.semantic.error;
  if (p === 'media') return colors.accent.amber;
  return colors.secondary[500];
};

const formatDate = (d: Date) =>
  d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

// =====================
// MAIN COMPONENT
// =====================

export default function WizardPlanCustom() {
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState('');

  const [config, setConfig] = useState<PlanConfig>({
    meta_principal: '',
    descripcion: '',
    plazo_dias: 30,
    dificultad: 'intermedio',
    fases: [],
  });

  // Estado separado para el input de duración del plan (permite vacío mientras escribe)
  const [plazoDiasInput, setPlazoDiasInput] = useState('30');

  // Fase editing
  const [editingFaseId, setEditingFaseId] = useState<string | null>(null);
  const [tempFase, setTempFase] = useState<{ titulo: string; descripcion: string; duracion_dias: string }>({
    titulo: '', descripcion: '', duracion_dias: '',
  });
  const [faseError, setFaseError] = useState('');

  // Tarea editing
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [editingFaseId2, setEditingFaseId2] = useState<string | null>(null);
  const [tempTarea, setTempTarea] = useState<Partial<Tarea>>({
    titulo: '', descripcion: '', tipo: 'diaria', prioridad: 'media', notas: '', fecha_limite: null,
  });
  const [tareaError, setTareaError] = useState('');
  const [showTareaDatePicker, setShowTareaDatePicker] = useState(false);

  const diasUsados = config.fases.reduce((acc, f) => acc + f.duracion_dias, 0);
  const diasRestantes = config.plazo_dias - diasUsados;

  // =====================
  // HANDLERS
  // =====================

  const handleNext = () => {
    setStepError('');
    if (step === 1) {
      if (!config.meta_principal.trim() || config.meta_principal.length < 5) {
        setStepError('Ingresa una meta con al menos 5 caracteres');
        return;
      }
      if (config.plazo_dias < 1) {
        setStepError('La duración del plan debe ser de al menos 1 día');
        return;
      }
    }
    if (step === 2) {
      if (config.fases.length === 0) {
        setStepError('Agrega al menos una fase a tu plan');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStepError('');
    if (step === 1) router.back();
    else setStep(step - 1);
  };

  // Duración del plan
  const commitPlazo = (text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ''));
    if (!isNaN(num) && num > 0) {
      setConfig({ ...config, plazo_dias: num });
      setPlazoDiasInput(String(num));
    } else {
      setPlazoDiasInput(String(config.plazo_dias));
    }
  };

  // ── FASES ──
  const openNewFase = () => {
    setFaseError('');
    setTempFase({ titulo: '', descripcion: '', duracion_dias: String(Math.min(14, Math.max(1, diasRestantes))) });
    setEditingFaseId('new');
  };

  const openEditFase = (fase: Fase) => {
    setFaseError('');
    setTempFase({ titulo: fase.titulo, descripcion: fase.descripcion, duracion_dias: String(fase.duracion_dias) });
    setEditingFaseId(fase.id);
  };

  const saveFase = () => {
    setFaseError('');
    if (!tempFase.titulo.trim() || tempFase.titulo.trim().length < 3) {
      setFaseError('El título debe tener al menos 3 caracteres');
      return;
    }
    const dias = parseInt(tempFase.duracion_dias);
    if (isNaN(dias) || dias < 1) {
      setFaseError('La duración debe ser de al menos 1 día');
      return;
    }
    if (editingFaseId === 'new') {
      setConfig(prev => ({
        ...prev,
        fases: [...prev.fases, {
          id: generateId(),
          titulo: tempFase.titulo.trim(),
          descripcion: tempFase.descripcion,
          duracion_dias: dias,
          tareas: [],
        }],
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        fases: prev.fases.map(f =>
          f.id === editingFaseId
            ? { ...f, titulo: tempFase.titulo.trim(), descripcion: tempFase.descripcion, duracion_dias: dias }
            : f
        ),
      }));
    }
    setEditingFaseId(null);
  };

  const deleteFase = (faseId: string) => {
    setConfig(prev => ({ ...prev, fases: prev.fases.filter(f => f.id !== faseId) }));
  };

  // ── TAREAS ──
  const openNewTarea = (faseId: string) => {
    setTareaError('');
    setTempTarea({ titulo: '', descripcion: '', tipo: 'diaria', prioridad: 'media', notas: '', fecha_limite: null });
    setEditingTareaId('new');
    setEditingFaseId2(faseId);
  };

  const openEditTarea = (faseId: string, tarea: Tarea) => {
    setTareaError('');
    setTempTarea({ ...tarea });
    setEditingTareaId(tarea.id);
    setEditingFaseId2(faseId);
  };

  const saveTarea = () => {
    setTareaError('');
    if (!tempTarea.titulo || tempTarea.titulo.trim().length < 3) {
      setTareaError('El título debe tener al menos 3 caracteres');
      return;
    }
    const newTarea: Tarea = {
      id: editingTareaId === 'new' ? generateId() : editingTareaId!,
      titulo: tempTarea.titulo!.trim(),
      descripcion: tempTarea.descripcion || '',
      tipo: tempTarea.tipo || 'diaria',
      prioridad: tempTarea.prioridad || 'media',
      notas: tempTarea.notas || '',
      fecha_limite: tempTarea.fecha_limite || null,
    };
    setConfig(prev => ({
      ...prev,
      fases: prev.fases.map(f => {
        if (f.id !== editingFaseId2) return f;
        if (editingTareaId === 'new') return { ...f, tareas: [...f.tareas, newTarea] };
        return { ...f, tareas: f.tareas.map(t => (t.id === editingTareaId ? newTarea : t)) };
      }),
    }));
    setEditingTareaId(null);
    setEditingFaseId2(null);
  };

  const deleteTarea = (faseId: string, tareaId: string) => {
    setConfig(prev => ({
      ...prev,
      fases: prev.fases.map(f =>
        f.id === faseId ? { ...f, tareas: f.tareas.filter(t => t.id !== tareaId) } : f
      ),
    }));
  };

  // Submit
  const handleSubmit = async () => {
    setStepError('');
    if (!user?.user_id) {
      setStepError('Sesión expirada. Por favor inicia sesión nuevamente.');
      return;
    }
    if (config.fases.reduce((a, f) => a + f.tareas.length, 0) === 0) {
      setStepError('Agrega al menos una tarea a tu plan');
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
            prioridad: t.prioridad,
            notas: t.notas || null,
            fecha_limite: t.fecha_limite || null,
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
        router.replace(`/seccion_planes/seguimientoPlan?planUsuarioId=${data.plan_usuario_id}` as any);
      } else {
        setStepError(data.detail || data.message || 'No se pudo crear el plan');
      }
    } catch {
      setStepError('Sin conexión. Por favor intenta de nuevo.');
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
            {step > s
              ? <Ionicons name="checkmark" size={14} color={colors.neutral[0]} />
              : <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
            }
          </View>
          {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  // ── STEP 1 ──
  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>¿Cuál es tu meta?</Text>
      <Text style={styles.stepSubtitle}>Dale a tu plan un objetivo claro</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Meta Principal *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ej: Aprender a tocar guitarra"
          placeholderTextColor={colors.neutral[400]}
          value={config.meta_principal}
          onChangeText={(t) => { setConfig({ ...config, meta_principal: t }); setStepError(''); }}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe lo que quieres lograr..."
          placeholderTextColor={colors.neutral[400]}
          value={config.descripcion}
          onChangeText={(t) => setConfig({ ...config, descripcion: t })}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duración total</Text>
        {/* Chips de sugerencia */}
        <View style={styles.chipRow}>
          {DURACIONES_SUGERIDAS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, config.plazo_dias === d && styles.chipActive]}
              onPress={() => { setConfig({ ...config, plazo_dias: d }); setPlazoDiasInput(String(d)); }}
            >
              <Text style={[styles.chipText, config.plazo_dias === d && styles.chipTextActive]}>
                {d} días
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Input libre */}
        <View style={styles.customDurationRow}>
          <Text style={styles.customLabel}>Personalizar:</Text>
          <TextInput
            style={styles.smallInput}
            keyboardType="number-pad"
            value={plazoDiasInput}
            onChangeText={(t) => { setPlazoDiasInput(t.replace(/[^0-9]/g, '')); setStepError(''); }}
            onBlur={() => commitPlazo(plazoDiasInput)}
            selectTextOnFocus
          />
          <Text style={styles.customLabel}>días</Text>
        </View>
        <Text style={styles.durationHint}>
          Duración actual: <Text style={{ fontWeight: '700', color: colors.primary[600] }}>{config.plazo_dias} días</Text>
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Dificultad</Text>
        <View style={styles.chipRow}>
          {DIFICULTADES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.chip, config.dificultad === d.key && { backgroundColor: d.color + '20', borderColor: d.color }]}
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

  // ── STEP 2 ──
  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Divídelo en fases</Text>
      <Text style={styles.stepSubtitle}>
        Plan de {config.plazo_dias} días — divide el tiempo en etapas
      </Text>

      <View style={styles.daysProgress}>
        <View style={styles.daysProgressBar}>
          <View style={[styles.daysProgressFill, { width: `${Math.min(100, (diasUsados / config.plazo_dias) * 100)}%` }]} />
        </View>
        <Text style={styles.daysProgressText}>
          {diasUsados} de {config.plazo_dias} días asignados ({diasRestantes >= 0 ? diasRestantes : 0} restantes)
        </Text>
      </View>

      {config.fases.map((fase, index) => (
        <View key={fase.id} style={styles.faseCard}>
          <View style={styles.faseHeader}>
            <View style={styles.faseBadge}>
              <Text style={styles.faseBadgeText}>Fase {index + 1}</Text>
            </View>
            <View style={styles.faseActions}>
              <TouchableOpacity onPress={() => openEditFase(fase)}>
                <Ionicons name="create-outline" size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteFase(fase.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.faseTitulo}>{fase.titulo}</Text>
          <Text style={styles.faseDuracion}>{fase.duracion_dias} días</Text>
          {fase.descripcion ? <Text style={styles.faseDesc}>{fase.descripcion}</Text> : null}
        </View>
      ))}

      <TouchableOpacity style={[styles.addButton, diasRestantes <= 0 && { opacity: 0.4 }]} onPress={openNewFase} disabled={diasRestantes <= 0}>
        <Ionicons name="add" size={22} color={colors.primary[600]} />
        <Text style={styles.addButtonText}>
          {diasRestantes <= 0 ? 'Sin días disponibles' : 'Agregar Fase'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── STEP 3 ──
  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Agrega tareas a cada fase</Text>
      <Text style={styles.stepSubtitle}>Define lo que harás en cada etapa</Text>

      {config.fases.map((fase, faseIndex) => (
        <View key={fase.id} style={styles.faseTasksCard}>
          <View style={styles.faseTasksHeader}>
            <Text style={styles.faseTasksTitle}>Fase {faseIndex + 1}: {fase.titulo}</Text>
            <Text style={styles.faseTasksDuration}>{fase.duracion_dias} días</Text>
          </View>

          {fase.tareas.map((tarea) => (
            <TouchableOpacity key={tarea.id} style={styles.tareaItem} onPress={() => openEditTarea(fase.id, tarea)} activeOpacity={0.7}>
              <View style={styles.tareaInfo}>
                <View style={[styles.tareaTipoBadge, { backgroundColor: getTipoColor(tarea.tipo) + '20' }]}>
                  <Text style={[styles.tareaTipoText, { color: getTipoColor(tarea.tipo) }]}>{tarea.tipo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
                  {tarea.fecha_limite && (
                    <Text style={styles.tareaFecha}>
                      <Ionicons name="calendar-outline" size={11} /> {tarea.fecha_limite}
                    </Text>
                  )}
                </View>
                <View style={[styles.prioridadDot, { backgroundColor: getPrioridadColor(tarea.prioridad) }]} />
              </View>
              <TouchableOpacity onPress={() => deleteTarea(fase.id, tarea.id)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color={colors.neutral[300]} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.addTaskBtn} onPress={() => openNewTarea(fase.id)}>
            <Ionicons name="add" size={18} color={colors.primary[600]} />
            <Text style={styles.addTaskBtnText}>Agregar Tarea</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen del Plan</Text>
        {[
          ['Meta', config.meta_principal],
          ['Duración', `${config.plazo_dias} días`],
          ['Fases', String(config.fases.length)],
          ['Total de tareas', String(config.fases.reduce((a, f) => a + f.tareas.length, 0))],
        ].map(([label, value]) => (
          <View key={label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}:</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // ── FASE MODAL ──
  const renderFaseModal = () => (
    <Modal
      visible={editingFaseId !== null}
      transparent
      animationType="fade"
      onRequestClose={() => { setEditingFaseId(null); setFaseError(''); }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editModal}>
        <ScrollView contentContainerStyle={styles.editModalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.editModalTitle}>
            {editingFaseId === 'new' ? 'Nueva Fase' : 'Editar Fase'}
          </Text>

          <Text style={styles.inputLabel}>Título *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Fundamentos"
            placeholderTextColor={colors.neutral[400]}
            value={tempFase.titulo}
            onChangeText={(t) => { setTempFase({ ...tempFase, titulo: t }); setFaseError(''); }}
          />

          <Text style={[styles.inputLabel, { marginTop: spacing[3] }]}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { marginBottom: spacing[3] }]}
            placeholder="¿Qué harás en esta fase?"
            placeholderTextColor={colors.neutral[400]}
            value={tempFase.descripcion}
            onChangeText={(t) => setTempFase({ ...tempFase, descripcion: t })}
            multiline
          />

          <View style={styles.durationRow}>
            <Text style={styles.inputLabel}>Duración:</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="number-pad"
              value={tempFase.duracion_dias}
              onChangeText={(t) => { setTempFase({ ...tempFase, duracion_dias: t.replace(/[^0-9]/g, '') }); setFaseError(''); }}
              selectTextOnFocus
            />
            <Text style={styles.inputLabel}>días</Text>
          </View>
          <Text style={styles.durationHint}>
            Días disponibles: {diasRestantes + (editingFaseId !== 'new' ? (config.fases.find(f => f.id === editingFaseId)?.duracion_dias || 0) : 0)}
          </Text>

          {faseError !== '' && <InlineError msg={faseError} />}

          <View style={styles.editModalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingFaseId(null); setFaseError(''); }}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveFase}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ── TAREA MODAL ──
  const renderTareaModal = () => (
    <Modal
      visible={editingTareaId !== null}
      transparent
      animationType="slide"
      onRequestClose={() => { setEditingTareaId(null); setEditingFaseId2(null); setTareaError(''); }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editModal}>
        <ScrollView contentContainerStyle={[styles.editModalContent, { maxHeight: '90%' }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.editModalTitle}>
            {editingTareaId === 'new' ? 'Nueva Tarea' : 'Editar Tarea'}
          </Text>

          {/* Título */}
          <Text style={styles.inputLabel}>Título *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="¿Qué vas a hacer?"
            placeholderTextColor={colors.neutral[400]}
            value={tempTarea.titulo || ''}
            onChangeText={(t) => { setTempTarea({ ...tempTarea, titulo: t }); setTareaError(''); }}
          />

          {/* Descripción */}
          <Text style={[styles.inputLabel, { marginTop: spacing[3] }]}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { marginBottom: 0 }]}
            placeholder="Más detalles de la tarea..."
            placeholderTextColor={colors.neutral[400]}
            value={tempTarea.descripcion || ''}
            onChangeText={(t) => setTempTarea({ ...tempTarea, descripcion: t })}
            multiline
          />

          {/* Tipo */}
          <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Tipo</Text>
          <View style={styles.chipRow}>
            {TIPOS_TAREA.map((tipo) => (
              <TouchableOpacity
                key={tipo.key}
                style={[styles.chip, tempTarea.tipo === tipo.key && styles.chipActive]}
                onPress={() => setTempTarea({ ...tempTarea, tipo: tipo.key as any })}
              >
                <Ionicons name={tipo.icon as any} size={14} color={tempTarea.tipo === tipo.key ? colors.primary[600] : colors.neutral[500]} />
                <Text style={[styles.chipText, tempTarea.tipo === tipo.key && styles.chipTextActive]}>{tipo.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Prioridad */}
          <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Prioridad</Text>
          <View style={styles.chipRow}>
            {PRIORIDADES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.chip, tempTarea.prioridad === p.key && { backgroundColor: p.color + '20', borderColor: p.color }]}
                onPress={() => setTempTarea({ ...tempTarea, prioridad: p.key as any })}
              >
                <View style={[styles.prioridadDot, { backgroundColor: p.color }]} />
                <Text style={[styles.chipText, tempTarea.prioridad === p.key && { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fecha límite */}
          <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Fecha límite (opcional)</Text>
          <TouchableOpacity
            style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowTareaDatePicker(true)}
          >
            <Text style={{ color: tempTarea.fecha_limite ? colors.neutral[800] : colors.neutral[400], fontSize: typography.size.base }}>
              {tempTarea.fecha_limite || 'Seleccionar fecha'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.neutral[400]} />
          </TouchableOpacity>
          {tempTarea.fecha_limite && (
            <TouchableOpacity onPress={() => setTempTarea({ ...tempTarea, fecha_limite: null })} style={styles.clearDateBtn}>
              <Ionicons name="close-circle" size={14} color={colors.neutral[400]} />
              <Text style={styles.clearDateText}>Quitar fecha</Text>
            </TouchableOpacity>
          )}

          {/* DatePicker */}
          {showTareaDatePicker && (
            <DateTimePicker
              value={tempTarea.fecha_limite ? new Date(tempTarea.fecha_limite) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_: DateTimePickerEvent, date?: Date) => {
                setShowTareaDatePicker(Platform.OS === 'ios');
                if (date) setTempTarea({ ...tempTarea, fecha_limite: formatDate(date) });
              }}
            />
          )}

          {/* Notas */}
          <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Notas (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Recordatorios, recursos, links..."
            placeholderTextColor={colors.neutral[400]}
            value={tempTarea.notas || ''}
            onChangeText={(t) => setTempTarea({ ...tempTarea, notas: t })}
            multiline
          />

          {tareaError !== '' && <InlineError msg={tareaError} />}

          <View style={styles.editModalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingTareaId(null); setEditingFaseId2(null); setTareaError(''); }}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveTarea}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  // =====================
  // RENDER
  // =====================
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Plan Personalizado</Text>
          <View style={{ width: 40 }} />
        </View>

        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Inline step error */}
        {stepError !== '' && (
          <View style={styles.stepErrorBanner}>
            <Ionicons name="alert-circle" size={16} color="#B91C1C" />
            <Text style={styles.stepErrorText}>{stepError}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.neutral[0]} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextButton, styles.createButton]} onPress={handleSubmit} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.neutral[0]} />
                : <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.neutral[0]} />
                    <Text style={styles.nextButtonText}>Crear Plan</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {renderFaseModal()}
      {renderTareaModal()}
    </SafeAreaView>
  );
}

// ── Inline error component ──
function InlineError({ msg }: { msg: string }) {
  return (
    <View style={styles.inlineError}>
      <Ionicons name="alert-circle" size={14} color="#EF4444" />
      <Text style={styles.inlineErrorText}>{msg}</Text>
    </View>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0], borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 40, height: 40, borderRadius: radius.lg,
    backgroundColor: colors.neutral[100], justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.neutral[900] },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[4], backgroundColor: colors.neutral[0] },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.neutral[200], justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: colors.primary[600] },
  stepNumber: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.neutral[500] },
  stepNumberActive: { color: colors.neutral[0] },
  stepLine: { width: 40, height: 2, backgroundColor: colors.neutral[200], marginHorizontal: spacing[2] },
  stepLineActive: { backgroundColor: colors.primary[600] },
  stepContent: { flex: 1, padding: spacing[5] },
  stepTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.neutral[900], marginBottom: spacing[1] },
  stepSubtitle: { fontSize: typography.size.base, color: colors.neutral[500], marginBottom: spacing[6] },
  inputGroup: { marginBottom: spacing[5] },
  inputLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.neutral[700], marginBottom: spacing[2] },
  textInput: {
    backgroundColor: colors.neutral[0], borderRadius: radius.lg, padding: spacing[4],
    fontSize: typography.size.base, color: colors.neutral[800], borderWidth: 1, borderColor: colors.neutral[200],
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.lg, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  chipActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[500] },
  chipText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.neutral[600] },
  chipTextActive: { color: colors.primary[600] },
  customDurationRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[3], gap: spacing[2] },
  customLabel: { fontSize: typography.size.sm, color: colors.neutral[600] },
  smallInput: { width: 70, backgroundColor: colors.neutral[0], borderRadius: radius.md, padding: spacing[3], fontSize: typography.size.base, color: colors.neutral[800], borderWidth: 1, borderColor: colors.neutral[200], textAlign: 'center' },
  durationHint: { fontSize: typography.size.xs, color: colors.neutral[400], marginTop: spacing[2] },
  daysProgress: { marginBottom: spacing[5] },
  daysProgressBar: { height: 8, backgroundColor: colors.neutral[200], borderRadius: 4, overflow: 'hidden', marginBottom: spacing[2] },
  daysProgressFill: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 4 },
  daysProgressText: { fontSize: typography.size.sm, color: colors.neutral[500], textAlign: 'center' },
  faseCard: { backgroundColor: colors.neutral[0], borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[3], ...shadows.sm },
  faseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  faseBadge: { backgroundColor: colors.primary[100], paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius.md },
  faseBadgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.primary[600] },
  faseActions: { flexDirection: 'row', gap: spacing[3] },
  faseTitulo: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[800] },
  faseDuracion: { fontSize: typography.size.sm, color: colors.neutral[500], marginTop: spacing[1] },
  faseDesc: { fontSize: typography.size.sm, color: colors.neutral[600], marginTop: spacing[2] },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[4], borderRadius: radius.xl, borderWidth: 2, borderColor: colors.neutral[200], borderStyle: 'dashed' },
  addButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.primary[600] },
  faseTasksCard: { backgroundColor: colors.neutral[0], borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[4], ...shadows.sm },
  faseTasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3], paddingBottom: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  faseTasksTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[800] },
  faseTasksDuration: { fontSize: typography.size.sm, color: colors.neutral[500] },
  tareaItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  tareaInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  tareaTipoBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.sm },
  tareaTipoText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  tareaTitulo: { fontSize: typography.size.sm, color: colors.neutral[700], fontWeight: typography.weight.medium },
  tareaFecha: { fontSize: 10, color: colors.neutral[400], marginTop: 2 },
  prioridadDot: { width: 8, height: 8, borderRadius: 4 },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[1], paddingVertical: spacing[3], marginTop: spacing[2] },
  addTaskBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.primary[600] },
  summaryCard: { backgroundColor: colors.primary[50], borderRadius: radius.xl, padding: spacing[4], marginTop: spacing[4] },
  summaryTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.primary[700], marginBottom: spacing[3] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[2] },
  summaryLabel: { fontSize: typography.size.sm, color: colors.primary[600] },
  summaryValue: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.primary[700] },
  editModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing[5] },
  editModalContent: { backgroundColor: colors.neutral[0], borderRadius: radius.xl, padding: spacing[5] },
  editModalTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.neutral[900], marginBottom: spacing[4] },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[3] },
  editModalButtons: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[5] },
  cancelBtn: { flex: 1, padding: spacing[4], borderRadius: radius.lg, backgroundColor: colors.neutral[100], alignItems: 'center' },
  cancelBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.neutral[600] },
  saveBtn: { flex: 1, padding: spacing[4], borderRadius: radius.lg, backgroundColor: colors.primary[600], alignItems: 'center' },
  saveBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[0] },
  clearDateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[2] },
  clearDateText: { fontSize: typography.size.xs, color: colors.neutral[400] },
  stepErrorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginHorizontal: spacing[5], marginBottom: spacing[2], backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: spacing[3], borderWidth: 1, borderColor: '#FECACA' },
  stepErrorText: { flex: 1, fontSize: typography.size.sm, color: '#B91C1C' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[2] },
  inlineErrorText: { flex: 1, fontSize: typography.size.sm, color: '#EF4444' },
  footer: { padding: spacing[5], backgroundColor: colors.neutral[0], borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.primary[600], paddingVertical: spacing[4], borderRadius: radius.xl },
  createButton: { backgroundColor: colors.secondary[500] },
  nextButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[0] },
});
