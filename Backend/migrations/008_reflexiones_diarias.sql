-- =============================================
-- MIGRACIÓN 008: Reflexiones Diarias
-- Permite a los usuarios escribir reflexiones diarias sobre su día
-- =============================================

-- Tabla principal de reflexiones
CREATE TABLE IF NOT EXISTS reflexiones_diarias (
    reflexion_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(user_id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_animo VARCHAR(20) NOT NULL,  -- 'great', 'good', 'neutral', 'low', 'bad'
    que_salio_bien TEXT,
    que_mejorar TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Solo una reflexión por día por usuario
    UNIQUE(user_id, fecha)
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_reflexiones_user ON reflexiones_diarias(user_id);
CREATE INDEX IF NOT EXISTS idx_reflexiones_fecha ON reflexiones_diarias(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_reflexiones_user_fecha ON reflexiones_diarias(user_id, fecha DESC);

-- Comentarios
COMMENT ON TABLE reflexiones_diarias IS 'Reflexiones diarias de los usuarios sobre su progreso y bienestar';
COMMENT ON COLUMN reflexiones_diarias.estado_animo IS 'Estado de ánimo: great, good, neutral, low, bad';
COMMENT ON COLUMN reflexiones_diarias.que_salio_bien IS 'Lo que salió bien durante el día (opcional)';
COMMENT ON COLUMN reflexiones_diarias.que_mejorar IS 'Lo que podría mejorar (opcional)';
