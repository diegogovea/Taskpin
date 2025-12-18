/**
 * TASKPIN - Modern Design System
 * A sophisticated, minimal design system for a professional look
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary - Deep Violet (more sophisticated than bright purple)
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Secondary - Emerald (fresh, modern green)
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Neutral - Slate (sophisticated grays)
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Accent colors
  accent: {
    amber: '#F59E0B',
    orange: '#F97316',
    rose: '#F43F5E',
    cyan: '#06B6D4',
    indigo: '#6366F1',
  },

  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Gradients (as arrays for LinearGradient)
  gradients: {
    primary: ['#8B5CF6', '#6D28D9'],
    primarySoft: ['#A78BFA', '#8B5CF6'],
    secondary: ['#10B981', '#059669'],
    secondarySoft: ['#34D399', '#10B981'],
    warm: ['#F59E0B', '#D97706'],
    cool: ['#06B6D4', '#0891B2'],
    sunset: ['#F43F5E', '#F97316'],
    aurora: ['#8B5CF6', '#06B6D4'],
    card: ['#FFFFFF', '#F8FAFC'],
  },
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights (as strings for React Native)
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// ============================================
// SPACING (8px base grid)
// ============================================

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
};

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ============================================
// SHADOWS (iOS & Android)
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored shadows
  primary: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  success: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ============================================
// ANIMATION DURATIONS
// ============================================

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

// ============================================
// COMMON STYLE PRESETS
// ============================================

export const presets = {
  // Cards
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
    ...shadows.sm,
  },

  cardElevated: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing[5],
    ...shadows.md,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    ...shadows.primary,
  },

  buttonSecondary: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },

  // Inputs
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: typography.size.base,
    color: colors.neutral[900],
  },

  inputFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.neutral[0],
  },

  // Tags/Badges
  badge: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
  },

  // Icon containers
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  iconContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};

// ============================================
// TEXT STYLES
// ============================================

export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  h4: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },

  // Body text
  bodyLarge: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.regular,
    color: colors.neutral[700],
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
  },
  body: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    color: colors.neutral[600],
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.neutral[500],
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },

  // Labels
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.wider,
  },

  // Links
  link: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary[600],
  },

  // Button text
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
  buttonTextSecondary: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
};

// Default export for convenience
const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animation,
  presets,
  textStyles,
};

export default theme;
