#!/usr/bin/env python3
"""
Seed AI Test Users - 5 Usuarios de Prueba para el Modelo de IA

Este script crea 5 usuarios con patrones de comportamiento MUY diferentes
para probar las recomendaciones y predicciones del sistema de IA.

USO:
    cd Backend
    source .venv/bin/activate
    python -m scripts.seed_ai_test

USUARIOS:
    1. "Inconsistente" - Completa solo 30-40% aleatorio
    2. "Madrugador"    - 80%+ lunes-viernes, bajo fines de semana
    3. "Fin de semana" - Solo activo sábados y domingos
    4. "Super consistente" - 95%+ todos los días
    5. "Abandonador"   - Empezó bien, luego bajó a 20%
"""

import sys
import os
import random
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from passlib.context import CryptContext
import psycopg
from app.config import DATABASE_URL

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================
# CONFIGURACIÓN DE LOS 5 USUARIOS DE PRUEBA
# ============================================

AI_TEST_USERS = [
    {
        "nombre": "Test Inconsistente",
        "correo": "test.inconsistente@ai.test",
        "perfil": "inconsistente",
        "descripcion": "Completa solo 30-40% de forma aleatoria"
    },
    {
        "nombre": "Test Madrugador", 
        "correo": "test.madrugador@ai.test",
        "perfil": "madrugador",
        "descripcion": "Alto rendimiento lunes-viernes, bajo fines de semana"
    },
    {
        "nombre": "Test FinDeSemana",
        "correo": "test.findesemana@ai.test",
        "perfil": "fin_de_semana",
        "descripcion": "Solo activo sábados y domingos"
    },
    {
        "nombre": "Test SuperConsistente",
        "correo": "test.consistente@ai.test",
        "perfil": "super_consistente",
        "descripcion": "95%+ completado todos los días"
    },
    {
        "nombre": "Test Abandonador",
        "correo": "test.abandonador@ai.test",
        "perfil": "abandonador",
        "descripcion": "Empezó con 85%, ahora solo 20%"
    },
]

# Configuración de comportamiento por perfil
PERFILES_CONFIG = {
    "inconsistente": {
        "num_habitos": 10,
        "dias_historial": 75,
        "categorias": [1, 2, 3, 4],  # Todas las categorías
    },
    "madrugador": {
        "num_habitos": 8,
        "dias_historial": 60,
        "categorias": [1, 3],  # Fitness y Productividad
    },
    "fin_de_semana": {
        "num_habitos": 8,
        "dias_historial": 60,
        "categorias": [2, 4],  # Mind y Social
    },
    "super_consistente": {
        "num_habitos": 6,
        "dias_historial": 90,
        "categorias": [1, 2],  # Fitness y Mind
    },
    "abandonador": {
        "num_habitos": 12,
        "dias_historial": 60,
        "categorias": [1, 2, 3, 4],  # Empezó con muchos
    },
}


def get_connection():
    return psycopg.connect(DATABASE_URL)


def get_habitos_por_categoria(cur):
    """Obtiene hábitos agrupados por categoría"""
    cur.execute("""
        SELECT habito_id, categoria_id, nombre, puntos_base 
        FROM habitos_predeterminados
        WHERE es_personalizado = false OR es_personalizado IS NULL
        ORDER BY categoria_id, habito_id;
    """)
    habitos = cur.fetchall()
    
    # Agrupar por categoría
    por_categoria = {}
    for h in habitos:
        cat_id = h[1]
        if cat_id not in por_categoria:
            por_categoria[cat_id] = []
        por_categoria[cat_id].append(h)
    
    return por_categoria


def create_user(cur, nombre, correo):
    """Crea usuario y retorna user_id"""
    hashed = pwd_context.hash("Test123!")
    cur.execute("""
        INSERT INTO usuarios (nombre, correo, contraseña, activo)
        VALUES (%s, %s, %s, true)
        RETURNING user_id;
    """, (nombre, correo, hashed))
    return cur.fetchone()[0]


def create_estadisticas(cur, user_id):
    """Crea registro de estadísticas"""
    cur.execute("""
        INSERT INTO estadisticas_usuario (user_id, puntos_totales, nivel, racha_actual, racha_maxima)
        VALUES (%s, 0, 1, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;
    """, (user_id,))


