/**
 * DateStrip
 *
 * Barra horizontal scrollable de fechas centrada en el día de hoy.
 * Muestra 7 días pasados + hoy + 6 días futuros (14 total).
 * Al tocar una fecha llama a onDateChange(fecha: Date).
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius } from "../../constants/theme";

interface DateStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_PAST = 7;
const DAYS_FUTURE = 6;
const TOTAL_DAYS = DAYS_PAST + 1 + DAYS_FUTURE; // 14

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function isFuture(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return target > today;
}

export default function DateStrip({ selectedDate, onDateChange }: DateStripProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Generar el array de fechas
  const today = new Date();
  const dates: Date[] = [];
  for (let i = -DAYS_PAST; i <= DAYS_FUTURE; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  // Scroll al índice de hoy (DAYS_PAST) al montar
  useEffect(() => {
    // Cada chip tiene ancho 52 + gap 8 = 60px. Centramos aproximadamente.
    const CHIP_WIDTH = 60;
    const offset = DAYS_PAST * CHIP_WIDTH - 120; // centrado visible
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
    }, 80);
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {dates.map((date, idx) => {
        const selected = isSameDay(date, selectedDate);
        const todayMark = isToday(date);
        const future = isFuture(date);

        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.75}
            onPress={() => onDateChange(date)}
            style={[styles.chip, future && styles.chipFuture]}
          >
            {selected ? (
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chipGradient}
              >
                <Text style={styles.dayNameSelected}>
                  {DAYS_ES[date.getDay()]}
                </Text>
                <Text style={styles.dayNumSelected}>{date.getDate()}</Text>
                {todayMark && <View style={styles.todayDotSelected} />}
              </LinearGradient>
            ) : (
              <View style={styles.chipInner}>
                <Text style={[styles.dayName, future && styles.dayNameFuture]}>
                  {DAYS_ES[date.getDay()]}
                </Text>
                <Text style={[styles.dayNum, future && styles.dayNumFuture]}>
                  {date.getDate()}
                </Text>
                {todayMark && <View style={styles.todayDot} />}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  chip: {
    width: 52,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  chipFuture: {
    opacity: 0.45,
  },
  chipGradient: {
    alignItems: "center",
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
  },
  chipInner: {
    alignItems: "center",
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  dayName: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  dayNameSelected: {
    fontSize: 10,
    fontWeight: typography.weight.semibold,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  dayNameFuture: {
    color: colors.neutral[300],
  },
  dayNum: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.neutral[700],
  },
  dayNumSelected: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.neutral[0],
  },
  dayNumFuture: {
    color: colors.neutral[400],
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary[400],
    marginTop: 3,
  },
  todayDotSelected: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },
});
