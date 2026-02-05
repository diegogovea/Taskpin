#!/usr/bin/env python3
"""
Seed Data Script for Taskpin AI Module

Este script genera datos de prueba para el sistema de IA:
- 15-20 usuarios ficticios con diferentes patrones de hábitos
- Historial de 30-60 días de seguimiento
- Estadísticas variadas
- Reflexiones diarias

USO:
    cd Backend
    python -m scripts.seed_data

IMPORTANTE: No borra datos existentes, solo agrega nuevos.
"""

import sys
import os
import random
from datetime import date, datetime, timedelta
from pathlib import Path

# Agregar el directorio padre al path para importar módulos de la app
sys.path.insert(0, str(Path(__file__).parent.parent))

from passlib.context import CryptContext
import psycopg
from app.config import DATABASE_URL

# Para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================
# DATOS DE CONFIGURACIÓN
# ============================================

# Usuarios de prueba (nombres variados para simular diferentes perfiles)
SEED_USERS = [
    {"nombre": "Ana García", "correo": "ana.garcia@test.com", "perfil": "fitness"},
    {"nombre": "Carlos López", "correo": "carlos.lopez@test.com", "perfil": "productivo"},
    {"nombre": "María Rodríguez", "correo": "maria.rodriguez@test.com", "perfil": "bienestar"},
    {"nombre": "Juan Martínez", "correo": "juan.martinez@test.com", "perfil": "mixto"},
    {"nombre": "Laura Sánchez", "correo": "laura.sanchez@test.com", "perfil": "fitness"},
    {"nombre": "Pedro Hernández", "correo": "pedro.hernandez@test.com", "perfil": "productivo"},
    {"nombre": "Sofia Torres", "correo": "sofia.torres@test.com", "perfil": "bienestar"},
    {"nombre": "Diego Ramírez", "correo": "diego.ramirez@test.com", "perfil": "mixto"},
    {"nombre": "Valentina Flores", "correo": "valentina.flores@test.com", "perfil": "fitness"},
    {"nombre": "Andrés Morales", "correo": "andres.morales@test.com", "perfil": "productivo"},
    {"nombre": "Camila Vargas", "correo": "camila.vargas@test.com", "perfil": "bienestar"},
    {"nombre": "Roberto Castro", "correo": "roberto.castro@test.com", "perfil": "mixto"},
    {"nombre": "Isabella Mendoza", "correo": "isabella.mendoza@test.com", "perfil": "fitness"},
    {"nombre": "Fernando Reyes", "correo": "fernando.reyes@test.com", "perfil": "productivo"},
    {"nombre": "Daniela Ortiz", "correo": "daniela.ortiz@test.com", "perfil": "bienestar"},
    {"nombre": "Alejandro Silva", "correo": "alejandro.silva@test.com", "perfil": "mixto"},
    {"nombre": "Natalia Jiménez", "correo": "natalia.jimenez@test.com", "perfil": "fitness"},
    {"nombre": "Gabriel Ruiz", "correo": "gabriel.ruiz@test.com", "perfil": "productivo"},
]

# Mapeo de perfiles a categorías de hábitos preferidas (categoria_id)
# Esto simula que diferentes tipos de usuarios prefieren diferentes hábitos
PERFIL_PREFERENCIAS = {
    "fitness": {
        "categorias_principales": [1],  # Health/Fitness
        "categorias_secundarias": [2, 3],  # Mind, Productivity
        "probabilidad_completar": 0.75,  # 75% de días completa
        "consistencia": 0.8,  # Qué tan consistente es
    },
    "productivo": {
        "categorias_principales": [3],  # Productivity
        "categorias_secundarias": [2, 4],  # Mind, Social
        "probabilidad_completar": 0.65,
        "consistencia": 0.7,
    },
    "bienestar": {
        "categorias_principales": [2],  # Mind/Wellness
        "categorias_secundarias": [1, 4],  # Health, Social
        "probabilidad_completar": 0.70,
        "consistencia": 0.75,
    },
    "mixto": {
        "categorias_principales": [1, 2, 3],  # Varios
        "categorias_secundarias": [4],
        "probabilidad_completar": 0.55,
        "consistencia": 0.5,
    }
}

# Estados de ánimo para reflexiones
ESTADOS_ANIMO = ['great', 'good', 'neutral', 'low', 'bad']

# Textos de ejemplo para reflexiones (variados)
REFLEXIONES_POSITIVAS = [
    "Logré completar todos mis hábitos hoy",
    "Me sentí muy productivo en el trabajo",
    "Hice ejercicio y me siento con energía",
    "Tuve una buena conversación con un amigo",
    "Aprendí algo nuevo hoy",
    "Dormí bien anoche",
    "Mi rutina matutina fue perfecta",
    "Logré meditar sin distracciones",
]

