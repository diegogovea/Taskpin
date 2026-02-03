import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_MIN_WIDTH = SCREEN_WIDTH * 2; // Mínimo 2x el ancho de pantalla

// Interfaces
interface Fase {
  objetivo_id: number;
  titulo: string;
  descripcion?: string;
  orden_fase: number;
  dia_inicio: number;
  dia_fin: number;
  duracion_dias: number;
  estado: 'completada' | 'en_progreso' | 'atrasada' | 'pendiente';
  porcentaje_completado: number;
  tareas_completadas: number;
  tareas_total: number;
}

interface PlanInfo {
  dias_totales: number;
  dia_actual: number;
  dias_restantes: number;
}

interface PlanTimelineProps {
  planInfo: PlanInfo;
  fases: Fase[];
  onFasePress?: (faseId: number) => void;
}

// Colores según estado
const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'completada':
      return colors.secondary[500]; // Verde
    case 'en_progreso':
      return colors.primary[500]; // Azul
    case 'atrasada':
      return colors.semantic.error; // Rojo
    default:
      return colors.neutral[300]; // Gris
  }
};

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case 'completada':
      return 'checkmark-circle';
    case 'en_progreso':
      return 'play-circle';
    case 'atrasada':
      return 'alert-circle';
    default:
      return 'ellipse-outline';
  }
};

export default function PlanTimeline({ planInfo, fases, onFasePress }: PlanTimelineProps) {
  const { dias_totales, dia_actual } = planInfo;
  
  // Calcular ancho del timeline basado en días totales
  const timelineWidth = Math.max(TIMELINE_MIN_WIDTH, dias_totales * 8);
  
  // Posición del indicador de hoy (como porcentaje)
  const todayPosition = Math.min(100, (dia_actual / dias_totales) * 100);
  
  // Calcular el ancho de cada fase como porcentaje
  const getFaseWidth = (duracion: number) => {
    return (duracion / dias_totales) * 100;
  };
  
  // Calcular la posición de inicio de cada fase
  const getFaseLeft = (diaInicio: number) => {
    return ((diaInicio - 1) / dias_totales) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Header con info del día actual */}
      <View style={styles.header}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayLabel}>Current Day</Text>
          <Text style={styles.dayValue}>{dia_actual}</Text>
          <Text style={styles.dayTotal}>of {dias_totales}</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>{planInfo.dias_restantes} days remaining</Text>
        </View>
      </View>

      {/* Timeline scrolleable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={[styles.timelineContent, { width: timelineWidth }]}
        style={styles.timelineScroll}
      >
        {/* Barra de fondo del timeline */}
        <View style={styles.timelineTrack}>
          {/* Fases */}
          {fases.map((fase, index) => {
            const faseWidth = getFaseWidth(fase.duracion_dias);
            const faseLeft = getFaseLeft(fase.dia_inicio);
            const estadoColor = getEstadoColor(fase.estado);
            
            return (
              <TouchableOpacity
                key={fase.objetivo_id}
                style={[
                  styles.faseBar,
                  {
                    width: `${faseWidth}%`,
                    left: `${faseLeft}%`,
                    backgroundColor: estadoColor + '30',
                    borderColor: estadoColor,
                  },
                ]}
                onPress={() => onFasePress?.(fase.objetivo_id)}
                activeOpacity={0.7}
              >
                {/* Barra de progreso dentro de la fase */}
                <View 
                  style={[
                    styles.faseProgress,
                    { 
                      width: `${fase.porcentaje_completado}%`,
                      backgroundColor: estadoColor,
                    }
                  ]} 
                />
                
                {/* Label de la fase (si cabe) */}
                {faseWidth > 10 && (
                  <View style={styles.faseLabelContainer}>
                    <Text style={styles.faseLabel} numberOfLines={1}>
                      {fase.titulo}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          
          {/* Indicador del día actual */}
          <View style={[styles.todayIndicator, { left: `${todayPosition}%` }]}>
            <View style={styles.todayLine} />
            <View style={styles.todayDot} />
          </View>
        </View>
        
        {/* Marcas de días cada 7 días */}
        <View style={styles.daysMarkers}>
          {Array.from({ length: Math.ceil(dias_totales / 7) + 1 }, (_, i) => {
            const day = i * 7 || 1;
            if (day > dias_totales) return null;
            const position = ((day - 1) / dias_totales) * 100;
            return (
              <View key={day} style={[styles.dayMarker, { left: `${position}%` }]}>
                <Text style={styles.dayMarkerText}>{day}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Leyenda de fases */}
      <View style={styles.legend}>
        {fases.map((fase) => {
          const estadoColor = getEstadoColor(fase.estado);
          const estadoIcon = getEstadoIcon(fase.estado);
          
          return (
            <TouchableOpacity
              key={fase.objetivo_id}
              style={styles.legendItem}
              onPress={() => onFasePress?.(fase.objetivo_id)}
            >
              <View style={styles.legendHeader}>
                <Ionicons name={estadoIcon as any} size={18} color={estadoColor} />
                <Text style={styles.legendTitle} numberOfLines={1}>
                  {fase.titulo}
                </Text>
              </View>
              <View style={styles.legendDetails}>
                <Text style={styles.legendDays}>
                  Days {fase.dia_inicio}-{fase.dia_fin}
                </Text>
                <Text style={[styles.legendProgress, { color: estadoColor }]}>
                  {fase.porcentaje_completado}%
                </Text>
              </View>
              <View style={styles.legendTasks}>
                <Ionicons name="checkbox-outline" size={12} color={colors.neutral[500]} />
                <Text style={styles.legendTasksText}>
                  {fase.tareas_completadas}/{fase.tareas_total} tasks
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
  },
  dayLabel: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginRight: spacing[1],
  },
  dayValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.primary[600],
  },
  dayTotal: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  progressInfo: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
  },
  progressLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },
  timelineScroll: {
    marginBottom: spacing[4],
  },
  timelineContent: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  timelineTrack: {
    height: 60,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    position: 'relative',
    overflow: 'visible',
  },
  faseBar: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: radius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  faseProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.5,
  },
  faseLabelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  faseLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  todayIndicator: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    width: 2,
    alignItems: 'center',
    zIndex: 10,
  },
  todayLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.semantic.error,
  },
  todayDot: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.semantic.error,
    borderWidth: 2,
    borderColor: colors.neutral[0],
  },
  daysMarkers: {
    position: 'relative',
    height: 24,
    marginTop: spacing[2],
  },
  dayMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  dayMarkerText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  legend: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
  },
  legendItem: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[3],
    ...shadows.sm,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  legendTitle: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  legendDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  legendDays: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
  },
  legendProgress: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  legendTasks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendTasksText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
});
