-- ============================================
-- BASE DE DATOS: TASKPIN
-- Aplicación de Hábitos y Planes de Vida
-- ============================================

-- Crear base de datos
CREATE DATABASE taskpin;
USE taskpin;

-- ============================================
-- ELIMINACIÓN DE TABLAS (por si ya existen)
-- ============================================
DROP TABLE IF EXISTS recordatorios;
DROP TABLE IF EXISTS tareas_usuario;
DROP TABLE IF EXISTS progreso_planes;
DROP TABLE IF EXISTS planes_usuario;
DROP TABLE IF EXISTS tareas_predeterminadas;
DROP TABLE IF EXISTS objetivos_intermedios;
DROP TABLE IF EXISTS planes_predeterminados;
DROP TABLE IF EXISTS categorias_planes;
DROP TABLE IF EXISTS seguimiento_habitos;
DROP TABLE IF EXISTS habitos_usuario;
DROP TABLE IF EXISTS habitos_predeterminados;
DROP TABLE IF EXISTS categorias_habitos;
DROP TABLE IF EXISTS control;
DROP TABLE IF EXISTS registros;
DROP TABLE IF EXISTS usuarios;

-- ============================================
-- 1. TABLA USUARIOS
-- ============================================
CREATE TABLE usuarios (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Validaciones
    CONSTRAINT chk_email_format CHECK (correo LIKE '%@%.%'),
    CONSTRAINT chk_nombre_length CHECK (LENGTH(nombre) >= 2)
);

-- ============================================
-- 2. TABLA REGISTROS (Información adicional del usuario)
-- ============================================
CREATE TABLE registros (
    registro_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    edad INT,
    fecha_nac DATE,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Relaciones
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT chk_edad_valida CHECK (edad >= 10 AND edad <= 120),
    CONSTRAINT chk_nickname_length CHECK (LENGTH(nickname) >= 3)
);

-- ============================================
-- 3. TABLA CONTROL (Sesiones y accesos)
-- ============================================
CREATE TABLE control (
    id_control INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE
);

-- ============================================
-- 4. TABLA CATEGORÍAS DE HÁBITOS
-- ============================================
CREATE TABLE categorias_habitos (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(100),
    orden INT NOT NULL UNIQUE,
    
    -- Validaciones
    CONSTRAINT chk_orden_positivo CHECK (orden > 0)
);

-- ============================================
-- 5. TABLA HÁBITOS PREDETERMINADOS
-- ============================================
CREATE TABLE habitos_predeterminados (
    habito_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    frecuencia_recomendada ENUM('diario', 'semanal', 'personalizado') DEFAULT 'diario',
    puntos_base INT DEFAULT 10,
    
    -- Relaciones
    FOREIGN KEY (categoria_id) REFERENCES categorias_habitos(categoria_id) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT chk_puntos_positivos CHECK (puntos_base > 0)
);

-- ============================================
-- 6. TABLA HÁBITOS DEL USUARIO
-- ============================================
CREATE TABLE habitos_usuario (
    habito_usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    habito_id INT NOT NULL,
    fecha_agregado DATE DEFAULT (CURRENT_DATE),
    activo BOOLEAN DEFAULT TRUE,
    frecuencia_personal ENUM('diario', 'semanal', 'personalizado') DEFAULT 'diario',
    
    -- Relaciones
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE,
    FOREIGN KEY (habito_id) REFERENCES habitos_predeterminados(habito_id) ON DELETE CASCADE,
    
    -- Evitar duplicados
    UNIQUE(user_id, habito_id)
);

-- ============================================
-- 7. TABLA SEGUIMIENTO DE HÁBITOS
-- ============================================
CREATE TABLE seguimiento_habitos (
    seguimiento_id INT AUTO_INCREMENT PRIMARY KEY,
    habito_usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    completado BOOLEAN DEFAULT FALSE,
    hora_completado TIME,
    notas TEXT,
    
    -- Relaciones
    FOREIGN KEY (habito_usuario_id) REFERENCES habitos_usuario(habito_usuario_id) ON DELETE CASCADE,
    
    -- Evitar registros duplicados por día
    UNIQUE(habito_usuario_id, fecha)
);

-- ============================================
-- 8. TABLA CATEGORÍAS DE PLANES
-- ============================================
CREATE TABLE categorias_planes (
    categoria_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(100),
    orden INT NOT NULL UNIQUE,
    
    -- Validaciones
    CONSTRAINT chk_orden_plan_positivo CHECK (orden > 0)
);

