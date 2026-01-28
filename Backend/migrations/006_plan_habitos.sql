-- Migration 006: Crear tabla plan_habitos
-- Vincula hábitos del usuario a sus planes activos

-- =====================================================
-- TABLA: plan_habitos
-- =====================================================
-- Permite que un usuario vincule sus hábitos existentes
-- a un plan que está siguiendo, para que los hábitos
-- apoyen las metas del plan.

CREATE TABLE IF NOT EXISTS plan_habitos (
    plan_habito_id SERIAL PRIMARY KEY,
    
    -- Relaciones principales
    plan_usuario_id INT NOT NULL REFERENCES planes_usuario(plan_usuario_id) ON DELETE CASCADE,
    habito_usuario_id INT NOT NULL REFERENCES habitos_usuario(habito_usuario_id) ON DELETE CASCADE,
    
    -- Opcional: vincular solo a una fase específica del plan
    objetivo_id INT NULL REFERENCES objetivos_intermedios(objetivo_id) ON DELETE SET NULL,
    
    -- Metadatos
    obligatorio BOOLEAN DEFAULT false,  -- ¿Es requerido para completar el plan?
    notas TEXT NULL,                    -- Notas opcionales sobre por qué se vinculó
    fecha_vinculado TIMESTAMP DEFAULT NOW(),
    
    -- Evitar duplicados: un hábito solo puede vincularse una vez al mismo plan
    UNIQUE(plan_usuario_id, habito_usuario_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Para consultas rápidas por plan
CREATE INDEX IF NOT EXISTS idx_plan_habitos_plan 
ON plan_habitos(plan_usuario_id);

-- Para consultas rápidas por hábito
CREATE INDEX IF NOT EXISTS idx_plan_habitos_habito 
ON plan_habitos(habito_usuario_id);

-- Para filtrar por fase (cuando se use)
CREATE INDEX IF NOT EXISTS idx_plan_habitos_objetivo 
ON plan_habitos(objetivo_id) 
WHERE objetivo_id IS NOT NULL;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE plan_habitos IS 'Vincula hábitos del usuario a planes activos';
COMMENT ON COLUMN plan_habitos.plan_usuario_id IS 'Plan del usuario (FK a planes_usuario)';
COMMENT ON COLUMN plan_habitos.habito_usuario_id IS 'Hábito del usuario (FK a habitos_usuario)';
COMMENT ON COLUMN plan_habitos.objetivo_id IS 'Fase específica donde aplica el hábito (opcional)';
COMMENT ON COLUMN plan_habitos.obligatorio IS 'Si el hábito es requerido para el plan';
COMMENT ON COLUMN plan_habitos.notas IS 'Notas sobre por qué se vinculó este hábito';
