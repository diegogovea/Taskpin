import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius } from "../../constants/theme";

interface HistorialDia {
  fecha: string;
  completado: boolean;
}

interface HabitCalendarProps {
  historial: HistorialDia[];
  onDayPress?: (fecha: string, completado: boolean) => void;
  onMonthChange?: (year: number, month: number) => void;
  completedColor?: string;
  missedColor?: string;
  todayBorderColor?: string;
}

interface CalendarDay {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HabitCalendar: React.FC<HabitCalendarProps> = ({
  historial,
  onDayPress,
  onMonthChange,
  completedColor = colors.secondary[500],
  missedColor = colors.neutral[200],
  todayBorderColor = colors.primary[500],
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Convertir historial a Map para lookup rápido
  const historialMap = useMemo(() => {
    const map = new Map<string, boolean>();
    historial.forEach(d => map.set(d.fecha, d.completado));
    return map;
  }, [historial]);

  // Obtener año y mes actual del calendario
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Generar días del calendario
  const calendarDays = useMemo((): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Primer día del mes
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Último día del mes
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Día de la semana del primer día (0=domingo, ajustar a lunes=0)
    let startWeekday = firstDayOfMonth.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6; // Domingo -> 6
    
    // Días del mes anterior para rellenar
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        date: formatDate(date),
        dayNumber: day,
        isToday: false,
        isFuture: date > today,
        isCurrentMonth: false,
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date: formatDate(date),
        dayNumber: day,
        isToday: date.getTime() === today.getTime(),
        isFuture: date > today,
        isCurrentMonth: true,
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(currentYear, currentMonth + 1, day);
        days.push({
          date: formatDate(date),
          dayNumber: day,
          isToday: false,
          isFuture: date > today,
          isCurrentMonth: false,
        });
      }
    }
    
    return days;
  }, [currentYear, currentMonth]);

  // Formatear fecha a ISO string (YYYY-MM-DD)
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Navegar al mes anterior
  const goToPrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
  };

  // Renderizar celda de día
  const renderDayCell = (day: CalendarDay, index: number) => {
    const completado = historialMap.get(day.date);
    
    // Determinar estilos
    let backgroundColor = 'transparent';
    let textColor = colors.neutral[800];
    let borderColor = 'transparent';
    let borderWidth = 0;
    let showCheck = false;
    
    if (!day.isCurrentMonth) {
      // Día de otro mes
      backgroundColor = colors.neutral[50];
      textColor = colors.neutral[300];
    } else if (day.isFuture) {
      // Día futuro
      backgroundColor = colors.neutral[50];
      textColor = colors.neutral[300];
    } else if (completado === true) {
      // Completado
      backgroundColor = completedColor;
      textColor = colors.neutral[0];
      showCheck = true;
    } else if (completado === false) {
      // No completado (tiene registro pero no completado)
      backgroundColor = missedColor;
      textColor = colors.neutral[600];
    } else {
      // Sin registro (días antes de agregar el hábito)
      backgroundColor = colors.neutral[100];
      textColor = colors.neutral[400];
    }
    
    // Highlight para hoy
    if (day.isToday) {
      borderColor = todayBorderColor;
      borderWidth = 2;
    }
    
    return (
      <TouchableOpacity
        key={`${day.date}-${index}`}
        style={[
          styles.dayCell,
          { backgroundColor, borderColor, borderWidth }
        ]}
        onPress={() => {
          if (day.isCurrentMonth && !day.isFuture && completado !== undefined) {
            onDayPress?.(day.date, completado);
          }
        }}
        disabled={!day.isCurrentMonth || day.isFuture}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayNumber, { color: textColor }]}>
          {day.dayNumber}
        </Text>
        {showCheck && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark" size={10} color={colors.neutral[0]} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con navegación */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      {/* Días de la semana */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid del calendario */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => renderDayCell(day, index))}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: completedColor }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: missedColor }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 2, borderColor: todayBorderColor }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[800],
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[2],
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayNumber: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  checkIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
});

export default HabitCalendar;
