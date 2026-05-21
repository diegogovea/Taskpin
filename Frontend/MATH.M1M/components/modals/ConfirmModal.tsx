import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmGradient?: readonly [string, string, ...string[]];
  isLoading?: boolean;
  danger?: boolean;
}

export default function ConfirmModal({
  visible, title, message, onConfirm, onCancel,
  confirmText = 'Confirmar', cancelText = 'Cancelar',
  icon = 'help-circle-outline', iconColor, confirmGradient,
  isLoading = false, danger = false,
}: ConfirmModalProps) {
  const { palette } = useTheme();

  const finalIconColor = iconColor || (danger ? colors.semantic.error : colors.primary[600]);
  const finalGradient: readonly [string, string, ...string[]] = confirmGradient || (danger
    ? [colors.semantic.error, '#DC2626'] as const
    : colors.gradients.primary as readonly [string, string, ...string[]]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: palette.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: finalIconColor + '15' }]}>
            <Ionicons name={icon} size={32} color={finalIconColor} />
          </View>
          <Text style={[styles.title, { color: palette.heading }]}>{title}</Text>
          <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: palette.surfaceAlt }]}
              onPress={onCancel} disabled={isLoading} activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: palette.textMuted }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} disabled={isLoading} activeOpacity={0.8}>
              <LinearGradient colors={finalGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmButtonGradient}>
                {isLoading
                  ? <ActivityIndicator size="small" color={colors.neutral[0]} />
                  : <Text style={styles.confirmButtonText}>{confirmText}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing[5] },
  container: { borderRadius: radius['2xl'], padding: spacing[6], width: '100%', maxWidth: Math.min(340, SCREEN_WIDTH - 40), alignItems: 'center', ...shadows.xl },
  iconContainer: { width: 64, height: 64, borderRadius: radius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[4] },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, textAlign: 'center', marginBottom: spacing[2] },
  message: { fontSize: typography.size.base, textAlign: 'center', lineHeight: 22, marginBottom: spacing[6], paddingHorizontal: spacing[2] },
  buttonContainer: { flexDirection: 'row', gap: spacing[3], width: '100%' },
  cancelButton: { flex: 1, paddingVertical: spacing[4], borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  confirmButton: { flex: 1, borderRadius: radius.xl, overflow: 'hidden' },
  confirmButtonGradient: { paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[0] },
});
