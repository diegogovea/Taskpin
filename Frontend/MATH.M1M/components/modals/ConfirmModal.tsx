/**
 * ConfirmModal - Reusable Confirmation Modal
 * 
 * A beautiful, customizable modal for confirming user actions.
 * Supports normal and danger modes with loading states.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfirmModalProps {
  // Control
  visible: boolean;
  
  // Content
  title: string;
  message: string;
  
  // Callbacks
  onConfirm: () => void;
  onCancel: () => void;
  
  // Customization (optional)
  confirmText?: string;
  cancelText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmGradient?: readonly [string, string, ...string[]];
  isLoading?: boolean;
  danger?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon = 'help-circle-outline',
  iconColor,
  confirmGradient,
  isLoading = false,
  danger = false,
}: ConfirmModalProps) {
  
  // Determine colors based on danger mode
  const finalIconColor = iconColor || (danger ? colors.semantic.error : colors.primary[600]);
  const finalGradient: readonly [string, string, ...string[]] = confirmGradient || (danger 
    ? [colors.semantic.error, '#DC2626'] as const
    : colors.gradients.primary as readonly [string, string, ...string[]]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[
            styles.iconContainer, 
            { backgroundColor: finalIconColor + '15' }
          ]}>
            <Ionicons 
              name={icon} 
              size={32} 
              color={finalIconColor} 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={finalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.neutral[0]} />
                ) : (
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // neutral[900] with opacity
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius['2xl'],
    padding: spacing[6],
    width: '100%',
    maxWidth: Math.min(340, SCREEN_WIDTH - 40),
    alignItems: 'center',
    ...shadows.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
    paddingHorizontal: spacing[2],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[600],
  },
  confirmButton: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