-- ============================================
-- 9. TABLA PLANES PREDETERMINADOS
-- ============================================
CREATE TABLE planes_predeterminados (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_plan_id INT NOT NULL,
    meta_principal VARCHAR(150) NOT NULL,
    descripcion TEXT,
    plazo_dias_estimado INT NOT NULL,
    dificultad ENUM('fácil', 'intermedio', 'difícil') DEFAULT 'intermedio',
    imagen VARCHAR(200),
    
    -- Relaciones
    FOREIGN KEY (categoria_plan_id) REFERENCES categorias_planes(categoria_plan_id) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT chk_plazo_positivo CHECK (plazo_dias_estimado > 0)
);

-- ============================================
-- 10. TABLA OBJETIVOS INTERMEDIOS (Fases del plan)
-- ============================================
CREATE TABLE objetivos_intermedios (
    objetivo_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    orden_fase INT NOT NULL,
    duracion_dias INT,
    
    -- Relaciones
    FOREIGN KEY (plan_id) REFERENCES planes_predeterminados(plan_id) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT chk_orden_fase_positivo CHECK (orden_fase > 0),
    CONSTRAINT chk_duracion_positiva CHECK (duracion_dias IS NULL OR duracion_dias > 0),
    
    -- Evitar fases duplicadas
    UNIQUE(plan_id, orden_fase)
);

-- ============================================
-- 11. TABLA TAREAS PREDETERMINADAS
-- ============================================
CREATE TABLE tareas_predeterminadas (
    tarea_id INT AUTO_INCREMENT PRIMARY KEY,
    objetivo_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo ENUM('diaria', 'semanal', 'única') DEFAULT 'diaria',
    orden INT,
    es_diaria BOOLEAN DEFAULT TRUE,
    
    -- Relaciones
    FOREIGN KEY (objetivo_id) REFERENCES objetivos_intermedios(objetivo_id) ON DELETE CASCADE
);

-- ============================================
-- 12. TABLA PLANES DEL USUARIO
-- ============================================
CREATE TABLE planes_usuario (
    plan_usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    fecha_inicio DATE DEFAULT (CURRENT_DATE),
    fecha_objetivo DATE,
    estado ENUM('activo', 'pausado', 'completado', 'cancelado') DEFAULT 'activo',
    progreso_porcentaje INT DEFAULT 0,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES planes_predeterminados(plan_id) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT chk_progreso_valido CHECK (progreso_porcentaje BETWEEN 0 AND 100),
    CONSTRAINT chk_fechas_logicas CHECK (fecha_objetivo IS NULL OR fecha_objetivo >= fecha_inicio)
);

