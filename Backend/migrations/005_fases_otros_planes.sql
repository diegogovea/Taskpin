-- Migration 005: Agregar fases y tareas para planes adicionales
-- Planes: Correr 5K (ID:2), Fondo de emergencia (ID:6), Aprender inglés (ID:11)

-- =====================================================
-- PLAN 2: CORRER MI PRIMER 5K (60 días, fácil)
-- =====================================================

-- FASE 1: BASE (14 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    2,
    'Fase 1: Construyendo la Base',
    'Acostumbrar al cuerpo al movimiento con caminatas y trote muy ligero.',
    1,
    14
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Comprar tenis adecuados', 'Visita una tienda deportiva para elegir calzado con buen soporte', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Definir ruta de entrenamiento', 'Elige un parque o zona segura para correr', 'única', 2, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Caminata de 20 minutos', 'Caminar a paso rápido para activar el cuerpo', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Estiramientos post-caminata', 'Dedicar 5 minutos a estirar piernas y espalda', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Hidratación adecuada', 'Beber al menos 2 litros de agua durante el día', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 1
ON CONFLICT DO NOTHING;

-- FASE 2: DESARROLLO (21 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    2,
    'Fase 2: Desarrollo de Resistencia',
    'Alternar entre caminar y trotar para construir resistencia cardiovascular.',
    2,
    21
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Intervalos caminar/trotar 25 min', 'Alternar 2 min caminando, 1 min trotando', 'diaria', 1, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Día de descanso activo', 'Caminata suave o yoga para recuperación', 'semanal', 2, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Registrar distancia recorrida', 'Usar app o reloj para medir el progreso', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Estiramientos completos', 'Rutina de 10 minutos de estiramientos', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Aumentar tiempo de trote', 'Cada semana aumentar 30 segundos el tiempo de trote', 'semanal', 5, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 2
ON CONFLICT DO NOTHING;

-- FASE 3: RESISTENCIA (18 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    2,
    'Fase 3: Correr Continuo',
    'Transición a correr de forma continua sin pausas para caminar.',
    3,
    18
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Correr 15-20 minutos continuo', 'Mantener un ritmo cómodo sin detenerse', 'diaria', 1, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Carrera larga semanal', 'Una vez por semana, intenta correr 25-30 minutos', 'semanal', 2, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Ejercicios de fortalecimiento', 'Sentadillas, lunges y core 2 veces por semana', 'semanal', 3, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Medir los 5K de prueba', 'Corre 5K a tu ritmo y registra tu tiempo', 'única', 4, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Descanso y recuperación', 'Dormir 7-8 horas para mejor recuperación', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 3
ON CONFLICT DO NOTHING;

-- FASE 4: PREPARACIÓN FINAL (7 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    2,
    'Fase 4: Tapering y Carrera',
    'Reducir intensidad antes de la carrera y correr los 5K oficialmente.',
    4,
    7
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Trotar suave 15 minutos', 'Mantener las piernas activas sin forzar', 'diaria', 1, true
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Preparar equipamiento', 'Alistar ropa, tenis, agua y playlist para el día', 'única', 2, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Descanso total día anterior', 'No correr el día antes de la carrera final', 'única', 3, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'CORRER LOS 5K', 'Completar tu primer 5K - ¡Lo lograste!', 'única', 4, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Celebrar el logro', 'Toma una foto, comparte tu tiempo y celébralo', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 2 AND orden_fase = 4
ON CONFLICT DO NOTHING;


-- =====================================================
-- PLAN 6: AHORRAR PARA FONDO DE EMERGENCIA (180 días)
-- =====================================================

-- FASE 1: DIAGNÓSTICO (21 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    6,
    'Fase 1: Diagnóstico Financiero',
    'Analizar tu situación actual, gastos e ingresos para establecer una meta realista.',
    1,
    21
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Calcular ingresos mensuales', 'Suma todos tus ingresos fijos y variables', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Listar todos los gastos fijos', 'Renta, servicios, seguros, deudas, etc.', 'única', 2, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Registrar gastos diarios', 'Anota cada gasto que hagas durante 2 semanas', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Calcular gasto mensual promedio', 'Suma y categoriza todos tus gastos', 'única', 4, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Definir meta de fondo de emergencia', 'Idealmente 3-6 meses de gastos esenciales', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Abrir cuenta de ahorros separada', 'Crear cuenta exclusiva para el fondo de emergencia', 'única', 6, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 1
ON CONFLICT DO NOTHING;

-- FASE 2: OPTIMIZACIÓN (45 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    6,
    'Fase 2: Optimización de Gastos',
    'Identificar y reducir gastos innecesarios para liberar dinero para ahorrar.',
    2,
    45
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Identificar 3 gastos a eliminar', 'Suscripciones, compras impulsivas, etc.', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Cancelar suscripciones no usadas', 'Streaming, apps, membresías que no uses', 'única', 2, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Llevar lunch al trabajo', 'Preparar comida en casa en vez de comprar', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Regla de las 24 horas', 'Esperar 24h antes de compras no esenciales', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Revisar progreso semanal', 'Verificar cuánto has ahorrado esta semana', 'semanal', 5, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Comparar precios antes de comprar', 'Buscar ofertas y alternativas más baratas', 'diaria', 6, true
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 2
ON CONFLICT DO NOTHING;

-- FASE 3: AHORRO ACTIVO (90 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    6,
    'Fase 3: Ahorro Sistemático',
    'Automatizar el ahorro y mantener el hábito de forma consistente.',
    3,
    90
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Configurar transferencia automática', 'Programar ahorro automático al recibir ingresos', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Guardar cambio/billetes pequeños', 'El cambio del día va directo al ahorro', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Revisar balance del fondo', 'Verificar cuánto llevas ahorrado', 'semanal', 3, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Buscar ingresos extra', 'Identificar formas de ganar dinero adicional', 'semanal', 4, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Celebrar cada 25% alcanzado', 'Reconoce tu progreso sin gastar de más', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'No tocar el fondo para gastos normales', 'Resistir la tentación de usar el fondo', 'diaria', 6, true
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 3
ON CONFLICT DO NOTHING;

-- FASE 4: CONSOLIDACIÓN (24 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    6,
    'Fase 4: Consolidación y Mantenimiento',
    'Asegurar que el hábito de ahorro se mantenga a largo plazo.',
    4,
    24
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Evaluar meta alcanzada', 'Revisar si llegaste a tu meta o cuánto falta', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Definir reglas de uso del fondo', 'Establecer qué situaciones califican como emergencia', 'única', 2, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Continuar ahorro automático', 'Mantener el hábito incluso después de la meta', 'semanal', 3, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Revisar y ajustar presupuesto', 'Actualizar tu presupuesto con lo aprendido', 'única', 4, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Celebrar tu logro financiero', 'Reconoce que tienes seguridad financiera ahora', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 6 AND orden_fase = 4
ON CONFLICT DO NOTHING;


-- =====================================================
-- PLAN 11: APRENDER INGLÉS CONVERSACIONAL (180 días)
-- =====================================================

-- FASE 1: FUNDAMENTOS (30 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    11,
    'Fase 1: Fundamentos del Idioma',
    'Construir vocabulario básico y familiarizarse con los sonidos del inglés.',
    1,
    30
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Descargar app de idiomas', 'Instalar Duolingo, Babbel o similar', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Aprender 10 palabras nuevas', 'Memorizar vocabulario básico diariamente', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Practicar con app 15 minutos', 'Completar lecciones en la app elegida', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Escuchar canciones en inglés', 'Poner música en inglés y leer las letras', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Aprender saludos y presentaciones', 'Hello, How are you, My name is...', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 1
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Repasar vocabulario de la semana', 'Revisar todas las palabras aprendidas', 'semanal', 6, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 1
ON CONFLICT DO NOTHING;

-- FASE 2: ESTRUCTURA (45 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    11,
    'Fase 2: Gramática y Estructura',
    'Aprender gramática básica y construir oraciones simples.',
    2,
    45
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Estudiar gramática 20 minutos', 'Aprender tiempos verbales básicos', 'diaria', 1, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Escribir 5 oraciones', 'Practicar escribiendo oraciones simples', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Ver video en inglés con subtítulos', 'YouTube, Netflix con subs en inglés', 'diaria', 3, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Aprender verbos irregulares', 'Memorizar 5 verbos irregulares por semana', 'semanal', 4, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Leer texto corto en inglés', 'Artículos simples o cuentos para niños', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 2
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Practicar pronunciación', 'Repetir frases en voz alta', 'diaria', 6, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 2
ON CONFLICT DO NOTHING;

-- FASE 3: PRÁCTICA CONVERSACIONAL (75 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    11,
    'Fase 3: Práctica Conversacional',
    'Desarrollar habilidades de escucha y conversación real.',
    3,
    75
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Escuchar podcast en inglés', '15-20 minutos de podcast para principiantes', 'diaria', 1, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Hablar en voz alta 10 minutos', 'Practicar monólogos o describir tu día', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Conversación con nativo o app', 'Usar HelloTalk, Tandem o clase online', 'semanal', 3, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Ver serie/película sin subtítulos', 'Entrenar el oído con contenido real', 'semanal', 4, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Escribir diario en inglés', 'Escribir 3-5 oraciones sobre tu día', 'diaria', 5, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 3
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Aprender expresiones idiomáticas', '3 expresiones nuevas por semana', 'semanal', 6, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 3
ON CONFLICT DO NOTHING;

-- FASE 4: INMERSIÓN (30 días)
INSERT INTO objetivos_intermedios (plan_id, titulo, descripcion, orden_fase, duracion_dias)
VALUES (
    11,
    'Fase 4: Inmersión Total',
    'Maximizar exposición al inglés y consolidar el nivel conversacional.',
    4,
    30
) ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Cambiar dispositivos a inglés', 'Celular, redes sociales, apps en inglés', 'única', 1, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Pensar en inglés', 'Intentar formular pensamientos en inglés', 'diaria', 2, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Conversación de 30 min', 'Sesión de práctica oral semanal', 'semanal', 3, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Consumir contenido solo en inglés', 'Noticias, videos, música todo en inglés', 'diaria', 4, true
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Evaluación de nivel final', 'Hacer test de nivel online para medir progreso', 'única', 5, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 4
ON CONFLICT DO NOTHING;

INSERT INTO tareas_predeterminadas (objetivo_id, titulo, descripcion, tipo, orden, es_diaria)
SELECT objetivo_id, 'Celebrar tu logro', 'Reconoce que ahora puedes comunicarte en inglés', 'única', 6, false
FROM objetivos_intermedios WHERE plan_id = 11 AND orden_fase = 4
ON CONFLICT DO NOTHING;
