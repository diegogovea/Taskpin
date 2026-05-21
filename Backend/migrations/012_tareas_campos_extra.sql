-- =============================================
-- MIGRACIÓN 012: Campos extra para tareas de planes personalizados
-- Agrega prioridad, notas y fecha_limite a tareas_predeterminadas
-- =============================================

ALTER TABLE tareas_predeterminadas
  ADD COLUMN IF NOT EXISTS prioridad VARCHAR(10) NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS notas TEXT NULL,
  ADD COLUMN IF NOT EXISTS fecha_limite DATE NULL;

COMMENT ON COLUMN tareas_predeterminadas.prioridad IS 'alta | media | baja';
COMMENT ON COLUMN tareas_predeterminadas.notas IS 'Notas adicionales del usuario para la tarea';
COMMENT ON COLUMN tareas_predeterminadas.fecha_limite IS 'Fecha límite opcional dentro de la fase';