REFLEXIONES_MEJORAS = [
    "Podría haber dormido más temprano",
    "Necesito ser más consistente con el ejercicio",
    "Debería reducir el tiempo en redes sociales",
    "Podría organizar mejor mi tiempo",
    "Necesito beber más agua",
    "Debería levantarme más temprano",
    "Podría ser más paciente",
    "Necesito descansar más",
]


def get_connection():
    """Obtiene una conexión a la base de datos"""
    return psycopg.connect(DATABASE_URL)


def get_existing_habitos(cur):
    """Obtiene todos los hábitos predeterminados existentes"""
    cur.execute("""
        SELECT habito_id, categoria_id, nombre, puntos_base 
        FROM habitos_predeterminados
        WHERE es_personalizado = false OR es_personalizado IS NULL
        ORDER BY categoria_id, habito_id;
    """)
    return cur.fetchall()


def get_existing_users_emails(cur):
    """Obtiene los correos de usuarios existentes para evitar duplicados"""
    cur.execute("SELECT correo FROM usuarios;")
    return {row[0] for row in cur.fetchall()}


def create_user(cur, nombre, correo, password="Test123!"):
    """Crea un usuario y retorna su user_id"""
    hashed_password = pwd_context.hash(password)
    cur.execute("""
        INSERT INTO usuarios (nombre, correo, contraseña, activo)
        VALUES (%s, %s, %s, true)
        RETURNING user_id;
    """, (nombre, correo, hashed_password))
    return cur.fetchone()[0]


def create_estadisticas_usuario(cur, user_id):
    """Crea registro de estadísticas para el usuario"""
    cur.execute("""
        INSERT INTO estadisticas_usuario (user_id, puntos_totales, nivel, racha_actual, racha_maxima)
        VALUES (%s, 0, 1, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;
    """, (user_id,))


def assign_habits_to_user(cur, user_id, habitos, perfil_config, num_habitos=None):
    """
    Asigna hábitos a un usuario basándose en su perfil.
    Retorna lista de (habito_usuario_id, habito_id, puntos_base)
    """
    if num_habitos is None:
        num_habitos = random.randint(4, 7)
    
    # Filtrar hábitos por categorías del perfil
    habitos_principales = [h for h in habitos if h[1] in perfil_config["categorias_principales"]]
    habitos_secundarios = [h for h in habitos if h[1] in perfil_config["categorias_secundarias"]]
    
    # Seleccionar mayoría de principales, algunos secundarios
    selected = []
    
    # 60-70% de principales
    num_principales = min(len(habitos_principales), int(num_habitos * 0.7))
    if habitos_principales:
        selected.extend(random.sample(habitos_principales, min(num_principales, len(habitos_principales))))
    
    # Resto de secundarios
    remaining = num_habitos - len(selected)
    if habitos_secundarios and remaining > 0:
        selected.extend(random.sample(habitos_secundarios, min(remaining, len(habitos_secundarios))))
    
    # Si aún faltan, agregar cualquiera
    if len(selected) < num_habitos:
        otros = [h for h in habitos if h not in selected]
        remaining = num_habitos - len(selected)
        if otros:
            selected.extend(random.sample(otros, min(remaining, len(otros))))
    
    # Insertar hábitos del usuario
    user_habitos = []
    for habito in selected:
        habito_id, _, nombre, puntos_base = habito
        frecuencia = random.choice(['diario', 'diario', 'diario', 'semanal'])
        
        # Fecha de agregado entre 30 y 90 días atrás
        dias_atras = random.randint(30, 90)
        fecha_agregado = date.today() - timedelta(days=dias_atras)
        
        try:
            cur.execute("""
                INSERT INTO habitos_usuario (user_id, habito_id, frecuencia_personal, activo, fecha_agregado)
                VALUES (%s, %s, %s, true, %s)
                RETURNING habito_usuario_id;
            """, (user_id, habito_id, frecuencia, fecha_agregado))
            
            habito_usuario_id = cur.fetchone()[0]
            user_habitos.append((habito_usuario_id, habito_id, puntos_base or 10, fecha_agregado))
        except psycopg.IntegrityError:
            # El hábito ya existe para este usuario, skip
            continue
    
    return user_habitos