-- ============================================
-- 13. TABLA PROGRESO DE PLANES
-- ============================================
CREATE TABLE progreso_planes (
    progreso_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_usuario_id INT NOT NULL,
    objetivo_id INT NOT NULL,
    completado BOOLEAN DEFAULT FALSE,
    fecha_completado DATE,
    notas TEXT,
    progreso_objetivo_porcentaje INT DEFAULT 0,
    
    -- Relaciones
    FOREIGN KEY (plan_usuario_id) REFERENCES planes_usuario(plan_usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (objetivo_id) REFERENCES objetivos_intermedios(objetivo_id) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT chk_progreso_objetivo_valido CHECK (progreso_objetivo_porcentaje BETWEEN 0 AND 100),
    
    -- Evitar duplicados
    UNIQUE(plan_usuario_id, objetivo_id)
);

-- ============================================
-- 14. TABLA TAREAS DEL USUARIO
-- ============================================
CREATE TABLE tareas_usuario (
    tarea_usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_usuario_id INT NOT NULL,
    tarea_id INT NOT NULL,
    fecha_asignada DATE DEFAULT (CURRENT_DATE),
    completada BOOLEAN DEFAULT FALSE,
    hora_completada TIME,
    notas TEXT,
    
    -- Relaciones
    FOREIGN KEY (plan_usuario_id) REFERENCES planes_usuario(plan_usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (tarea_id) REFERENCES tareas_predeterminadas(tarea_id) ON DELETE CASCADE
);

-- ============================================
-- 15. TABLA RECORDATORIOS
-- ============================================
CREATE TABLE recordatorios (
    recordatorio_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_usuario_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT,
    hora TIME NOT NULL,
    dias_semana VARCHAR(20) DEFAULT '1,2,3,4,5,6,7', -- L,M,X,J,V,S,D
    activo BOOLEAN DEFAULT TRUE,
    
    -- Relaciones
    FOREIGN KEY (plan_usuario_id) REFERENCES planes_usuario(plan_usuario_id) ON DELETE CASCADE
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_registros_user ON registros(user_id);
CREATE INDEX idx_habitos_categoria ON habitos_predeterminados(categoria_id);
CREATE INDEX idx_habitos_usuario ON habitos_usuario(user_id);
CREATE INDEX idx_seguimiento_fecha ON seguimiento_habitos(fecha);
CREATE INDEX idx_planes_categoria ON planes_predeterminados(categoria_plan_id);
CREATE INDEX idx_planes_usuario ON planes_usuario(user_id);
CREATE INDEX idx_progreso_plan ON progreso_planes(plan_usuario_id);

-- ============================================
-- TRIGGERS AUTOMÁTICOS
-- ============================================

-- Trigger para actualizar último acceso
DELIMITER //
CREATE TRIGGER actualizar_ultimo_acceso
    AFTER UPDATE ON usuarios
    FOR EACH ROW
BEGIN
    UPDATE control 
    SET last_access = CURRENT_TIMESTAMP 
    WHERE user_id = NEW.user_id;
END//
DELIMITER ;

-- Trigger para calcular edad automáticamente
DELIMITER //
CREATE TRIGGER calcular_edad
    BEFORE INSERT ON registros
    FOR EACH ROW
BEGIN
    IF NEW.fecha_nac IS NOT NULL THEN
        SET NEW.edad = TIMESTAMPDIFF(YEAR, NEW.fecha_nac, CURDATE());
    END IF;
END//
DELIMITER ;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Categorías de Hábitos
INSERT INTO categorias_habitos (nombre, descripcion, icono, orden) VALUES
('Bienestar Diario', 'Hábitos de cuidado personal básico y rutinas saludables', '🌿', 1),
('Energía y Movimiento', 'Actividades físicas ligeras para mantener el cuerpo activo', '⚡', 2),
('Mente y Enfoque', 'Hábitos para desarrollo mental y concentración', '🧠', 3),
('Orden y Hogar', 'Organización doméstica y mantenimiento del hogar', '🏡', 4),
('Finanzas y Control Personal', 'Hábitos para el manejo responsable del dinero', '💸', 5);

-- Hábitos Predeterminados
INSERT INTO habitos_predeterminados (categoria_id, nombre, descripcion, frecuencia_recomendada, puntos_base) VALUES
-- Bienestar Diario 🌿
(1, 'Tomar agua antes de cada comida', 'Hidratarse antes de cada comida principal', 'diario', 10),
(1, 'Salir 10 minutos a tomar aire fresco', 'Tomar un descanso al aire libre', 'diario', 8),
(1, 'Cepillarse los dientes después de cada comida', 'Mantener higiene dental después de comer', 'diario', 10),
(1, 'Dormir sin usar el celular al menos 30 min antes', 'Descansar sin pantallas antes de dormir', 'diario', 12),
(1, 'Preparar la ropa del día siguiente', 'Organizar el outfit para mañana', 'diario', 5),

-- Energía y Movimiento ⚡
(2, 'Hacer 20 sentadillas', 'Realizar 20 sentadillas en cualquier momento del día', 'diario', 10),
(2, 'Caminar 5 minutos cada hora', 'Levantarse y caminar durante 5 minutos', 'diario', 8),
(2, 'Bailar una canción completa', 'Bailar tu canción favorita completa', 'diario', 8),
(2, 'Subir escaleras al menos una vez en el día', 'Usar escaleras en lugar de elevador', 'diario', 5),
(2, 'Hacer 10 flexiones', 'Realizar 10 flexiones en cualquier momento', 'diario', 10),

-- Mente y Enfoque 🧠
(3, 'Leer 5 páginas de un libro', 'Leer al menos 5 páginas de cualquier libro', 'diario', 12),
(3, 'Escribir 3 cosas buenas del día', 'Anotar tres aspectos positivos de tu día', 'diario', 10),
(3, 'Resolver un sudoku o crucigrama', 'Completar un juego mental', 'diario', 8),
(3, 'Aprender un dato curioso nuevo', 'Descubrir algo nuevo e interesante', 'diario', 8),
(3, 'Desconectarse de pantallas 15 minutos', 'Tomar un descanso digital', 'diario', 10),

-- Orden y Hogar 🏡
(4, 'Tender la cama al despertar', 'Hacer la cama inmediatamente al levantarse', 'diario', 5),
(4, 'Lavar los trastes del día', 'Lavar los platos y utensilios usados', 'diario', 8),
(4, 'Regar una planta', 'Cuidar al menos una planta de la casa', 'diario', 5),
(4, 'Sacar la basura', 'Vaciar los botes de basura cuando sea necesario', 'diario', 5),
(4, 'Dedicar 10 minutos a limpiar un área pequeña', 'Ordenar una zona específica de la casa', 'diario', 10),

-- Finanzas y Control Personal 💸
(5, 'Registrar un gasto diario', 'Anotar al menos un gasto realizado en el día', 'diario', 10),
(5, 'Ahorrar monedas en una alcancía', 'Guardar las monedas del cambio diario', 'diario', 8),
(5, 'No gastar en antojos un día completo', 'Evitar compras impulsivas durante todo el día', 'diario', 15),
(5, 'Revisar saldos de cuentas', 'Verificar el estado de cuentas bancarias', 'diario', 10),
(5, 'Anotar un objetivo financiero semanal', 'Escribir una meta financiera para la semana', 'semanal', 12);

-- Categorías de Planes
INSERT INTO categorias_planes (nombre, descripcion, icono, orden) VALUES
('Salud y Bienestar', 'Planes para mejorar la salud física y mental a mediano plazo', '🏥', 1),
('Finanzas Personales', 'Planes para organizar y mejorar la situación financiera', '💰', 2),
('Desarrollo Personal', 'Planes de crecimiento personal y aprendizaje de nuevas habilidades', '🌱', 3);

-- Planes Predeterminados
INSERT INTO planes_predeterminados (categoria_plan_id, meta_principal, descripcion, plazo_dias_estimado, dificultad) VALUES
-- Salud y Bienestar 🏥
(1, 'Bajar 10kg en 4 meses', 'Plan integral para pérdida de peso saludable con dieta y ejercicio', 120, 'intermedio'),
(1, 'Correr mi primer 5K', 'Entrenar desde cero hasta completar una carrera de 5 kilómetros', 60, 'fácil'),
(1, 'Dejar de fumar', 'Plan gradual y efectivo para abandonar el hábito del cigarrillo', 90, 'difícil'),
(1, 'Mejorar mi postura corporal', 'Corregir problemas de espalda, cuello y postura general', 75, 'intermedio'),
(1, 'Crear una rutina de sueño saludable', 'Establecer hábitos para dormir 8 horas de calidad', 45, 'fácil'),

-- Finanzas Personales 💰
(2, 'Ahorrar para un fondo de emergencia', 'Juntar dinero equivalente a 6 meses de gastos básicos', 180, 'intermedio'),
(2, 'Salir de deudas en 12 meses', 'Plan estructurado para liquidar todas las deudas de tarjetas', 365, 'difícil'),
(2, 'Ahorrar para vacaciones soñadas', 'Juntar dinero para realizar el viaje que siempre has querido', 240, 'intermedio'),
(2, 'Comprar mi primer auto', 'Ahorrar para el enganche y gastos iniciales de un vehículo', 300, 'intermedio'),
(2, 'Crear un presupuesto mensual efectivo', 'Aprender a controlar ingresos, gastos y ahorros mensuales', 60, 'fácil'),

-- Desarrollo Personal 🌱
(3, 'Aprender inglés conversacional', 'Alcanzar nivel intermedio para conversaciones cotidianas', 180, 'intermedio'),
(3, 'Leer 24 libros en el año', 'Desarrollar el hábito de leer 2 libros por mes', 365, 'intermedio'),
(3, 'Crear mi primer emprendimiento', 'Lanzar un pequeño negocio o proyecto personal', 120, 'difícil'),
(3, 'Desarrollar una habilidad creativa', 'Aprender guitarra, dibujo, cocina u otra habilidad artística', 90, 'fácil'),
(3, 'Mejorar mis habilidades de comunicación', 'Desarrollar confianza para hablar en público y socializar', 75, 'intermedio');

-- ============================================
-- COMENTARIOS FINALES
-- ============================================

/*
CARACTERÍSTICAS DE LA BASE DE DATOS TASKPIN:

✅ ESTRUCTURA MODULAR:
   - Usuarios con información básica y extendida
   - Sistema de hábitos predeterminados por categorías
   - Sistema de planes con objetivos y tareas estructuradas

✅ FUNCIONALIDADES CLAVE:
   - Seguimiento diario de hábitos
   - Progreso de planes por fases
   - Sistema de recordatorios personalizable
   - Puntuación por completar hábitos

✅ ESCALABILIDAD:
   - Fácil agregar nuevos hábitos y planes
   - Sistema flexible de categorías
   - Estructura preparada para múltiples usuarios

✅ INTEGRIDAD DE DATOS:
   - Validaciones automáticas
   - Triggers para cálculos automáticos
   - Relaciones bien definidas
   - Índices para rendimiento óptimo

✅ DATOS INICIALES:
   - 5 categorías de hábitos con 25 hábitos predeterminados
   - 3 categorías de planes con 15 planes predeterminados
   - Listos para usar inmediatamente

La base está lista para soportar una app completa de hábitos y planes de vida! 🚀
*/
