import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

interface RecommendationCardProps {
  habitoId: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  score: number;
  razon: string;
  onAgregar?: (habitoId: number) => void;
  onIgnorar?: (habitoId: number) => void;
  showIgnorar?: boolean;
  compact?: boolean;
}

export default function RecommendationCard({
  habitoId,
  nombre,
  descripcion,
  categoria,
  score,
  razon,
  onAgregar,
  onIgnorar,
  showIgnorar = false,
  compact = false,
}: RecommendationCardProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.content}>
        {/* Icono + */}
        <View style={styles.iconContainer}>
          <Ionicons name="add-circle" size={24} color={colors.primary[500]} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.nombre, compact && styles.nombreCompact]} numberOfLines={compact ? 1 : 2}>
            {nombre}
          </Text>
          
          {!compact && categoria && (
            <View style={styles.categoriaBadge}>
              <Text style={styles.categoriaText}>{categoria}</Text>
            </View>
          )}
          
          <Text style={styles.razon} numberOfLines={compact ? 1 : 2}>
            {razon}
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.actions}>
          {onAgregar && (
            <TouchableOpacity
              style={styles.agregarButton}
              onPress={() => onAgregar(habitoId)}
            >
              <Text style={styles.agregarText}>Add</Text>
            </TouchableOpacity>
          )}
          
          {showIgnorar && onIgnorar && (
            <TouchableOpacity
              style={styles.ignorarButton}
              onPress={() => onIgnorar(habitoId)}
            >
              <Ionicons name="close" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  containerCompact: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  info: {
    flex: 1,
  },
  nombre: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  nombreCompact: {
    fontSize: 14,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: 4,
  },
  categoriaText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.primary[600],
    textTransform: 'uppercase',
  },
  razon: {
    fontSize: 12,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  agregarButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  agregarText: {
    color: colors.neutral[0],
    fontWeight: '600',
    fontSize: 13,
  },
  ignorarButton: {
    padding: spacing.xs,
  },
});
