import { colors } from './theme';

/**
 * Devuelve el color asociado a una categoría de hábito.
 * Compatible con los IDs de categoría devueltos por el backend.
 */
export function getCategoryColor(categoriaId?: number): string {
  switch (categoriaId) {
    case 1: return colors.secondary[600];   // Bienestar Diario
    case 2: return colors.accent.amber;      // Energía y Movimiento
    case 3: return colors.primary[600];      // Mente y Enfoque
    case 4: return colors.accent.cyan;       // Organización del Hogar
    case 5: return colors.accent.rose;       // Finanzas Personales
    case 6: return colors.primary[400];      // Mis Hábitos Personalizados
    default: return colors.primary[600];
  }
}

/** Traduce nombres de categoría que vienen en inglés del backend */
export function traducirCategoria(nombre?: string | null): string {
  if (!nombre) return '';
  if (nombre === 'My Custom Habits') return 'Hábito personalizado';
  return nombre;
}

/** Map de nombre de categoría → color (fallback cuando no hay categoria_id) */
export function getCategoryColorByName(nombre?: string): string {
  if (!nombre) return colors.primary[600];
  const n = nombre.toLowerCase();
  if (n.includes('bienestar') || n.includes('wellness')) return colors.secondary[600];
  if (n.includes('energ') || n.includes('movimiento')) return colors.accent.amber;
  if (n.includes('mente') || n.includes('enfoque') || n.includes('mind')) return colors.primary[600];
  if (n.includes('hogar') || n.includes('organiz')) return colors.accent.cyan;
  if (n.includes('finanz') || n.includes('personal')) return colors.accent.rose;
  if (n.includes('custom') || n.includes('personaliz')) return colors.primary[400];
  return colors.primary[600];
}
