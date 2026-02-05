/**
 * WebSocket Notification Component
 * =================================
 * Shows real-time notifications when habits are completed.
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface WSNotificationProps {
  visible: boolean;
  type: 'habit_completed' | 'habit_uncompleted' | 'info';
  message: string;
  points?: number;
  streak?: number;
  onHide: () => void;
  duration?: number;
}

export default function WSNotification({
  visible,
  type,
  message,
  points,
  streak,
  onHide,
  duration = 3000,
}: WSNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'habit_completed':
        return {
          icon: 'checkmark-circle',
          iconColor: '#22C55E',
          bgColor: '#ECFDF5',
          borderColor: '#22C55E',
        };
      case 'habit_uncompleted':
        return {
          icon: 'close-circle',
          iconColor: '#F59E0B',
          bgColor: '#FFFBEB',
          borderColor: '#F59E0B',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: colors.primary,
          bgColor: '#EEF2FF',
          borderColor: colors.primary,
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.bgColor,
          borderLeftColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon as any} size={28} color={config.iconColor} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        
        {(points !== undefined || streak !== undefined) && (
          <View style={styles.statsRow}>
            {points !== undefined && (
              <View style={styles.statBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.statText}>+{points} pts</Text>
              </View>
            )}
            {streak !== undefined && streak > 0 && (
              <View style={styles.statBadge}>
                <Ionicons name="flame" size={12} color="#EF4444" />
                <Text style={styles.statText}>{streak} day streak</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    ...shadows.md,
    zIndex: 9999,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statText: {
    fontSize: typography.size.xs,
    fontWeight: '500',
    color: colors.neutral[500],
  },
});
