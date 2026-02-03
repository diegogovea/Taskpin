-- =============================================
-- MIGRACIÓN 009: Planes Personalizados
-- Permite a los usuarios crear sus propios planes
-- =============================================

-- Agregar campos para identificar planes personalizados
ALTER TABLE planes_predeterminados 
ADD COLUMN IF NOT EXISTS es_personalizado BOOLEAN DEFAULT false;

ALTER TABLE planes_predeterminados 
ADD COLUMN IF NOT EXISTS creado_por_user_id INT NULL REFERENCES usuarios(user_id) ON DELETE SET NULL;

ALTER TABLE planes_predeterminados 
ADD COLUMN IF NOT EXISTS es_publico BOOLEAN DEFAULT false;

ALTER TABLE planes_predeterminados 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Índice para buscar planes de un usuario
CREATE INDEX IF NOT EXISTS idx_planes_creado_por 
ON planes_predeterminados(creado_por_user_id) 
WHERE creado_por_user_id IS NOT NULL;

-- Índice para planes públicos (compartidos)
CREATE INDEX IF NOT EXISTS idx_planes_publicos 
ON planes_predeterminados(es_publico) 
WHERE es_publico = true;

-- Comentarios
COMMENT ON COLUMN planes_predeterminados.es_personalizado IS 'true si fue creado por un usuario, false si es del sistema';
COMMENT ON COLUMN planes_predeterminados.creado_por_user_id IS 'Usuario que creó el plan (NULL si es del sistema)';
COMMENT ON COLUMN planes_predeterminados.es_publico IS 'Si otros usuarios pueden usar este plan';
COMMENT ON COLUMN planes_predeterminados.created_at IS 'Fecha de creación del plan';

-- Marcar planes existentes como del sistema
UPDATE planes_predeterminados 
SET es_personalizado = false, es_publico = true 
WHERE es_personalizado IS NULL;
