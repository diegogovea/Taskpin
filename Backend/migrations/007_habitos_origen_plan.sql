-- Migration 007: Agregar campo origen_plan_id a habitos_usuario
-- Para saber si un hábito fue agregado desde un plan

-- =====================================================
-- CAMPO: origen_plan_id
-- =====================================================
-- Permite rastrear de qué plan vino un hábito.
-- NULL = agregado manualmente por el usuario
-- plan_usuario_id = agregado desde ese plan

ALTER TABLE habitos_usuario 
ADD COLUMN IF NOT EXISTS origen_plan_id INT NULL 
REFERENCES planes_usuario(plan_usuario_id) ON DELETE SET NULL;

-- Índice para consultas por origen
CREATE INDEX IF NOT EXISTS idx_habitos_usuario_origen_plan 
ON habitos_usuario(origen_plan_id) 
WHERE origen_plan_id IS NOT NULL;

-- Comentario
COMMENT ON COLUMN habitos_usuario.origen_plan_id IS 'Plan desde el cual se agregó el hábito (NULL si fue manual)';
