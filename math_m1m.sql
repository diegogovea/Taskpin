-- ============================================
-- BASE DE DATOS: MATH_M1M
-- Aplicación Educativa de Matemáticas
-- ============================================

-- Crear base de datos 
-- CREATE DATABASE Math_M1M;
-- \c Math_M1M;

-- ============================================
-- ELIMINACIÓN DE TABLAS 
-- ============================================
DROP TABLE IF EXISTS historial_respuestas CASCADE;
DROP TABLE IF EXISTS estadisticas_secciones CASCADE;
DROP TABLE IF EXISTS progreso_temas CASCADE;
DROP TABLE IF EXISTS ejercicios CASCADE;
DROP TABLE IF EXISTS temas CASCADE;
DROP TABLE IF EXISTS secciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================
-- 1. TABLA USUARIOS
-- ============================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    correo_electronico VARCHAR(150) UNIQUE NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL, -- Username único
    contraseña VARCHAR(255) NOT NULL, -- Hasheada con bcrypt (confirmar_contraseña se valida en frontend)
    fecha_nacimiento DATE NOT NULL,
    edad INTEGER, -- Se calcula automáticamente
    puntos_totales INTEGER DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    
    -- Validaciones
    CONSTRAINT chk_usuario_length CHECK (LENGTH(usuario) >= 3),
    CONSTRAINT chk_email_format CHECK (correo_electronico LIKE '%@%.%')
);

-- ============================================
-- 2. TABLA SECCIONES (Álgebra, Trigonometría, etc.)
-- ============================================
CREATE TABLE secciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- 'Algebra', 'Trigonometria', 'Geometria', 'Calculo'
    descripcion TEXT,
    icono VARCHAR(100), -- URL o nombre del icono
    color VARCHAR(7), -- Código hex para el color de la sección (#FF5733)
    orden INTEGER NOT NULL UNIQUE, -- Para mostrar en orden específico
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. TABLA TEMAS (dentro de cada sección)
-- ============================================
CREATE TABLE temas (
    id SERIAL PRIMARY KEY,
    seccion_id INTEGER NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- 'Ecuaciones Lineales', 'Factorización', etc.
    descripcion TEXT,
    orden INTEGER NOT NULL, -- Orden dentro de la sección
    dificultad VARCHAR(20) NOT NULL CHECK (dificultad IN ('Basico', 'Intermedio', 'Avanzado')),
    puntos_requeridos INTEGER DEFAULT 0, -- Puntos necesarios para desbloquear este tema
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índice único para evitar temas duplicados en la misma sección con el mismo orden
    UNIQUE(seccion_id, orden)
);

-- ============================================
-- 4. TABLA EJERCICIOS (preguntas de opción múltiple)
-- ============================================
CREATE TABLE ejercicios (
    id SERIAL PRIMARY KEY,
    tema_id INTEGER NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    opcion_a VARCHAR(500) NOT NULL,
    opcion_b VARCHAR(500) NOT NULL,
    opcion_c VARCHAR(500) NOT NULL,
    opcion_d VARCHAR(500) NOT NULL,
    respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
    explicacion TEXT NOT NULL, -- Explicación con texto formateado
    orden INTEGER, -- Orden dentro del tema
    puntos_base INTEGER DEFAULT 10, -- Puntos por respuesta correcta
    penalizacion INTEGER DEFAULT 2, -- Puntos que se restan por respuesta incorrecta
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validaciones
    CONSTRAINT chk_puntos_positivos CHECK (puntos_base > 0),
    CONSTRAINT chk_penalizacion_positiva CHECK (penalizacion >= 0)
);

-- ============================================
-- 5. TABLA PROGRESO POR TEMA (desbloqueados y completados)
-- ============================================
CREATE TABLE progreso_temas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tema_id INTEGER NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    desbloqueado BOOLEAN DEFAULT false,
    completado BOOLEAN DEFAULT false,
    ejercicios_correctos INTEGER DEFAULT 0,
    ejercicios_totales INTEGER DEFAULT 0,
    puntos_obtenidos INTEGER DEFAULT 0,
    estrellas INTEGER DEFAULT 0 CHECK (estrellas BETWEEN 0 AND 5),
    fecha_desbloqueado TIMESTAMP,
    fecha_completado TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Evitar duplicados
    UNIQUE(usuario_id, tema_id),
    
    -- Validaciones lógicas
    CONSTRAINT chk_ejercicios_logicos CHECK (ejercicios_correctos <= ejercicios_totales),
    CONSTRAINT chk_completado_logico CHECK (
        (completado = false) OR 
        (completado = true AND ejercicios_totales > 0 AND fecha_completado IS NOT NULL)
    )
);

