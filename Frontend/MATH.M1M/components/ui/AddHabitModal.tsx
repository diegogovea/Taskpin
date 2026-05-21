/**
 * AddHabitModal — bottom sheet para configurar un hábito antes de agregarlo.
 * Permite: frecuencia custom, fecha inicio, fecha fin, meta, color, icono, puntos.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// ── Constants ──────────────────────────────────────────────
const FREQ_UNITS = ['días', 'semanas', 'meses', 'año'] as const;
type FreqUnit = typeof FREQ_UNITS[number];

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#14B8A6',
  '#3B82F6', '#06B6D4', '#84CC16', '#64748B',
];

const PRESET_ICONS = [
  'leaf-outline', 'fitness-outline', 'barbell-outline', 'bicycle-outline',
  'heart-outline', 'water-outline', 'moon-outline', 'sunny-outline',
  'book-outline', 'musical-notes-outline', 'brush-outline', 'code-slash-outline',
  'restaurant-outline', 'walk-outline', 'medkit-outline', 'trophy-outline',
];

// ── Helpers ─────────────────────────────────────────────────
/** Convierte N + unidad a la frecuencia_personal del backend */
export function toFrecuenciaPersonal(n: number, unit: FreqUnit): string {
  if (unit === 'días') {
    if (n === 1) return 'diario';
    if (n === 2) return 'cada_2_dias';
    return `cada_${n}_dias`;
  }
  if (unit === 'semanas') {
    if (n === 1) return 'semanal';
    if (n === 2) return 'cada_2_semanas';
    return `cada_${n}_semanas`;
  }
  if (unit === 'meses') {
    if (n === 1) return 'mensual';
    if (n === 2) return 'cada_2_meses';
    return `cada_${n}_meses`;
  }
  return 'anual';
}

const formatDate = (d: Date) =>
  d.toISOString().split('T')[0]; // YYYY-MM-DD

const formatDateDisplay = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ── Types ────────────────────────────────────────────────────
export interface HabitConfig {
  habito_id: number;
  nombre: string;
  descripcion?: string | null;
  frecuencia_personal: string;
  color: string | null;
  icono: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  meta_valor: number | null;
  meta_unidad: string;
  puntos_base: number;
}

interface Props {
  visible: boolean;
  habito: { habito_id: number; nombre: string; descripcion?: string | null; puntos_base?: number } | null;
  categoryColor?: string;
  onConfirm: (config: HabitConfig) => void;
  onCancel: () => void;
}

