-- Migration 004: Agregar fases y tareas para el plan "Bajar 10kg en 4 meses"
-- Plan ID: 1, Duración total: 120 días
-- Tipo de tareas válidos: 'diaria', 'semanal', 'única'

-- =====================================================
-- FASE 1: PREPARACIÓN (14 días)
-- =====================================================
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    1,
    'Fase 1: Preparación',
    'Evaluación inicial, establecer objetivos claros y preparar el entorno para el cambio.',
    1,
    14
) ON CONFLICT DO NOTHING;

-- Tareas de Fase 1 (única = se hace una vez, diaria = todos los días)
INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Registrar peso inicial', 'Pesarte en ayunas y anotar tu peso inicial', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Tomar medidas corporales', 'Medir cintura, cadera, pecho y muslos', 'única', 2, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Foto de progreso inicial', 'Tomar foto frontal y lateral para comparar después', 'única', 3, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Limpiar la despensa', 'Eliminar alimentos ultraprocesados y comprar opciones saludables', 'única', 4, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Beber 2 litros de agua', 'Mantente hidratado durante todo el día', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Caminar 20 minutos', 'Caminata ligera para activar el cuerpo', 'diaria', 6, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Registrar comidas', 'Anota todo lo que comes durante el día', 'diaria', 7, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- FASE 2: INICIO DEL CAMBIO (28 días)
-- =====================================================
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    1,
    'Fase 2: Inicio del Cambio',
    'Implementar cambios en alimentación y comenzar rutina de ejercicio básica.',
    2,
    28
) ON CONFLICT DO NOTHING;

-- Tareas de Fase 2
INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Pesarse semanalmente', 'Pesarte cada lunes en ayunas y registrar el progreso', 'semanal', 1, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Desayuno saludable', 'Incluir proteína y fibra en el desayuno', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Ejercicio 30 minutos', 'Realizar actividad física moderada', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Cena antes de las 8pm', 'Evitar comer tarde para mejor digestión', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Beber 2.5 litros de agua', 'Aumentar la hidratación', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Preparar comidas del día siguiente', 'Meal prep para evitar tentaciones', 'diaria', 6, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 2
ON CONFLICT DO NOTHING;

-- =====================================================
-- FASE 3: ACELERACIÓN (42 días)
-- =====================================================
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    1,
    'Fase 3: Aceleración',
    'Intensificar el entrenamiento y ajustar la dieta para maximizar resultados.',
    3,
    42
) ON CONFLICT DO NOTHING;

-- Tareas de Fase 3
INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Tomar medidas quincenal', 'Medir cintura y cadera cada 2 semanas', 'semanal', 1, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Ejercicio 45 minutos', 'Aumentar intensidad y duración del entrenamiento', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Incluir proteína en cada comida', 'Asegurar ingesta proteica para mantener músculo', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Evitar carbohidratos refinados', 'Sustituir por opciones integrales', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Dormir 7-8 horas', 'El descanso es clave para la pérdida de peso', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Entrenamiento de fuerza', 'Agregar pesas o ejercicios de resistencia 2x/semana', 'semanal', 6, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Foto de progreso mitad de plan', 'Comparar con la foto inicial', 'única', 7, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 3
ON CONFLICT DO NOTHING;

-- =====================================================
-- FASE 4: CONSOLIDACIÓN (36 días)
-- =====================================================
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    1,
    'Fase 4: Consolidación',
    'Mantener los hábitos adquiridos y prepararse para el mantenimiento a largo plazo.',
    4,
    36
) ON CONFLICT DO NOTHING;

-- Tareas de Fase 4
INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Pesarse semanalmente', 'Continuar monitoreando el peso', 'semanal', 1, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Mantener ejercicio 45 min', 'Continuar con la rutina establecida', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Planificar comidas de la semana', 'Hacer meal plan cada domingo', 'semanal', 3, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Comer consciente', 'Evitar distracciones al comer, masticar bien', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Tomar medidas finales', 'Medir cintura, cadera, pecho y muslos al finalizar', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Foto de progreso final', 'Tomar foto para comparar con el inicio', 'única', 6, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Definir plan de mantenimiento', 'Planificar cómo mantener el peso logrado', 'única', 7, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Celebrar el logro', 'Recompénsate por completar el plan (no con comida)', 'única', 8, false
FROM objetivos_intermedios WHERE plan_id = 1 AND orden_fase = 4
ON CONFLICT DO NOTHING;
