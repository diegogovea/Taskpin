-- ============================================
-- MIGRACIÓN 002: Soporte para Hábitos Personalizados
-- Fecha: 2026-01-26
-- Descripción: Categoría "My Custom Habits" y campos para hábitos custom
-- ============================================

-- ============================================
-- PARTE A: Nueva categoría para hábitos personalizados
-- ============================================

-- Insertar categoría 6: My Custom Habits
INSERT INTO categorias_habitos (nombre, descripcion, icono, orden) 
VALUES (
    'My Custom Habits', 
    'Hábitos personalizados creados por el usuario', 
    '✨',
    6
)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- PARTE B: Nuevos campos en habitos_predeterminados
-- ============================================

-- Añadir campo para identificar hábitos personalizados
ALTER TABLE habitos_predeterminados 
ADD COLUMN IF NOT EXISTS es_personalizado BOOLEAN DEFAULT false;

-- Añadir campo para saber qué usuario creó el hábito (NULL = predeterminado del sistema)
ALTER TABLE habitos_predeterminados 
ADD COLUMN IF NOT EXISTS creado_por_user_id INTEGER DEFAULT NULL;

-- Foreign key al usuario creador (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_creado_por_user' 
        AND table_name = 'habitos_predeterminados'
    ) THEN
        ALTER TABLE habitos_predeterminados 
        ADD CONSTRAINT fk_creado_por_user 
        FOREIGN KEY (creado_por_user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Índice para buscar hábitos custom de un usuario específico
CREATE INDEX IF NOT EXISTS idx_habitos_custom_user 
ON habitos_predeterminados(creado_por_user_id) 
WHERE es_personalizado = true;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Comentarios descriptivos
COMMENT ON COLUMN habitos_predeterminados.es_personalizado IS 'true = hábito creado por usuario, false = hábito del sistema';
COMMENT ON COLUMN habitos_predeterminados.creado_por_user_id IS 'ID del usuario que creó el hábito (NULL para hábitos del sistema)';
