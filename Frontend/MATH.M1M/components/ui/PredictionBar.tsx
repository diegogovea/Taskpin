import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../constants/theme';

interface PredictionBarProps {
  nombre: string;
  probabilidad: number;
  factoresPositivos?: string[];
  factoresNegativos?: string[];
  showFactors?: boolean;
  compact?: boolean;
}

export default function PredictionBar({
  nombre,
  probabilidad,
  factoresPositivos = [],
  factoresNegativos = [],
  showFactors = true,
  compact = false,
}: PredictionBarProps) {
  // Color basado en probabilidad
  const getBarColor = () => {
    if (probabilidad >= 0.8) return colors.secondary[500]; // Verde
    if (probabilidad >= 0.5) return colors.accent.amber;   // Amarillo
    return colors.semantic.error;                          // Rojo
  };

  const porcentaje = Math.round(probabilidad * 100);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.header}>
        <Text style={[styles.nombre, compact && styles.nombreCompact]} numberOfLines={1}>
          {nombre}
        </Text>
        <Text style={[styles.porcentaje, { color: getBarColor() }]}>
          {porcentaje}%
        </Text>
      </View>
      
      {/* Barra de progreso */}
      <View style={styles.barContainer}>
        <View 
          style={[
            styles.barFill, 
            { 
              width: `${porcentaje}%`,
              backgroundColor: getBarColor() 
            }
          ]} 
        />
      </View>

      {/* Factores (solo si showFactors y no compact) */}
      {showFactors && !compact && (factoresPositivos.length > 0 || factoresNegativos.length > 0) && (
        <View style={styles.factoresContainer}>
          {factoresPositivos.slice(0, 2).map((factor, idx) => (
            <View key={`pos-${idx}`} style={styles.factorBadge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.secondary[500]} />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
          {factoresNegativos.slice(0, 1).map((factor, idx) => (
            <View key={`neg-${idx}`} style={styles.factorBadge}>
              <Ionicons name="alert-circle" size={12} color={colors.accent.amber} />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  containerCompact: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nombre: {
    ...typography.body,
    fontWeight: '500',
    color: colors.neutral[800],
    flex: 1,
    marginRight: spacing.sm,
  },
  nombreCompact: {
    fontSize: 14,
  },
  porcentaje: {
    ...typography.body,
    fontWeight: '700',
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  factoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  factorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  factorText: {
    fontSize: 11,
    color: colors.neutral[600],
  },
});
