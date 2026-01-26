-- ============================================
-- MIGRACIÓN 001: Tabla estadisticas_usuario
-- Fecha: 2026-01-26
-- Descripción: Sistema de puntos, rachas y niveles
-- ============================================

-- Crear tabla de estadísticas del usuario
CREATE TABLE IF NOT EXISTS estadisticas_usuario (
    estadistica_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    puntos_totales INTEGER DEFAULT 0,
    racha_actual INTEGER DEFAULT 0,
    racha_maxima INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    ultima_actividad DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE,
    
    -- Constraints de validación
    CONSTRAINT chk_puntos_no_negativo CHECK (puntos_totales >= 0),
    CONSTRAINT chk_racha_no_negativa CHECK (racha_actual >= 0),
    CONSTRAINT chk_racha_max_no_negativa CHECK (racha_maxima >= 0),
    CONSTRAINT chk_nivel_minimo CHECK (nivel >= 1)
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_estadisticas_user_id 
ON estadisticas_usuario(user_id);

-- Migrar usuarios existentes (crear registro para cada uno con valores por defecto)
INSERT INTO estadisticas_usuario (user_id, puntos_totales, racha_actual, racha_maxima, nivel)
SELECT user_id, 0, 0, 0, 1 
FROM usuarios
WHERE user_id NOT IN (SELECT user_id FROM estadisticas_usuario);

-- Comentario de verificación
COMMENT ON TABLE estadisticas_usuario IS 'Estadísticas de gamificación: puntos, rachas y niveles por usuario';
