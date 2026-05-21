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
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

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

// =====================
// MAIN COMPONENT
// =====================

export default function WizardPlanCustom() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { palette } = useTheme();

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
    titulo: '', descripcion: '', tipo: 'diaria', prioridad: 'media', notas: '',
  });
  const [tareaError, setTareaError] = useState('');

  // ── A2: fase inline expandida (id de la fase cuyas tareas están visibles) ──
  const [expandedFaseId, setExpandedFaseId] = useState<string | null>(null);

  // ── A3: quick-add tarea (estado para input rápido por fase) ──
  const [quickTaskTitle, setQuickTaskTitle] = useState<Record<string, string>>({});

  const diasUsados = config.fases.reduce((acc, f) => acc + f.duracion_dias, 0);
  const diasRestantes = config.plazo_dias - diasUsados;
  const totalTareas = config.fases.reduce((a, f) => a + f.tareas.length, 0);

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
      const totalT = config.fases.reduce((a, f) => a + f.tareas.length, 0);
      if (totalT === 0) {
        setStepError('Agrega al menos una tarea a alguna fase');
        return;
      }
      if (diasUsados > config.plazo_dias) {
        setStepError(`Te excediste por ${diasUsados - config.plazo_dias} días. Ajusta las fases o aumenta el plazo.`);
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
    setTempTarea({ titulo: '', descripcion: '', tipo: 'diaria', prioridad: 'media', notas: '' });
    setEditingTareaId('new');
    setEditingFaseId2(faseId);
  };

  // A3: agregar tarea rápida sin abrir modal
  const quickAddTarea = (faseId: string) => {
    const titulo = (quickTaskTitle[faseId] || '').trim();
    if (titulo.length < 3) return;
    const nueva: Tarea = {
      id: generateId(),
      titulo,
      descripcion: '',
      tipo: 'diaria',
      prioridad: 'media',
      notas: '',
    };
    setConfig(prev => ({
      ...prev,
      fases: prev.fases.map(f => (f.id === faseId ? { ...f, tareas: [...f.tareas, nueva] } : f)),
    }));
    setQuickTaskTitle(prev => ({ ...prev, [faseId]: '' }));
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
            fecha_limite: null,
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
      <Text style={[styles.stepTitle, { color: palette.heading }]}>¿Cuál es tu meta?</Text>
      <Text style={[styles.stepSubtitle, { color: palette.textMuted }]}>Dale a tu plan un objetivo claro</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: palette.text }]}>Meta Principal *</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
          placeholder="Ej: Aprender a tocar guitarra"
          placeholderTextColor={palette.textSubtle}
          value={config.meta_principal}
          onChangeText={(t) => { setConfig({ ...config, meta_principal: t }); setStepError(''); }}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: palette.text }]}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe lo que quieres lograr..."
          placeholderTextColor={palette.textSubtle}
          value={config.descripcion}
          onChangeText={(t) => setConfig({ ...config, descripcion: t })}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: palette.text }]}>Duración total</Text>
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
        <Text style={[styles.inputLabel, { color: palette.text }]}>Dificultad</Text>
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

  // ── A1: Barra flotante de progreso (compartida en pasos 2 y 3) ──
  const renderProgressBar = () => {
    const pct = Math.min(100, (diasUsados / config.plazo_dias) * 100);
    const overBudget = diasUsados > config.plazo_dias;
    return (
      <View style={[styles.progressStrip, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <View style={styles.progressStripRow}>
          <View style={styles.progressStripStat}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary[600]} />
            <Text style={[styles.progressStripText, { color: palette.text }]}>
              <Text style={{ fontWeight: '700' }}>{diasUsados}</Text>/{config.plazo_dias} días
            </Text>
          </View>
          <View style={styles.progressStripStat}>
            <Ionicons name="layers-outline" size={14} color={colors.secondary[600]} />
            <Text style={[styles.progressStripText, { color: palette.text }]}>
              <Text style={{ fontWeight: '700' }}>{config.fases.length}</Text> {config.fases.length === 1 ? 'fase' : 'fases'}
            </Text>
          </View>
          <View style={styles.progressStripStat}>
            <Ionicons name="checkbox-outline" size={14} color={colors.accent.amber} />
            <Text style={[styles.progressStripText, { color: palette.text }]}>
              <Text style={{ fontWeight: '700' }}>{totalTareas}</Text> {totalTareas === 1 ? 'tarea' : 'tareas'}
            </Text>
          </View>
        </View>
        <View style={[styles.progressStripBar, { backgroundColor: palette.surfaceAlt }]}>
          <View
            style={[
              styles.progressStripFill,
              { width: `${pct}%`, backgroundColor: overBudget ? colors.semantic.error : colors.primary[500] },
            ]}
          />
        </View>
        {overBudget && (
          <Text style={styles.progressStripWarn}>
            ⚠ Te pasaste por {diasUsados - config.plazo_dias} días. Reduce alguna fase o aumenta el plazo.
          </Text>
        )}
      </View>
    );
  };

  // ── A2: Card de fase con inline-edit + lista de tareas expandible (A3) ──
  const renderFaseCard = (fase: Fase, index: number) => {
    const isEditing = editingFaseId === fase.id;
    const isExpanded = expandedFaseId === fase.id;
    const diasDisp = diasRestantes + (isEditing ? fase.duracion_dias : 0);

    return (
      <View key={fase.id} style={[styles.faseCardV2, { backgroundColor: palette.surface, borderColor: isExpanded ? colors.primary[300] : palette.border }]}>
        {/* Header */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => !isEditing && setExpandedFaseId(isExpanded ? null : fase.id)}
          style={styles.faseCardV2Header}
        >
          <View style={styles.faseBadge}>
            <Text style={styles.faseBadgeText}>Fase {index + 1}</Text>
          </View>
          <View style={styles.faseCardV2Title}>
            <Text style={[styles.faseTitulo, { color: palette.heading }]} numberOfLines={1}>{fase.titulo}</Text>
            <Text style={[styles.faseDuracion, { color: palette.textMuted }]}>
              {fase.duracion_dias} días · {fase.tareas.length} {fase.tareas.length === 1 ? 'tarea' : 'tareas'}
            </Text>
          </View>
          <View style={styles.faseActions}>
            <TouchableOpacity onPress={() => openEditFase(fase)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={18} color={palette.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteFase(fase.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.semantic.error} />
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={palette.iconSubtle}
              style={{ marginLeft: spacing[1] }}
            />
          </View>
        </TouchableOpacity>

        {/* Inline edit form */}
        {isEditing && (
          <View style={[styles.inlineEditBox, { backgroundColor: palette.surfaceAlt, borderColor: colors.primary[300] }]}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>Título</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
              placeholder="Ej: Fundamentos"
              placeholderTextColor={palette.textSubtle}
              value={tempFase.titulo}
              onChangeText={(t) => { setTempFase({ ...tempFase, titulo: t }); setFaseError(''); }}
            />
            <Text style={[styles.inputLabel, { color: palette.text, marginTop: spacing[3] }]}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
              placeholder="¿Qué harás en esta fase?"
              placeholderTextColor={palette.textSubtle}
              value={tempFase.descripcion}
              onChangeText={(t) => setTempFase({ ...tempFase, descripcion: t })}
              multiline
            />
            <View style={styles.durationRow}>
              <Text style={[styles.inputLabel, { color: palette.text }]}>Duración:</Text>
              <TextInput
                style={[styles.smallInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                keyboardType="number-pad"
                value={tempFase.duracion_dias}
                onChangeText={(t) => { setTempFase({ ...tempFase, duracion_dias: t.replace(/[^0-9]/g, '') }); setFaseError(''); }}
                selectTextOnFocus
              />
              <Text style={[styles.inputLabel, { color: palette.text }]}>días</Text>
              <Text style={[styles.durationHint, { marginTop: 0, marginLeft: 'auto' }]}>
                disp. {diasDisp}
              </Text>
            </View>
            {faseError !== '' && <InlineError msg={faseError} />}
            <View style={styles.editModalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingFaseId(null); setFaseError(''); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveFase}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Description preview */}
        {!isEditing && fase.descripcion ? (
          <Text style={[styles.faseDesc, { color: palette.textMuted }]} numberOfLines={isExpanded ? undefined : 2}>
            {fase.descripcion}
          </Text>
        ) : null}

        {/* Tasks list (expanded) */}
        {!isEditing && isExpanded && (
          <View style={styles.faseTasksContainer}>
            <View style={[styles.faseTasksSep, { backgroundColor: palette.border }]} />
            {fase.tareas.length === 0 ? (
              <Text style={[styles.noTasksText, { color: palette.textSubtle }]}>
                Aún no hay tareas en esta fase
              </Text>
            ) : (
              fase.tareas.map((tarea) => (
                <View key={tarea.id} style={styles.tareaItem}>
                  <TouchableOpacity
                    style={styles.tareaInfo}
                    onPress={() => openEditTarea(fase.id, tarea)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.tareaTipoBadge, { backgroundColor: getTipoColor(tarea.tipo) + '20' }]}>
                      <Text style={[styles.tareaTipoText, { color: getTipoColor(tarea.tipo) }]}>{tarea.tipo}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tareaTitulo, { color: palette.text }]} numberOfLines={1}>{tarea.titulo}</Text>
                    </View>
                    <View style={[styles.prioridadDot, { backgroundColor: getPrioridadColor(tarea.prioridad) }]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTarea(fase.id, tarea.id)} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={18} color={palette.iconSubtle} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* A3: Quick-add tarea */}
            <View style={styles.quickAddRow}>
              <TextInput
                style={[styles.quickAddInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                placeholder="+ Tarea rápida (presiona enter)"
                placeholderTextColor={palette.textSubtle}
                value={quickTaskTitle[fase.id] || ''}
                onChangeText={(t) => setQuickTaskTitle(prev => ({ ...prev, [fase.id]: t }))}
                onSubmitEditing={() => quickAddTarea(fase.id)}
                returnKeyType="done"
              />
              {(quickTaskTitle[fase.id] || '').trim().length >= 3 && (
                <TouchableOpacity style={styles.quickAddBtn} onPress={() => quickAddTarea(fase.id)}>
                  <Ionicons name="checkmark" size={18} color={colors.neutral[0]} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.addTaskBtn} onPress={() => openNewTarea(fase.id)}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary[600]} />
              <Text style={styles.addTaskBtnText}>Agregar con detalles</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── STEP 2: Fases + Tareas en una sola pantalla (A2 + A3) ──
  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      {renderProgressBar()}
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.stepTitle, { color: palette.heading }]}>Construye tu plan</Text>
        <Text style={[styles.stepSubtitle, { color: palette.textMuted }]}>
          Divide los {config.plazo_dias} días en fases y agrega tareas dentro de cada una
        </Text>

        {config.fases.length === 0 && (
          <View style={[styles.emptyHint, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary[600]} />
            <Text style={[styles.emptyHintText, { color: palette.textMuted }]}>
              Empieza creando tu primera fase. Cada fase representa una etapa de tu plan.
            </Text>
          </View>
        )}

        {config.fases.map((fase, index) => renderFaseCard(fase, index))}

        {/* Nueva fase inline */}
        {editingFaseId === 'new' ? (
          <View style={[styles.faseCardV2, { backgroundColor: palette.surface, borderColor: colors.primary[300] }]}>
            <View style={styles.faseCardV2Header}>
              <View style={styles.faseBadge}>
                <Text style={styles.faseBadgeText}>Nueva</Text>
              </View>
              <Text style={[styles.faseCardV2HeaderTitle, { color: palette.heading }]}>Nueva fase</Text>
            </View>
            <View style={[styles.inlineEditBox, { backgroundColor: palette.surfaceAlt, borderColor: colors.primary[300] }]}>
              <Text style={[styles.inputLabel, { color: palette.text }]}>Título</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                placeholder="Ej: Fundamentos"
                placeholderTextColor={palette.textSubtle}
                value={tempFase.titulo}
                onChangeText={(t) => { setTempFase({ ...tempFase, titulo: t }); setFaseError(''); }}
                autoFocus
              />
              <Text style={[styles.inputLabel, { color: palette.text, marginTop: spacing[3] }]}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                placeholder="¿Qué harás en esta fase?"
                placeholderTextColor={palette.textSubtle}
                value={tempFase.descripcion}
                onChangeText={(t) => setTempFase({ ...tempFase, descripcion: t })}
                multiline
              />
              <View style={styles.durationRow}>
                <Text style={[styles.inputLabel, { color: palette.text }]}>Duración:</Text>
                <TextInput
                  style={[styles.smallInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                  keyboardType="number-pad"
                  value={tempFase.duracion_dias}
                  onChangeText={(t) => { setTempFase({ ...tempFase, duracion_dias: t.replace(/[^0-9]/g, '') }); setFaseError(''); }}
                  selectTextOnFocus
                />
                <Text style={[styles.inputLabel, { color: palette.text }]}>días</Text>
                <Text style={[styles.durationHint, { marginTop: 0, marginLeft: 'auto' }]}>disp. {diasRestantes}</Text>
              </View>
              {faseError !== '' && <InlineError msg={faseError} />}
              <View style={styles.editModalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingFaseId(null); setFaseError(''); }}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => {
                    const dias = parseInt(tempFase.duracion_dias);
                    const willBeNew = editingFaseId === 'new';
                    saveFase();
                    if (willBeNew && !isNaN(dias) && tempFase.titulo.trim().length >= 3) {
                      setTimeout(() => {
                        setConfig(curr => {
                          const lastFase = curr.fases[curr.fases.length - 1];
                          if (lastFase) setExpandedFaseId(lastFase.id);
                          return curr;
                        });
                      }, 50);
                    }
                  }}
                >
                  <Text style={styles.saveBtnText}>Crear fase</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, diasRestantes <= 0 && { opacity: 0.4 }]}
            onPress={openNewFase}
            disabled={diasRestantes <= 0}
          >
            <Ionicons name="add" size={22} color={colors.primary[600]} />
            <Text style={styles.addButtonText}>
              {diasRestantes <= 0 ? 'Sin días disponibles' : 'Agregar Fase'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Sugerencia rápida */}
        {config.fases.length > 0 && (
          <View style={[styles.tipCard, { backgroundColor: colors.primary[50] }]}>
            <Ionicons name="bulb-outline" size={16} color={colors.primary[600]} />
            <Text style={styles.tipText}>
              Tip: toca una fase para expandir sus tareas. Usa el input de tarea rápida para agregar varias seguidas.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // ── STEP 3: Resumen visual antes de crear (A4) ──
  const renderStep3 = () => {
    const sinTareas = config.fases.filter(f => f.tareas.length === 0);
    const pctDias = Math.min(100, (diasUsados / config.plazo_dias) * 100);
    const tareasPorTipo = {
      diaria: 0, semanal: 0, 'única': 0 as number,
    };
    config.fases.forEach(f => f.tareas.forEach(t => { (tareasPorTipo as any)[t.tipo] = ((tareasPorTipo as any)[t.tipo] || 0) + 1; }));

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepTitle, { color: palette.heading }]}>Revisa y crea</Text>
        <Text style={[styles.stepSubtitle, { color: palette.textMuted }]}>
          Verifica todo antes de lanzar tu plan
        </Text>

        {/* Hero summary card */}
        <View style={styles.heroSummary}>
          <Text style={styles.heroSummaryLabel}>Tu meta</Text>
          <Text style={styles.heroSummaryMeta}>{config.meta_principal}</Text>
          {config.descripcion ? (
            <Text style={styles.heroSummaryDesc} numberOfLines={3}>{config.descripcion}</Text>
          ) : null}
          <View style={styles.heroChips}>
            <View style={styles.heroChip}>
              <Ionicons name="hourglass-outline" size={14} color={colors.neutral[0]} />
              <Text style={styles.heroChipText}>{config.plazo_dias} días</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="speedometer-outline" size={14} color={colors.neutral[0]} />
              <Text style={styles.heroChipText}>{config.dificultad}</Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
            <Ionicons name="layers" size={20} color={colors.primary[600]} />
            <Text style={[styles.statValue, { color: palette.heading }]}>{config.fases.length}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Fases</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
            <Ionicons name="checkbox" size={20} color={colors.secondary[600]} />
            <Text style={[styles.statValue, { color: palette.heading }]}>{totalTareas}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Tareas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
            <Ionicons name="calendar" size={20} color={colors.accent.amber} />
            <Text style={[styles.statValue, { color: palette.heading }]}>{diasUsados}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>Días usados</Text>
          </View>
        </View>

        {/* Distribución de tareas por tipo */}
        {totalTareas > 0 && (
          <View style={[styles.distribCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.distribTitle, { color: palette.heading }]}>Distribución de tareas</Text>
            {(['diaria', 'semanal', 'única'] as const).map((tipo) => {
              const n = (tareasPorTipo as any)[tipo] || 0;
              const pct = totalTareas > 0 ? Math.round((n / totalTareas) * 100) : 0;
              const c = getTipoColor(tipo);
              return (
                <View key={tipo} style={styles.distribRow}>
                  <View style={styles.distribLabelWrap}>
                    <View style={[styles.distribDot, { backgroundColor: c }]} />
                    <Text style={[styles.distribLabel, { color: palette.text }]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.distribBarWrap}>
                    <View style={[styles.distribBarBg, { backgroundColor: palette.surfaceAlt }]}>
                      <View style={[styles.distribBarFill, { width: `${pct}%`, backgroundColor: c }]} />
                    </View>
                    <Text style={[styles.distribValue, { color: palette.textMuted }]}>{n}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Línea de fases mini-timeline */}
        <View style={[styles.miniTimeline, { backgroundColor: palette.surface }]}>
          <Text style={[styles.distribTitle, { color: palette.heading }]}>Línea de fases</Text>
          <View style={styles.miniTimelineRow}>
            <View style={[styles.miniTimelineBarBg, { backgroundColor: palette.surfaceAlt }]}>
              {config.fases.map((f, i) => {
                const w = Math.round((f.duracion_dias / config.plazo_dias) * 100);
                const palettes = [colors.primary[500], colors.secondary[500], colors.accent.amber, colors.accent.cyan];
                const c = palettes[i % palettes.length];
                return (
                  <View key={f.id} style={{ width: `${w}%`, backgroundColor: c, height: 12, justifyContent: 'center' }}>
                    {w > 10 && (
                      <Text style={styles.miniTimelineNum}>{i + 1}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          {pctDias < 100 && (
            <Text style={[styles.miniTimelineHint, { color: palette.textMuted }]}>
              Te quedan {config.plazo_dias - diasUsados} días sin asignar
            </Text>
          )}
        </View>

        {/* Advertencia: fases sin tareas */}
        {sinTareas.length > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle" size={18} color={colors.accent.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Algunas fases no tienen tareas</Text>
              <Text style={styles.warningText}>
                {sinTareas.map(f => f.titulo).join(', ')}. Vuelve al paso anterior para agregarlas.
              </Text>
            </View>
          </View>
        )}

        {/* Listado compacto de fases */}
        <View style={[styles.fasesCompactCard, { backgroundColor: palette.surface }]}>
          <Text style={[styles.distribTitle, { color: palette.heading }]}>Tus fases</Text>
          {config.fases.map((f, i) => (
            <View key={f.id} style={styles.faseCompactRow}>
              <View style={styles.faseCompactNum}>
                <Text style={styles.faseCompactNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.faseCompactTitle, { color: palette.text }]} numberOfLines={1}>{f.titulo}</Text>
                <Text style={[styles.faseCompactMeta, { color: palette.textMuted }]}>
                  {f.duracion_dias} días · {f.tareas.length} {f.tareas.length === 1 ? 'tarea' : 'tareas'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

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
          <Text style={[styles.inputLabel, { color: palette.text }]}>Título *</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
            placeholder="¿Qué vas a hacer?"
            placeholderTextColor={palette.textSubtle}
            value={tempTarea.titulo || ''}
            onChangeText={(t) => { setTempTarea({ ...tempTarea, titulo: t }); setTareaError(''); }}
          />

          {/* Descripción */}
          <Text style={[styles.inputLabel, { marginTop: spacing[3] }]}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { marginBottom: 0 }]}
            placeholder="Más detalles de la tarea..."
            placeholderTextColor={palette.textSubtle}
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

          {/* Notas */}
          <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Notas (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Recordatorios, recursos, links..."
            placeholderTextColor={palette.textSubtle}
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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.surfaceAlt }]} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.heading }]}>Crear Plan Personalizado</Text>
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
        <View style={[styles.footer, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
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
  stepErrorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginHorizontal: spacing[5], marginBottom: spacing[2], backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: spacing[3], borderWidth: 1, borderColor: '#FECACA' },
  stepErrorText: { flex: 1, fontSize: typography.size.sm, color: '#B91C1C' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[2] },
  inlineErrorText: { flex: 1, fontSize: typography.size.sm, color: '#EF4444' },
  footer: { padding: spacing[5], backgroundColor: colors.neutral[0], borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.primary[600], paddingVertical: spacing[4], borderRadius: radius.xl },
  createButton: { backgroundColor: colors.secondary[500] },
  nextButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[0] },

  // === A1: Sticky progress strip ===
  progressStrip: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  progressStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[2],
  },
  progressStripStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressStripText: {
    fontSize: typography.size.sm,
  },
  progressStripBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressStripFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStripWarn: {
    marginTop: spacing[2],
    fontSize: typography.size.xs,
    color: colors.semantic.error,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },

  // === A2: Fase card V2 (inline edit + expand) ===
  faseCardV2: {
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1.5,
    ...shadows.sm,
  },
  faseCardV2Header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  faseCardV2Title: {
    flex: 1,
  },
  faseCardV2HeaderTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineEditBox: {
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },

  // === A3: tasks inside fase card ===
  faseTasksContainer: {
    marginTop: spacing[3],
  },
  faseTasksSep: {
    height: 1,
    marginBottom: spacing[2],
  },
  noTasksText: {
    fontSize: typography.size.sm,
    fontStyle: 'italic',
    paddingVertical: spacing[2],
    textAlign: 'center',
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  quickAddInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.size.sm,
  },
  quickAddBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === Empty hint card ===
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  emptyHintText: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 18,
  },

  // === Tip card ===
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    marginTop: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.primary[700],
    lineHeight: 16,
  },

  // === A4: Resumen visual paso 3 ===
  heroSummary: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  heroSummaryLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  heroSummaryMeta: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[2],
  },
  heroSummaryDesc: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  heroChips: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  heroChipText: {
    color: colors.neutral[0],
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing[1],
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  distribCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  distribTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[3],
  },
  distribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  distribLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  distribDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distribLabel: {
    fontSize: typography.size.sm,
  },
  distribBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  distribBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distribBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  distribValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    width: 24,
    textAlign: 'right',
  },
  miniTimeline: {
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  miniTimelineRow: {
    marginTop: spacing[1],
  },
  miniTimelineBarBg: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  miniTimelineNum: {
    color: colors.neutral[0],
    fontSize: 9,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  miniTimelineHint: {
    marginTop: spacing[2],
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    backgroundColor: colors.accent.amber + '15',
    borderWidth: 1,
    borderColor: colors.accent.amber + '40',
    marginBottom: spacing[4],
  },
  warningTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.accent.amber,
    marginBottom: 2,
  },
  warningText: {
    fontSize: typography.size.xs,
    color: colors.neutral[700],
    lineHeight: 16,
  },
  fasesCompactCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  faseCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  faseCompactNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  faseCompactNumText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary[700],
  },
  faseCompactTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  faseCompactMeta: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
});