-- ============================================
-- 6. TABLA HISTORIAL DE RESPUESTAS
-- ============================================
CREATE TABLE historial_respuestas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    respuesta_usuario CHAR(1) NOT NULL CHECK (respuesta_usuario IN ('A', 'B', 'C', 'D')),
    es_correcta BOOLEAN NOT NULL,
    puntos_obtenidos INTEGER NOT NULL, -- Puede ser positivo (correcto) o negativo (incorrecto)
    tiempo_respuesta INTEGER, -- Segundos que tardó en responder
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    intento_numero INTEGER DEFAULT 1, -- Por si permite reintentos del mismo ejercicio
    
    -- Validaciones
    CONSTRAINT chk_tiempo_respuesta CHECK (tiempo_respuesta IS NULL OR tiempo_respuesta > 0),
    CONSTRAINT chk_intento_positivo CHECK (intento_numero > 0)
);

-- ============================================
-- 7. TABLA ESTADISTICAS POR SECCION
-- ============================================
CREATE TABLE estadisticas_secciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    seccion_id INTEGER NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
    ejercicios_correctos INTEGER DEFAULT 0,
    ejercicios_incorrectos INTEGER DEFAULT 0,
    ejercicios_totales INTEGER DEFAULT 0,
    puntos_seccion INTEGER DEFAULT 0,
    porcentaje_acierto DECIMAL(5,2) DEFAULT 0.00,
    tiempo_total_minutos INTEGER DEFAULT 0, -- Tiempo total estudiando esta sección
    fecha_ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Evitar duplicados
    UNIQUE(usuario_id, seccion_id),
    
    -- Validaciones
    CONSTRAINT chk_ejercicios_seccion_logicos CHECK (
        ejercicios_correctos + ejercicios_incorrectos = ejercicios_totales
    ),
    CONSTRAINT chk_porcentaje_valido CHECK (porcentaje_acierto BETWEEN 0 AND 100)
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ============================================
CREATE INDEX idx_usuarios_email ON usuarios(correo_electronico);
CREATE INDEX idx_usuarios_username ON usuarios(usuario);
CREATE INDEX idx_temas_seccion ON temas(seccion_id);
CREATE INDEX idx_temas_orden ON temas(seccion_id, orden);
CREATE INDEX idx_ejercicios_tema ON ejercicios(tema_id);
CREATE INDEX idx_ejercicios_orden ON ejercicios(tema_id, orden);
CREATE INDEX idx_progreso_usuario ON progreso_temas(usuario_id);
CREATE INDEX idx_progreso_tema ON progreso_temas(tema_id);
CREATE INDEX idx_historial_usuario ON historial_respuestas(usuario_id);
CREATE INDEX idx_historial_ejercicio ON historial_respuestas(ejercicio_id);
CREATE INDEX idx_historial_fecha ON historial_respuestas(fecha_respuesta);
CREATE INDEX idx_estadisticas_usuario ON estadisticas_secciones(usuario_id);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para calcular edad automáticamente
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(fecha_nac));
END;
$$ LANGUAGE plpgsql;

-- Función para calcular estrellas basado en porcentaje de acierto
CREATE OR REPLACE FUNCTION calcular_estrellas(porcentaje_acierto DECIMAL)
RETURNS INTEGER AS $$
BEGIN
    IF porcentaje_acierto >= 90 THEN RETURN 5;
    ELSIF porcentaje_acierto >= 80 THEN RETURN 4;
    ELSIF porcentaje_acierto >= 70 THEN RETURN 3;
    ELSIF porcentaje_acierto >= 60 THEN RETURN 2;
    ELSIF porcentaje_acierto >= 50 THEN RETURN 1;
    ELSE RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS AUTOMÁTICOS