def assign_habitos(cur, user_id, habitos_por_cat, config):
    """Asigna hábitos al usuario según configuración"""
    habitos_asignados = []
    num_habitos = config["num_habitos"]
    categorias = config["categorias"]
    dias_historial = config["dias_historial"]
    
    # Recolectar hábitos de las categorías configuradas
    pool_habitos = []
    for cat_id in categorias:
        if cat_id in habitos_por_cat:
            pool_habitos.extend(habitos_por_cat[cat_id])
    
    # Si no hay suficientes, agregar de otras categorías
    if len(pool_habitos) < num_habitos:
        for cat_id, habitos in habitos_por_cat.items():
            if cat_id not in categorias:
                pool_habitos.extend(habitos)
    
    # Seleccionar hábitos
    selected = random.sample(pool_habitos, min(num_habitos, len(pool_habitos)))
    
    # Insertar
    fecha_agregado = date.today() - timedelta(days=dias_historial)
    
    for habito in selected:
        habito_id, cat_id, nombre, puntos = habito
        try:
            cur.execute("""
                INSERT INTO habitos_usuario (user_id, habito_id, frecuencia_personal, activo, fecha_agregado)
                VALUES (%s, %s, 'diario', true, %s)
                RETURNING habito_usuario_id;
            """, (user_id, habito_id, fecha_agregado))
            
            hu_id = cur.fetchone()[0]
            habitos_asignados.append({
                "habito_usuario_id": hu_id,
                "habito_id": habito_id,
                "nombre": nombre,
                "puntos": puntos or 10,
                "fecha_agregado": fecha_agregado
            })
        except psycopg.IntegrityError:
            continue
    
    return habitos_asignados


def should_complete(perfil: str, fecha: date, dias_desde_inicio: int) -> bool:
    """
    Decide si el usuario completó el hábito en una fecha dada.
    Esta es la lógica central que crea patrones únicos por perfil.
    """
    dia_semana = fecha.weekday()  # 0=Lunes, 6=Domingo
    es_fin_de_semana = dia_semana >= 5
    
    if perfil == "inconsistente":
        # 30-40% aleatorio, sin patrón
        return random.random() < 0.35
    
    elif perfil == "madrugador":
        # 85% lunes-viernes, 20% fines de semana
        if es_fin_de_semana:
            return random.random() < 0.20
        else:
            return random.random() < 0.85
    
    elif perfil == "fin_de_semana":
        # 5% lunes-viernes, 90% fines de semana
        if es_fin_de_semana:
            return random.random() < 0.90
        else:
            return random.random() < 0.05
    
    elif perfil == "super_consistente":
        # 95% todos los días
        return random.random() < 0.95
    
    elif perfil == "abandonador":
        # Primeras 3 semanas: 85%, después: 20%
        if dias_desde_inicio <= 21:
            return random.random() < 0.85
        else:
            return random.random() < 0.20
    
    return random.random() < 0.5


def generate_historial(cur, user_id, habitos, perfil, dias_historial):
    """Genera historial de completado según el perfil"""
    total_puntos = 0
    hoy = date.today()
    
    for habito in habitos:
        hu_id = habito["habito_usuario_id"]
        puntos = habito["puntos"]
        fecha_inicio = habito["fecha_agregado"]
        
        fecha_actual = fecha_inicio
        dias_desde_inicio = 0
        
        while fecha_actual < hoy:
            completado = should_complete(perfil, fecha_actual, dias_desde_inicio)
            
            if completado:
                # Hora aleatoria entre 6am y 10pm
                hora = f"{random.randint(6, 22):02d}:{random.randint(0, 59):02d}:00"
                
                try:
                    cur.execute("""
                        INSERT INTO seguimiento_habitos 
                        (habito_usuario_id, fecha, completado, hora_completado)
                        VALUES (%s, %s, true, %s)
                        ON CONFLICT (habito_usuario_id, fecha) DO UPDATE SET completado = true;
                    """, (hu_id, fecha_actual, hora))
                    
                    total_puntos += puntos
                except Exception:
                    pass
            
            fecha_actual += timedelta(days=1)
            dias_desde_inicio += 1
    
    return total_puntos


