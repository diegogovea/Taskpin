import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Interfaces ────────────────────────────────────────────────────────────────
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

// ─── Constantes ────────────────────────────────────────────────────────────────
const MOOD_CONFIG: Record<string, { color: string; icon: string; label: string; emoji: string }> = {
  great:   { color: '#22C55E', icon: 'sunny',       label: 'Excelente', emoji: '☀️' },
  good:    { color: '#84CC16', icon: 'partly-sunny', label: 'Bien',      emoji: '⛅' },
  neutral: { color: '#F59E0B', icon: 'cloudy',       label: 'Neutral',   emoji: '☁️' },
  low:     { color: '#F97316', icon: 'rainy',        label: 'Bajo',      emoji: '🌧️' },
  bad:     { color: '#EF4444', icon: 'thunderstorm', label: 'Mal',       emoji: '⛈️' },
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

type ViewMode = 'lista' | 'calendario';
type PeriodoFiltro = 'todos' | 'semana' | 'mes';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function toLocalDateStr(dateStr: string): string {
  // API returns "2026-05-20T..." or "2026-05-20" — normalize to YYYY-MM-DD local
  return dateStr.slice(0, 10);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: fmt(start), end: fmt(today) };
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const td = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;
  const yd = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth()+1).padStart(2,'0')}-${String(yesterdayDate.getDate()).padStart(2,'0')}`;

  if (dateStr === td) return 'Hoy';
  if (dateStr === yd) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function HistorialReflexiones() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { palette } = useTheme();

  // datos
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reflexiones, setReflexiones] = useState<Reflexion[]>([]);
  const [resumen, setResumen] = useState<ResumenAnimo>({ great: 0, good: 0, neutral: 0, low: 0, bad: 0 });
  const [total, setTotal] = useState(0);

  // vista
  const [viewMode, setViewMode] = useState<ViewMode>('lista');

  // filtros lista
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [moodFiltro, setMoodFiltro] = useState<string | null>(null);

  // calendario
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ── fetch ──
  const loadHistorial = async () => {
    if (!user?.user_id) return;
    try {
      const response = await authFetch(`/api/usuario/${user.user_id}/reflexiones?limite=200`);
      const data = await response.json();
      if (data.success) {
        setReflexiones(data.reflexiones || []);
        setResumen(data.resumen || { great: 0, good: 0, neutral: 0, low: 0, bad: 0 });
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Error loading historial:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (user?.user_id) loadHistorial(); }, [user?.user_id]);
  useFocusEffect(useCallback(() => { if (user?.user_id) loadHistorial(); }, [user?.user_id]));
  const onRefresh = () => { setRefreshing(true); loadHistorial(); };

  // ── mapa fecha → reflexión (para calendario) ──
  const reflexionByDate = useMemo(() => {
    const map: Record<string, Reflexion> = {};
    reflexiones.forEach(r => { map[toLocalDateStr(r.fecha)] = r; });
    return map;
  }, [reflexiones]);

  // ── lista filtrada ──
  const reflexionesFiltradas = useMemo(() => {
    let list = [...reflexiones];

    if (periodo === 'semana') {
      const { start, end } = getWeekRange();
      list = list.filter(r => toLocalDateStr(r.fecha) >= start && toLocalDateStr(r.fecha) <= end);
    } else if (periodo === 'mes') {
      const { start, end } = getMonthRange(today.getFullYear(), today.getMonth());
      list = list.filter(r => toLocalDateStr(r.fecha) >= start && toLocalDateStr(r.fecha) <= end);
    }

    if (moodFiltro) {
      list = list.filter(r => r.estado_animo === moodFiltro);
    }

    return list;
  }, [reflexiones, periodo, moodFiltro]);

  // ── días del calendario ──
  const calDays = useMemo(() => {
    const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Dom
    // Ajustar a lunes como primer día (0=Lun ... 6=Dom)
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // rellenar hasta múltiplo de 7
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const totalReflexiones = Object.values(resumen).reduce((a, b) => a + b, 0);

  // ─── Sub-componentes ──────────────────────────────────────────────────────────

  const MoodStat = ({ mood, count }: { mood: string; count: number }) => {
    const cfg = MOOD_CONFIG[mood];
    const pct = totalReflexiones > 0 ? Math.round((count / totalReflexiones) * 100) : 0;
    return (
      <View style={styles.moodStat}>
        <View style={[styles.moodStatIcon, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
        </View>
        <Text style={styles.moodStatCount}>{count}</Text>
        <Text style={styles.moodStatPercent}>{pct}%</Text>
      </View>
    );
  };

  const ReflexionCard = ({ item }: { item: Reflexion }) => {
    const mood = MOOD_CONFIG[item.estado_animo] || MOOD_CONFIG.neutral;
    return (
      <View style={[styles.reflexionCard, { backgroundColor: palette.surface }]}>
        <View style={styles.reflexionHeader}>
          <View style={[styles.moodBadge, { backgroundColor: mood.color + '20' }]}>
            <Ionicons name={mood.icon as any} size={18} color={mood.color} />
            <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          </View>
          <Text style={[styles.reflexionDate, { color: palette.textMuted }]}>
            {formatDateDisplay(toLocalDateStr(item.fecha))}
          </Text>
        </View>
        {item.que_salio_bien && (
          <View style={styles.textSection}>
            <Text style={[styles.textLabel, { color: palette.textSubtle }]}>¿Qué salió bien?</Text>
            <Text style={[styles.textContent, { color: palette.text }]}>{item.que_salio_bien}</Text>
          </View>
        )}
        {item.que_mejorar && (
          <View style={styles.textSection}>
            <Text style={[styles.textLabel, { color: palette.textSubtle }]}>¿Qué mejorar?</Text>
            <Text style={[styles.textContent, { color: palette.text }]}>{item.que_mejorar}</Text>
          </View>
        )}
        {!item.que_salio_bien && !item.que_mejorar && (
          <Text style={[styles.noNotesText, { color: palette.textSubtle }]}>Sin notas agregadas</Text>
        )}
      </View>
    );
  };

  // ─── Vista Calendario ─────────────────────────────────────────────────────────
  const CalendarioView = () => {
    const selected = selectedDay ? reflexionByDate[selectedDay] : null;
    const currentMonthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    const todayDateStr = todayStr();

    const prevMonth = () => {
      if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
      else setCalMonth(m => m - 1);
      setSelectedDay(null);
    };
    const nextMonth = () => {
      const now = new Date();
      if (calYear === now.getFullYear() && calMonth === now.getMonth()) return;
      if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
      else setCalMonth(m => m + 1);
      setSelectedDay(null);
    };

    const canGoNext = !(calYear === today.getFullYear() && calMonth === today.getMonth());

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Stats summary */}
        <View style={styles.summaryCard}>
          <LinearGradient colors={colors.gradients.primary} style={styles.summaryGradient}>
            <Text style={styles.summaryTitle}>Tu Viaje de Ánimo</Text>
            <Text style={styles.summarySubtitle}>{total} reflexión{total !== 1 ? 'es' : ''} registrada{total !== 1 ? 's' : ''}</Text>
            <View style={styles.moodStatsRow}>
              <MoodStat mood="great" count={resumen.great} />
              <MoodStat mood="good" count={resumen.good} />
              <MoodStat mood="neutral" count={resumen.neutral} />
              <MoodStat mood="low" count={resumen.low} />
              <MoodStat mood="bad" count={resumen.bad} />
            </View>
          </LinearGradient>
        </View>

        {/* Calendario */}
        <View style={[styles.calendarCard, { backgroundColor: palette.surface }]}>
          {/* Nav mes */}
          <View style={styles.calNavRow}>
            <TouchableOpacity onPress={prevMonth} style={[styles.calNavBtn, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name="chevron-back" size={20} color={palette.text} />
            </TouchableOpacity>
            <Text style={[styles.calMonthLabel, { color: palette.heading }]}>
              {MONTHS_ES[calMonth]} {calYear}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              style={[styles.calNavBtn, { backgroundColor: canGoNext ? palette.surfaceAlt : palette.bg }]}
              disabled={!canGoNext}
            >
              <Ionicons name="chevron-forward" size={20} color={canGoNext ? palette.text : palette.textSubtle} />
            </TouchableOpacity>
          </View>

          {/* Encabezados días */}
          <View style={styles.calWeekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={[styles.calWeekDay, { color: palette.textSubtle }]}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.calGrid}>
            {calDays.map((day, idx) => {
              if (!day) return <View key={idx} style={styles.calCell} />;

              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const reflex = reflexionByDate[dateStr];
              const isToday = dateStr === todayDateStr;
              const isSelected = selectedDay === dateStr;
              const isFuture = dateStr > todayDateStr;
              const moodCfg = reflex ? MOOD_CONFIG[reflex.estado_animo] : null;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.calCell,
                    isToday && { backgroundColor: colors.primary[50] },
                    isSelected && { backgroundColor: colors.primary[100] },
                  ]}
                  onPress={() => {
                    if (!isFuture && reflex) {
                      setSelectedDay(isSelected ? null : dateStr);
                    }
                  }}
                  disabled={isFuture || !reflex}
                  activeOpacity={0.7}
                >
                  {moodCfg ? (
                    <>
                      <Text style={[styles.calDayNum, { color: isSelected ? colors.primary[700] : palette.text }]}>{day}</Text>
                      <View style={[styles.calMoodDot, { backgroundColor: moodCfg.color }]} />
                    </>
                  ) : (
                    <Text style={[
                      styles.calDayNum,
                      { color: isFuture ? palette.textSubtle : palette.textMuted },
                      isToday && { color: colors.primary[600], fontWeight: typography.weight.bold },
                    ]}>
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Leyenda */}
          <View style={[styles.calLegend, { borderTopColor: palette.divider }]}>
            {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
              <View key={key} style={styles.calLegendItem}>
                <View style={[styles.calLegendDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.calLegendLabel, { color: palette.textMuted }]}>{cfg.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card seleccionada */}
        {selectedDay && selected && (
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: palette.heading, marginTop: spacing[4] }]}>
              {formatDateDisplay(selectedDay)}
            </Text>
            <ReflexionCard item={selected} />
          </View>
        )}

        {selectedDay && !selected && (
          <View style={[styles.emptyState, { paddingTop: spacing[6] }]}>
            <Ionicons name="calendar-outline" size={32} color={palette.iconSubtle} />
            <Text style={[styles.emptyTitle, { color: palette.text, fontSize: typography.size.base, marginTop: spacing[2] }]}>
              Sin reflexión ese día
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── Vista Lista ──────────────────────────────────────────────────────────────
  const ListaView = () => (
    <FlatList
      data={reflexionesFiltradas}
      keyExtractor={item => item.reflexion_id.toString()}
      renderItem={({ item }) => <ReflexionCard item={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <>
          {/* Stats summary */}
          <View style={styles.summaryCard}>
            <LinearGradient colors={colors.gradients.primary} style={styles.summaryGradient}>
              <Text style={styles.summaryTitle}>Tu Viaje de Ánimo</Text>
              <Text style={styles.summarySubtitle}>{total} reflexión{total !== 1 ? 'es' : ''} registrada{total !== 1 ? 's' : ''}</Text>
              <View style={styles.moodStatsRow}>
                <MoodStat mood="great" count={resumen.great} />
                <MoodStat mood="good" count={resumen.good} />
                <MoodStat mood="neutral" count={resumen.neutral} />
                <MoodStat mood="low" count={resumen.low} />
                <MoodStat mood="bad" count={resumen.bad} />
              </View>
            </LinearGradient>
          </View>

          {/* Filtros período */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ gap: spacing[2] }}>
            {[
              { key: 'todos',  label: 'Todos' },
              { key: 'semana', label: 'Esta semana' },
              { key: 'mes',    label: 'Este mes' },
            ].map(f => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                  periodo === f.key && styles.filterChipActive,
                ]}
                onPress={() => setPeriodo(f.key as PeriodoFiltro)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: palette.textMuted },
                  periodo === f.key && styles.filterChipTextActive,
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Separador visual */}
            <View style={[styles.filterSeparator, { backgroundColor: palette.border }]} />

            {/* Filtros mood */}
            {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                  moodFiltro === key && { backgroundColor: cfg.color + '20', borderColor: cfg.color },
                ]}
                onPress={() => setMoodFiltro(moodFiltro === key ? null : key)}
              >
                <Ionicons name={cfg.icon as any} size={14} color={moodFiltro === key ? cfg.color : palette.icon} />
                <Text style={[
                  styles.filterChipText,
                  { color: palette.textMuted },
                  moodFiltro === key && { color: cfg.color },
                ]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Conteo resultado */}
          {reflexionesFiltradas.length > 0 && (
            <Text style={[styles.sectionTitle, { color: palette.heading }]}>
              {reflexionesFiltradas.length} reflexión{reflexionesFiltradas.length !== 1 ? 'es' : ''}
              {periodo !== 'todos' || moodFiltro ? ' (filtrado)' : ''}
            </Text>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.surfaceAlt }]}>
            <Ionicons name="journal-outline" size={48} color={palette.iconSubtle} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            {periodo !== 'todos' || moodFiltro ? 'Sin resultados' : 'Sin reflexiones aún'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: palette.textMuted }]}>
            {periodo !== 'todos' || moodFiltro
              ? 'Prueba cambiando los filtros'
              : 'Comienza tu viaje de reflexión desde la pantalla de inicio'}
          </Text>
          {(periodo !== 'todos' || moodFiltro) && (
            <TouchableOpacity
              style={[styles.clearFilterBtn, { backgroundColor: palette.surfaceAlt }]}
              onPress={() => { setPeriodo('todos'); setMoodFiltro(null); }}
            >
              <Text style={[styles.clearFilterText, { color: palette.text }]}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );

  // ─── Render principal ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: palette.surfaceAlt }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.heading }]}>Reflexiones</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Toggle de vista */}
      <View style={[styles.viewToggleRow, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'lista' && [styles.viewToggleBtnActive, { borderBottomColor: colors.primary[600] }]]}
          onPress={() => setViewMode('lista')}
        >
          <Ionicons name="list" size={18} color={viewMode === 'lista' ? colors.primary[600] : palette.icon} />
          <Text style={[styles.viewToggleText, { color: viewMode === 'lista' ? colors.primary[600] : palette.textMuted }]}>
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'calendario' && [styles.viewToggleBtnActive, { borderBottomColor: colors.primary[600] }]]}
          onPress={() => setViewMode('calendario')}
        >
          <Ionicons name="calendar" size={18} color={viewMode === 'calendario' ? colors.primary[600] : palette.icon} />
          <Text style={[styles.viewToggleText, { color: viewMode === 'calendario' ? colors.primary[600] : palette.textMuted }]}>
            Calendario
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según vista */}
      {viewMode === 'lista' ? <ListaView /> : <CalendarioView />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },

  // Toggle
  viewToggleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewToggleBtnActive: {},
  viewToggleText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Lista
  listContent: {
    padding: spacing[5],
    paddingBottom: spacing[10],
  },

  // Filtros
  filtersRow: {
    marginBottom: spacing[4],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing[1],
  },
  filterChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.size.sm,
  },
  filterChipTextActive: {
    color: colors.primary[600],
    fontWeight: typography.weight.semibold,
  },
  filterSeparator: {
    width: 1,
    height: 28,
    alignSelf: 'center',
    marginHorizontal: spacing[1],
  },

  // Stats card
  summaryCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[5],
    ...shadows.md,
  },
  summaryGradient: { padding: spacing[5] },
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
  moodStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodStat: { alignItems: 'center' },
  moodStatIcon: {
    width: 36, height: 36,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  moodStatCount: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.neutral[0] },
  moodStatPercent: { fontSize: typography.size.xs, color: 'rgba(255,255,255,0.7)' },

  // Sección título
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[4],
  },

  // Cards de reflexión
  reflexionCard: {
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
  moodLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  reflexionDate: { fontSize: typography.size.sm },
  textSection: { marginBottom: spacing[2] },
  textLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContent: { fontSize: typography.size.sm, lineHeight: 20 },
  noNotesText: { fontSize: typography.size.sm, fontStyle: 'italic' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing[10] },
  emptyIcon: {
    width: 80, height: 80,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, marginBottom: spacing[2] },
  emptySubtitle: { fontSize: typography.size.sm, textAlign: 'center', marginBottom: spacing[4] },
  clearFilterBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  clearFilterText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },

  // Calendario
  calendarCard: {
    marginHorizontal: spacing[5],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  calNavBtn: {
    width: 36, height: 36,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calMonthLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  calWeekRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  calWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginBottom: 2,
  },
  calDayNum: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  calMoodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  calLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingTop: spacing[4],
    marginTop: spacing[2],
    borderTopWidth: 1,
    justifyContent: 'center',
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  calLegendDot: {
    width: 8, height: 8,
    borderRadius: 4,
  },
  calLegendLabel: {
    fontSize: typography.size.xs,
  },
});
