-- Permitir frecuencia "mensual" (API y app ya la envían; el CHECK antiguo solo permitía diario/semanal/personalizado)

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'habitos_usuario'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%frecuencia_personal%'
  LOOP
    EXECUTE format('ALTER TABLE habitos_usuario DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE habitos_usuario
  DROP CONSTRAINT IF EXISTS habitos_usuario_frecuencia_personal_check;

ALTER TABLE habitos_usuario
  ADD CONSTRAINT habitos_usuario_frecuencia_personal_check
  CHECK (frecuencia_personal IN ('diario', 'semanal', 'mensual', 'personalizado'));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'habitos_predeterminados'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%frecuencia_recomendada%'
  LOOP
    EXECUTE format('ALTER TABLE habitos_predeterminados DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE habitos_predeterminados
  DROP CONSTRAINT IF EXISTS habitos_predeterminados_frecuencia_recomendada_check;

ALTER TABLE habitos_predeterminados
  ADD CONSTRAINT habitos_predeterminados_frecuencia_recomendada_check
  CHECK (frecuencia_recomendada IN ('diario', 'semanal', 'mensual', 'personalizado'));