def update_estadisticas(cur, user_id, total_puntos):
    """Actualiza estadísticas del usuario"""
    # Calcular nivel basado en puntos
    nivel = min(50, max(1, total_puntos // 100 + 1))
    
    # Calcular racha actual (días consecutivos hasta ayer)
    cur.execute("""
        SELECT COUNT(DISTINCT sh.fecha) as dias_racha
        FROM seguimiento_habitos sh
        JOIN habitos_usuario hu ON sh.habito_usuario_id = hu.habito_usuario_id
        WHERE hu.user_id = %s 
        AND sh.completado = true
        AND sh.fecha >= CURRENT_DATE - INTERVAL '30 days'
        AND sh.fecha < CURRENT_DATE;
    """, (user_id,))
    
    result = cur.fetchone()
    racha = result[0] if result else 0
    
    cur.execute("""
        UPDATE estadisticas_usuario 
        SET puntos_totales = %s,
            nivel = %s,
            racha_actual = %s,
            racha_maxima = GREATEST(racha_maxima, %s),
            ultima_actividad = CURRENT_DATE - INTERVAL '1 day'
        WHERE user_id = %s;
    """, (total_puntos, nivel, min(racha, 30), min(racha, 30), user_id))


def main():
    print("=" * 60)
    print("  SEED AI TEST - Creando 5 Usuarios de Prueba para IA")
    print("=" * 60)
    
    conn = get_connection()
    
    try:
        with conn.cursor() as cur:
            # Verificar si ya existen
            cur.execute("SELECT correo FROM usuarios WHERE correo LIKE '%@ai.test';")
            existing = {row[0] for row in cur.fetchall()}
            
            if existing:
                print(f"\n⚠️  Ya existen {len(existing)} usuarios de prueba AI:")
                for e in existing:
                    print(f"   - {e}")
                print("\n   Saltando creación. Elimínalos primero si quieres recrearlos.")
                print("   DELETE FROM usuarios WHERE correo LIKE '%@ai.test';")
                return
            
            # Obtener hábitos disponibles
            habitos_por_cat = get_habitos_por_categoria(cur)
            print(f"\n📚 Hábitos disponibles por categoría:")
            for cat_id, habitos in habitos_por_cat.items():
                print(f"   Categoría {cat_id}: {len(habitos)} hábitos")
            
            # Crear cada usuario
            for user_data in AI_TEST_USERS:
                nombre = user_data["nombre"]
                correo = user_data["correo"]
                perfil = user_data["perfil"]
                config = PERFILES_CONFIG[perfil]
                
                print(f"\n{'─' * 50}")
                print(f"👤 Creando: {nombre}")
                print(f"   Perfil: {perfil}")
                print(f"   {user_data['descripcion']}")
                
                # 1. Crear usuario
                user_id = create_user(cur, nombre, correo)
                print(f"   ✅ User ID: {user_id}")
                
                # 2. Crear estadísticas
                create_estadisticas(cur, user_id)
                
                # 3. Asignar hábitos
                habitos = assign_habitos(cur, user_id, habitos_por_cat, config)
                print(f"   ✅ Hábitos asignados: {len(habitos)}")
                for h in habitos[:3]:
                    print(f"      - {h['nombre']}")
                if len(habitos) > 3:
                    print(f"      ... y {len(habitos) - 3} más")
                
                # 4. Generar historial
                total_puntos = generate_historial(
                    cur, user_id, habitos, perfil, config["dias_historial"]
                )
                print(f"   ✅ Historial: {config['dias_historial']} días")
                print(f"   ✅ Puntos generados: {total_puntos}")
                
                # 5. Actualizar estadísticas
                update_estadisticas(cur, user_id, total_puntos)
            
            conn.commit()
            
            print(f"\n{'=' * 60}")
            print("  ✅ ¡5 USUARIOS DE PRUEBA CREADOS EXITOSAMENTE!")
            print("=" * 60)
            print("\n📋 Credenciales para todos: Password = Test123!")
            print("\n🔄 Para que el modelo aprenda los nuevos patrones:")
            print("   curl -X POST http://localhost:8000/api/ai/entrenar \\")
            print("     -H 'Authorization: Bearer <token>'")
            print("\n🧹 Para limpiar cache y ver resultados frescos:")
            print("   El cache se invalida automáticamente en 30-60 min")
            print("   O reinicia el backend para limpiar inmediatamente")
            
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
