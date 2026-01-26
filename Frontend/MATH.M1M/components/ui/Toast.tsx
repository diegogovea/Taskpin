/**
 * Toast - Non-intrusive notification component
 * 
 * A beautiful, auto-dismissing toast notification for success, error, warning, and info messages.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  position?: 'top' | 'bottom';
}

// Configuration for each toast type
const toastConfig: Record<ToastType, { 
  icon: keyof typeof Ionicons.glyphMap; 
  backgroundColor: string;
  iconColor: string;
}> = {
  success: {
    icon: 'checkmark-circle',
    backgroundColor: colors.secondary[500],
    iconColor: colors.neutral[0],
  },
  error: {
    icon: 'close-circle',
    backgroundColor: colors.semantic.error,
    iconColor: colors.neutral[0],
  },
  warning: {
    icon: 'warning',
    backgroundColor: colors.semantic.warning,
    iconColor: colors.neutral[900],
  },
  info: {
    icon: 'information-circle',
    backgroundColor: colors.semantic.info,
    iconColor: colors.neutral[0],
  },
};

export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
  position = 'top',
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = toastConfig[type];

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const positionStyle = position === 'top' 
    ? { top: insets.top + spacing[2] }
    : { bottom: insets.bottom + spacing[2] };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: config.backgroundColor }]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Ionicons 
          name={config.icon} 
          size={22} 
          color={config.iconColor} 
        />
        <Text 
          style={[
            styles.message, 
            { color: config.iconColor }
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.xl,
    maxWidth: Math.min(400, SCREEN_WIDTH - 32),
    width: '100%',
    gap: spacing[3],
    ...shadows.lg,
  },
  message: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
});
