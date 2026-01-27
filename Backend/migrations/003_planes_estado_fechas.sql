-- MIGRACIÓN 003: Campos de fecha para estados de planes
-- Agrega campos para registrar cuándo se pausó/canceló/completó un plan

-- Campo para fecha de pausa
ALTER TABLE planes_usuario 
ADD COLUMN IF NOT EXISTS fecha_pausado TIMESTAMP DEFAULT NULL;

-- Campo para fecha de cancelación
ALTER TABLE planes_usuario 
ADD COLUMN IF NOT EXISTS fecha_cancelado TIMESTAMP DEFAULT NULL;

-- Campo para fecha de completado
ALTER TABLE planes_usuario 
ADD COLUMN IF NOT EXISTS fecha_completado TIMESTAMP DEFAULT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN planes_usuario.fecha_pausado IS 'Fecha y hora cuando el plan fue pausado por última vez';
COMMENT ON COLUMN planes_usuario.fecha_cancelado IS 'Fecha y hora cuando el plan fue cancelado';
COMMENT ON COLUMN planes_usuario.fecha_completado IS 'Fecha y hora cuando el plan fue marcado como completado';