def generate_completion_history(cur, user_id, user_habitos, perfil_config):
    """
    Genera historial de completado realista para los hábitos del usuario.
    Simula patrones de comportamiento basados en el perfil.
    """
    prob_completar = perfil_config["probabilidad_completar"]
    consistencia = perfil_config["consistencia"]
    
    total_puntos = 0
    racha_actual = 0
    racha_maxima = 0
    ultima_actividad = None
    
    for habito_usuario_id, habito_id, puntos_base, fecha_agregado in user_habitos:
        # Generar historial desde fecha_agregado hasta ayer
        hoy = date.today()
        fecha_actual = fecha_agregado
        
        # Variables para simular rachas del hábito
        en_racha = random.random() < consistencia
        dias_racha = 0
        
        while fecha_actual < hoy:
            # Decidir si completó el hábito este día
            # Ajustar probabilidad basada en día de la semana (menos probable fines de semana)
            dia_semana = fecha_actual.weekday()
            prob_dia = prob_completar
            if dia_semana >= 5:  # Fin de semana
                prob_dia *= 0.7
            
            # Simular rachas (si está en racha, más probable que continúe)
            if en_racha and dias_racha > 0:
                prob_dia = min(0.95, prob_dia * 1.2)
            
            completado = random.random() < prob_dia
            
            if completado:
                # Hora de completado (distribución realista)
                hora = random.choice([7, 8, 9, 10, 18, 19, 20, 21])
                minuto = random.randint(0, 59)
                hora_completado = f"{hora:02d}:{minuto:02d}:00"
                
                try:
                    cur.execute("""
                        INSERT INTO seguimiento_habitos (habito_usuario_id, fecha, completado, hora_completado)
                        VALUES (%s, %s, true, %s)
                        ON CONFLICT DO NOTHING;
                    """, (habito_usuario_id, fecha_actual, hora_completado))
                    
                    total_puntos += puntos_base
                    dias_racha += 1
                    
                    if ultima_actividad is None or fecha_actual > ultima_actividad:
                        ultima_actividad = fecha_actual
                        
                except Exception:
                    pass
                
            else:
                # Rompe la racha
                if dias_racha > racha_maxima:
                    racha_maxima = dias_racha
                dias_racha = 0
                en_racha = random.random() < consistencia * 0.5
            
            fecha_actual += timedelta(days=1)
        
        # Calcular racha actual (días consecutivos hasta hoy)
        if ultima_actividad == hoy - timedelta(days=1):
            racha_actual = dias_racha
    
    # Actualizar estadísticas del usuario
    if racha_actual > racha_maxima:
        racha_maxima = racha_actual
    
    nivel = min(50, 1 + total_puntos // 100)
    
    cur.execute("""
        UPDATE estadisticas_usuario 
        SET puntos_totales = %s, 
            nivel = %s, 
            racha_actual = %s, 
            racha_maxima = %s,
            ultima_actividad = %s
        WHERE user_id = %s;
    """, (total_puntos, nivel, racha_actual, racha_maxima, ultima_actividad, user_id))
    
    return total_puntos, racha_actual, racha_maxima


def generate_reflexiones(cur, user_id, perfil_config, num_reflexiones=None):
    """Genera reflexiones diarias para el usuario"""
    if num_reflexiones is None:
        num_reflexiones = random.randint(10, 25)
    
    # Distribuir reflexiones en los últimos 45 días
    fechas_disponibles = [date.today() - timedelta(days=i) for i in range(1, 46)]
    fechas_seleccionadas = random.sample(fechas_disponibles, min(num_reflexiones, len(fechas_disponibles)))
    
    prob_completar = perfil_config["probabilidad_completar"]
    
    for fecha in sorted(fechas_seleccionadas):
        # Estado de ánimo correlacionado con probabilidad de completar
        if prob_completar > 0.7:
            estado = random.choices(ESTADOS_ANIMO, weights=[30, 40, 20, 8, 2])[0]
        elif prob_completar > 0.5:
            estado = random.choices(ESTADOS_ANIMO, weights=[15, 35, 30, 15, 5])[0]
        else:
            estado = random.choices(ESTADOS_ANIMO, weights=[10, 25, 35, 20, 10])[0]
        
        # Texto de reflexión (a veces vacío)
        que_salio_bien = random.choice(REFLEXIONES_POSITIVAS) if random.random() > 0.3 else None
        que_mejorar = random.choice(REFLEXIONES_MEJORAS) if random.random() > 0.4 else None
        
        try:
            cur.execute("""
                INSERT INTO reflexiones_diarias (user_id, fecha, estado_animo, que_salio_bien, que_mejorar)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (user_id, fecha) DO NOTHING;
            """, (user_id, fecha, estado, que_salio_bien, que_mejorar))
        except Exception:
            pass


def run_seed():
    """Ejecuta el proceso de seeding completo"""
    print("=" * 60)
    print("🌱 TASKPIN SEED DATA SCRIPT")
    print("=" * 60)
    
    conn = get_connection()
    
    try:
        with conn.cursor() as cur:
            # Obtener hábitos existentes
            habitos = get_existing_habitos(cur)
            if not habitos:
                print("❌ No hay hábitos predeterminados en la base de datos.")
                print("   Por favor, asegúrate de que la base de datos esté inicializada.")
                return False
            
            print(f"📋 Encontrados {len(habitos)} hábitos predeterminados")
            
            # Obtener emails existentes para evitar duplicados
            existing_emails = get_existing_users_emails(cur)
            print(f"👥 Usuarios existentes: {len(existing_emails)}")
            
            # Crear usuarios de prueba
            users_created = []
            for user_data in SEED_USERS:
                if user_data["correo"] in existing_emails:
                    print(f"   ⏭️  Saltando {user_data['nombre']} (ya existe)")
                    continue
                
                user_id = create_user(cur, user_data["nombre"], user_data["correo"])
                create_estadisticas_usuario(cur, user_id)
                users_created.append({
                    "user_id": user_id,
                    "nombre": user_data["nombre"],
                    "perfil": user_data["perfil"]
                })
                print(f"   ✅ Creado: {user_data['nombre']} (ID: {user_id}, Perfil: {user_data['perfil']})")
            
            if not users_created:
                print("\n⚠️  No se crearon nuevos usuarios (todos ya existían)")
                conn.commit()
                return True
            
            print(f"\n📊 Generando datos para {len(users_created)} usuarios...")
            
            # Para cada usuario, asignar hábitos y generar historial
            for user in users_created:
                user_id = user["user_id"]
                perfil = user["perfil"]
                perfil_config = PERFIL_PREFERENCIAS[perfil]
                
                # Asignar hábitos
                user_habitos = assign_habits_to_user(cur, user_id, habitos, perfil_config)
                
                # Generar historial de completado
                puntos, racha, max_racha = generate_completion_history(
                    cur, user_id, user_habitos, perfil_config
                )
                
                # Generar reflexiones
                generate_reflexiones(cur, user_id, perfil_config)
                
                print(f"   📈 {user['nombre']}: {len(user_habitos)} hábitos, "
                      f"{puntos} pts, racha: {racha}, max: {max_racha}")
            
            # Commit todos los cambios
            conn.commit()
            
            print("\n" + "=" * 60)
            print("✅ SEED COMPLETADO EXITOSAMENTE")
            print("=" * 60)
            print(f"   • Usuarios creados: {len(users_created)}")
            print(f"   • Hábitos disponibles: {len(habitos)}")
            print(f"   • Contraseña de todos los usuarios: Test123!")
            print("=" * 60)
            
            return True
            
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()


def show_stats():
    """Muestra estadísticas de los datos sembrados"""
    print("\n📊 ESTADÍSTICAS DE LA BASE DE DATOS")
    print("-" * 40)
    
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Total usuarios
            cur.execute("SELECT COUNT(*) FROM usuarios;")
            total_users = cur.fetchone()[0]
            
            # Usuarios de prueba (los que tienen correo @test.com)
            cur.execute("SELECT COUNT(*) FROM usuarios WHERE correo LIKE '%@test.com';")
            test_users = cur.fetchone()[0]
            
            # Total hábitos de usuario
            cur.execute("SELECT COUNT(*) FROM habitos_usuario WHERE activo = true;")
            total_habitos_usuario = cur.fetchone()[0]
            
            # Total registros de seguimiento
            cur.execute("SELECT COUNT(*) FROM seguimiento_habitos WHERE completado = true;")
            total_completados = cur.fetchone()[0]
            
            # Total reflexiones
            cur.execute("SELECT COUNT(*) FROM reflexiones_diarias;")
            total_reflexiones = cur.fetchone()[0]
            
            print(f"   👥 Total usuarios: {total_users} ({test_users} de prueba)")
            print(f"   📋 Hábitos activos: {total_habitos_usuario}")
            print(f"   ✅ Registros completados: {total_completados}")
            print(f"   📝 Reflexiones: {total_reflexiones}")
            
    finally:
        conn.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed data for Taskpin AI")
    parser.add_argument("--stats", action="store_true", help="Solo mostrar estadísticas")
    args = parser.parse_args()
    
    if args.stats:
        show_stats()
    else:
        success = run_seed()
        if success:
            show_stats()
        sys.exit(0 if success else 1)