-- ============================================

-- Trigger para actualizar edad automáticamente
CREATE OR REPLACE FUNCTION trigger_actualizar_edad()
RETURNS TRIGGER AS $$
BEGIN
    NEW.edad := calcular_edad(NEW.fecha_nacimiento);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_edad
    BEFORE INSERT OR UPDATE OF fecha_nacimiento ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_edad();

-- Trigger para actualizar puntos totales del usuario
CREATE OR REPLACE FUNCTION trigger_actualizar_puntos()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE usuarios 
    SET puntos_totales = puntos_totales + NEW.puntos_obtenidos,
        ultimo_acceso = CURRENT_TIMESTAMP
    WHERE id = NEW.usuario_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sumar_puntos
    AFTER INSERT ON historial_respuestas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_puntos();

-- Trigger para actualizar fecha de modificación en progreso
CREATE OR REPLACE FUNCTION trigger_actualizar_fecha_progreso()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fecha_progreso
    BEFORE UPDATE ON progreso_temas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_fecha_progreso();

-- ============================================
-- DATOS INICIALES - SECCIONES PRINCIPALES
-- ============================================
INSERT INTO secciones (nombre, descripcion, color, orden) VALUES
('Algebra', 'Fundamentos algebraicos, ecuaciones y sistemas de ecuaciones lineales', '#FF6B6B', 1),
('Trigonometria', 'Funciones trigonométricas, identidades y aplicaciones', '#4ECDC4', 2),
('Geometria', 'Formas geométricas, áreas, perímetros y teoremas fundamentales', '#45B7D1', 3),
('Calculo', 'Límites, derivadas, integrales y sus aplicaciones', '#96CEB4', 4);

-- ============================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================

/*
CARACTERÍSTICAS PRINCIPALES:

1. SISTEMA DE USUARIOS:
   - Registro completo con validaciones
   - Cálculo automático de edad
   - Sistema de puntos acumulativos

2. ESTRUCTURA JERÁRQUICA:
   - Secciones → Temas → Ejercicios
   - Progreso independiente por sección
   - Sistema de desbloqueo por puntos

3. SISTEMA DE GAMIFICACIÓN:
   - Puntos por respuesta correcta
   - Penalización por respuesta incorrecta
   - Sistema de estrellas (1-5) basado en rendimiento

4. SEGUIMIENTO COMPLETO:
   - Historial de todas las respuestas
   - Estadísticas por sección
   - Tiempo de respuesta por ejercicio

5. OPTIMIZACIÓN:
   - Índices en campos de búsqueda frecuente
   - Triggers automáticos para mantener consistencia
   - Validaciones a nivel de base de datos

6. ESCALABILIDAD:
   - Diseño modular para agregar nuevas secciones
   - Soporte para múltiples niveles de dificultad
   - Sistema flexible de puntuación
*/

-- ============================================
-- CONSULTAS ÚTILES PARA TESTING
-- ============================================

-- Ver todas las secciones con sus temas
/*
SELECT 
    s.nombre as seccion,
    s.descripcion,
    COUNT(t.id) as total_temas
FROM secciones s
LEFT JOIN temas t ON s.id = t.seccion_id
GROUP BY s.id, s.nombre, s.descripcion, s.orden
ORDER BY s.orden;
*/

-- Ver progreso de un usuario específico
/*
SELECT 
    u.nombre_completo,
    u.puntos_totales,
    s.nombre as seccion,
    COUNT(pt.tema_id) as temas_desbloqueados,
    SUM(CASE WHEN pt.completado THEN 1 ELSE 0 END) as temas_completados
FROM usuarios u
CROSS JOIN secciones s
LEFT JOIN temas t ON s.id = t.seccion_id
LEFT JOIN progreso_temas pt ON t.id = pt.tema_id AND pt.usuario_id = u.id
WHERE u.id = 1  -- Cambiar por ID del usuario
GROUP BY u.id, u.nombre_completo, u.puntos_totales, s.id, s.nombre
ORDER BY s.orden;
*/