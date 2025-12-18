/**
 * TASKPIN - Color System
 * 
 * This file maintains backwards compatibility with the original Colors export
 * while also exporting the new theme system.
 * 
 * For new code, prefer importing from './theme' directly:
 * import { colors, typography, spacing } from '../constants/theme';
 */

// Re-export everything from the new theme system
export * from './theme';
export { default as theme } from './theme';

// Legacy Colors export for backwards compatibility
const tintColorLight = '#8B5CF6'; // Updated to match new primary
const tintColorDark = '#A78BFA';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F1F5F9',
    background: '#0F172A',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
  },
};