// ── Component ────────────────────────────────────────────────
export default function AddHabitModal({ visible, habito, categoryColor, onConfirm, onCancel }: Props) {
  const { palette } = useTheme();
  const [freqN, setFreqN] = useState('1');
  const [freqUnit, setFreqUnit] = useState<FreqUnit>('días');
  const [color, setColor] = useState<string | null>(categoryColor || null);
  const [icono, setIcono] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>(formatDate(new Date()));
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [metaValor, setMetaValor] = useState('');
  const [metaUnidad, setMetaUnidad] = useState('');
  const [puntos, setPuntos] = useState('10');

  // Date picker states
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);

  useEffect(() => {
    if (visible && habito) {
      setFreqN('1');
      setFreqUnit('días');
      setColor(categoryColor || null);
      setIcono(null);
      setFechaInicio(formatDate(new Date()));
      setFechaFin(null);
      setMetaValor('');
      setMetaUnidad('');
      setPuntos(String(habito.puntos_base ?? 10));
    }
  }, [visible, habito]);

  if (!habito) return null;

  const handleConfirm = () => {
    const n = parseInt(freqN) || 1;
    onConfirm({
      habito_id: habito.habito_id,
      nombre: habito.nombre,
      descripcion: habito.descripcion,
      frecuencia_personal: toFrecuenciaPersonal(n, freqUnit),
      color: color || null,
      icono: icono || null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      meta_valor: metaValor ? parseFloat(metaValor) : null,
      meta_unidad: metaUnidad,
      puntos_base: parseInt(puntos) || 10,
    });
  };

  const accentColor = color || categoryColor || colors.primary[600];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeHeader accentColor={accentColor} nombre={habito.nombre} onCancel={onCancel} onConfirm={handleConfirm} />

        <ScrollView style={[styles.scroll, { backgroundColor: palette.bg }]} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Descripción */}
          {habito.descripcion ? (
            <View style={[styles.descCard, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name="information-circle-outline" size={15} color={palette.icon} />
              <Text style={[styles.descText, { color: palette.textMuted }]}>{habito.descripcion}</Text>
            </View>
          ) : null}

          {/* ── Frecuencia ── */}
          <Section label="¿Con qué frecuencia?">
            <View style={styles.freqRow}>
              <Text style={styles.freqPrefix}>Cada</Text>
              <TextInput
                style={[styles.freqInput, { borderColor: palette.border, backgroundColor: palette.inputBg, color: palette.text }]}
                keyboardType="number-pad"
                value={freqN}
                onChangeText={(t) => setFreqN(t.replace(/[^0-9]/g, '') || '1')}
                selectTextOnFocus
              />
              <View style={styles.unitRow}>
                {FREQ_UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, freqUnit === u && { backgroundColor: accentColor + '20', borderColor: accentColor }]}
                    onPress={() => { setFreqUnit(u); if (u === 'año') setFreqN('1'); }}
                  >
                    <Text style={[styles.unitBtnText, freqUnit === u && { color: accentColor, fontWeight: '700' }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={styles.freqPreview}>
              Frecuencia: <Text style={{ fontWeight: '700', color: accentColor }}>{toFrecuenciaPersonal(parseInt(freqN) || 1, freqUnit).replace(/_/g, ' ')}</Text>
            </Text>
          </Section>

          {/* ── Fechas ── */}
          <Section label="Fechas">
            {/* Inicio */}
            <Text style={styles.subLabel}>Fecha de inicio</Text>
            <TouchableOpacity style={[styles.dateBtn, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setShowInicioPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={accentColor} />
              <Text style={[styles.dateBtnText, { color: palette.text }]}>{formatDateDisplay(fechaInicio)}</Text>
            </TouchableOpacity>
            {showInicioPicker && (
              <DateTimePicker
                value={new Date(fechaInicio + 'T12:00:00')}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  setShowInicioPicker(Platform.OS === 'ios');
                  if (d) setFechaInicio(formatDate(d));
                }}
              />
            )}

            {/* Fin */}
            <Text style={[styles.subLabel, { marginTop: spacing[4] }]}>Fecha de fin (opcional)</Text>
            <TouchableOpacity style={[styles.dateBtn, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setShowFinPicker(true)}>
              <Ionicons name="calendar-clear-outline" size={18} color={fechaFin ? accentColor : palette.textSubtle} />
              <Text style={[styles.dateBtnText, { color: fechaFin ? palette.text : palette.textSubtle }]}>
                {fechaFin ? formatDateDisplay(fechaFin) : 'Sin fecha límite'}
              </Text>
            </TouchableOpacity>
            {fechaFin && (
              <TouchableOpacity onPress={() => setFechaFin(null)} style={styles.clearDateBtn}>
                <Ionicons name="close-circle" size={14} color={colors.neutral[400]} />
                <Text style={styles.clearDateText}>Quitar fecha fin</Text>
              </TouchableOpacity>
            )}
            {showFinPicker && (
              <DateTimePicker
                value={fechaFin ? new Date(fechaFin + 'T12:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date(fechaInicio + 'T12:00:00')}
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  setShowFinPicker(Platform.OS === 'ios');
                  if (d) setFechaFin(formatDate(d));
                }}
              />
            )}
          </Section>

          {/* ── Meta diaria ── */}
          <Section label="Meta diaria (opcional)">
            <View style={styles.metaRow}>
              <TextInput
                style={[styles.metaInput, { flex: 1, backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                placeholder="Ej: 30"
                placeholderTextColor={palette.textSubtle}
                keyboardType="decimal-pad"
                value={metaValor}
                onChangeText={setMetaValor}
              />
              <TextInput
                style={[styles.metaInput, { flex: 2, backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text }]}
                placeholder="Ej: minutos, vasos, km..."
                placeholderTextColor={palette.textSubtle}
                value={metaUnidad}
                onChangeText={setMetaUnidad}
              />
            </View>
          </Section>

          {/* ── Puntos ── */}
          <Section label="Puntos por completar">
            <View style={styles.puntosRow}>
              <Ionicons name="diamond-outline" size={20} color={accentColor} />
              <TextInput
                style={[styles.freqInput, { borderColor: accentColor }]}
                keyboardType="number-pad"
                value={puntos}
                onChangeText={(t) => setPuntos(t.replace(/[^0-9]/g, ''))}
                selectTextOnFocus
              />
              <Text style={styles.freqPrefix}>puntos</Text>
            </View>
          </Section>

          {/* ── Color ── */}
          <Section label="Color">
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.colorSwatch, { backgroundColor: colors.neutral[100] }, !color && styles.colorSwatchSelected]}
                onPress={() => setColor(null)}
              >
                <Ionicons name="close" size={14} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>
          </Section>

          {/* ── Icono ── */}
          <Section label="Icono">
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconSwatch, icono === ic && { backgroundColor: accentColor + '20', borderColor: accentColor }]}
                  onPress={() => setIcono(ic)}
                >
                  <Ionicons name={ic as any} size={22} color={icono === ic ? accentColor : colors.neutral[400]} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.iconSwatch, !icono && { borderColor: colors.neutral[400] }]}
                onPress={() => setIcono(null)}
              >
                <Ionicons name="close-circle-outline" size={22} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function SafeHeader({ accentColor, nombre, onCancel, onConfirm }: {
  accentColor: string; nombre: string; onCancel: () => void; onConfirm: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
      <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
        <Text style={styles.headerCancel}>Cancelar</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: palette.heading }]} numberOfLines={1}>{nombre}</Text>
        <Text style={[styles.headerSub, { color: palette.textSubtle }]}>Configura el hábito</Text>
      </View>
      <TouchableOpacity onPress={onConfirm} style={[styles.headerBtn, styles.headerConfirmBtn, { backgroundColor: accentColor }]}>
        <Text style={styles.headerConfirm}>Agregar</Text>
      </TouchableOpacity>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: palette.heading }]}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
  },
  headerBtn: { minWidth: 72, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing[2] },
  headerTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.neutral[900] },
  headerSub: { fontSize: typography.size.xs, color: colors.neutral[400], marginTop: 2 },
  headerCancel: { fontSize: typography.size.base, color: colors.neutral[500] },
  headerConfirmBtn: { borderRadius: radius.lg, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  headerConfirm: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: '#fff' },
  scroll: { flex: 1, backgroundColor: colors.neutral[50] },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  descCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], backgroundColor: colors.neutral[100], borderRadius: radius.lg, padding: spacing[3], marginBottom: spacing[4] },
  descText: { flex: 1, fontSize: typography.size.sm, color: colors.neutral[600], lineHeight: 18 },
  section: { marginBottom: spacing[6] },
  sectionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.neutral[800], marginBottom: spacing[3] },
  subLabel: { fontSize: typography.size.xs, color: colors.neutral[500], marginBottom: spacing[2] },
  // Frecuencia
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  freqPrefix: { fontSize: typography.size.base, color: colors.neutral[700] },
  freqInput: { width: 56, borderWidth: 1.5, borderColor: colors.neutral[300], borderRadius: radius.md, paddingVertical: spacing[2], paddingHorizontal: spacing[3], fontSize: typography.size.base, color: colors.neutral[900], textAlign: 'center', backgroundColor: colors.neutral[0] },
  unitRow: { flexDirection: 'row', gap: spacing[1], flexWrap: 'wrap' },
  unitBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.md, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  unitBtnText: { fontSize: typography.size.xs, color: colors.neutral[600] },
  freqPreview: { fontSize: typography.size.xs, color: colors.neutral[400], marginTop: spacing[2] },
  // Fechas
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.neutral[0], borderRadius: radius.lg, padding: spacing[4], borderWidth: 1, borderColor: colors.neutral[200] },
  dateBtnText: { fontSize: typography.size.base, color: colors.neutral[800] },
  clearDateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[2] },
  clearDateText: { fontSize: typography.size.xs, color: colors.neutral[400] },
  // Meta
  metaRow: { flexDirection: 'row', gap: spacing[3] },
  metaInput: { backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200], borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], fontSize: typography.size.base, color: colors.neutral[900] },
  // Puntos
  puntosRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  // Color
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  colorSwatch: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.neutral[900] },
  // Icono
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  iconSwatch: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.neutral[100], borderWidth: 1.5, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
});
