-- ============================================================
-- Migración 013: Frecuencia personal flexible
--   Permite cualquier N en 'cada_N_(dias|semanas|meses)'
--   Antes solo aceptaba N=2; ahora cualquier entero positivo
--   Mantiene los valores cortos 'diario' | 'semanal' | 'mensual'
--   y 'personalizado' | 'anual' como casos especiales
-- ============================================================

-- ── habitos_usuario.frecuencia_personal ──
ALTER TABLE habitos_usuario
    DROP CONSTRAINT IF EXISTS chk_frecuencia_personal,
    DROP CONSTRAINT IF EXISTS habitos_usuario_frecuencia_personal_check,
    DROP CONSTRAINT IF EXISTS habitos_usuario_frecuencia_check;

ALTER TABLE habitos_usuario
    ADD CONSTRAINT chk_frecuencia_personal
        CHECK (
            frecuencia_personal IN ('diario', 'semanal', 'mensual', 'anual', 'personalizado')
            OR frecuencia_personal ~ '^cada_[1-9][0-9]*_(dias|semanas|meses)$'
        );

-- ── habitos_predeterminados.frecuencia_recomendada ──
ALTER TABLE habitos_predeterminados
    DROP CONSTRAINT IF EXISTS chk_frecuencia_recomendada,
    DROP CONSTRAINT IF EXISTS habitos_predeterminados_frecuencia_recomendada_check;

ALTER TABLE habitos_predeterminados
    ADD CONSTRAINT chk_frecuencia_recomendada
        CHECK (
            frecuencia_recomendada IN ('diario', 'semanal', 'mensual', 'anual', 'personalizado')
            OR frecuencia_recomendada ~ '^cada_[1-9][0-9]*_(dias|semanas|meses)$'
        );
