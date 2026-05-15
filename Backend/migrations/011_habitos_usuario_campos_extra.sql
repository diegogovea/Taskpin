-- ============================================================
-- Migración 011: Campos extra en habitos_usuario
--   Fase 2 — Color e ícono personal del hábito
--   Fase 3 — Frecuencias avanzadas (CHECK constraint)
--   Fase 4 — Fecha fin y meta
--   Fase 5 — Tipo de hábito (bueno / por_eliminar)
-- ============================================================

-- ── Fase 2: color e ícono ──────────────────────────────────
ALTER TABLE habitos_usuario
    ADD COLUMN IF NOT EXISTS color       VARCHAR(7)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS icono       VARCHAR(50) DEFAULT NULL;

-- ── Fase 4: fecha fin y meta ───────────────────────────────
ALTER TABLE habitos_usuario
    ADD COLUMN IF NOT EXISTS fecha_fin   DATE        DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS meta_valor  DECIMAL     DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS meta_unidad VARCHAR(50) DEFAULT NULL;

-- ── Fase 5: tipo de hábito ─────────────────────────────────
ALTER TABLE habitos_usuario
    ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'bueno'
        CHECK (tipo IN ('bueno', 'por_eliminar'));

-- ── Fase 3: frecuencias avanzadas ─────────────────────────
-- Ampliar el CHECK de frecuencia_personal en habitos_usuario
ALTER TABLE habitos_usuario
    DROP CONSTRAINT IF EXISTS habitos_usuario_frecuencia_personal_check,
    DROP CONSTRAINT IF EXISTS chk_frecuencia_personal,
    DROP CONSTRAINT IF EXISTS habitos_usuario_frecuencia_check;

ALTER TABLE habitos_usuario
    ADD CONSTRAINT chk_frecuencia_personal
        CHECK (frecuencia_personal IN (
            'diario', 'semanal', 'mensual',
            'cada_2_dias', 'cada_2_semanas', 'cada_2_meses',
            'personalizado'
        ));

-- Ampliar habitos_predeterminados también
ALTER TABLE habitos_predeterminados
    DROP CONSTRAINT IF EXISTS habitos_predeterminados_frecuencia_recomendada_check,
    DROP CONSTRAINT IF EXISTS chk_frecuencia_recomendada;

ALTER TABLE habitos_predeterminados
    ADD CONSTRAINT chk_frecuencia_recomendada
        CHECK (frecuencia_recomendada IN (
            'diario', 'semanal', 'mensual',
            'cada_2_dias', 'cada_2_semanas', 'cada_2_meses',
            'personalizado'
        ));
