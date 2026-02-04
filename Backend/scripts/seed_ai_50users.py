#!/usr/bin/env python3
"""
Seed 50 Usuarios para Entrenamiento de IA
==========================================

Crea 50 usuarios con patrones MUY variados para entrenar el modelo
de predicción con datos balanceados (completados Y no completados).

PERFILES (5 usuarios cada uno):
1. Elite         - 95-100% completado
2. Consistente   - 80-90% completado
3. Madrugador    - 85% L-V, 20% S-D
4. Nocturno      - 20% L-V, 85% S-D  
5. Promedio      - 60-70% completado
6. Irregular     - 40-50% aleatorio
7. Principiante  - 70%→50% decayendo
8. Recuperandose - 30%→70% mejorando
9. Abandonador   - 80%→15% caída fuerte
10. Esporadico   - 20-30% muy bajo

USO:
    cd Backend
    source .venv/bin/activate
    python -m scripts.seed_ai_50users

IMPORTANTE: Inserta TODOS los días (completados Y no completados)
para que el modelo tenga datos balanceados.
"""

import sys
import random
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from passlib.context import CryptContext
import psycopg
from app.config import DATABASE_URL

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================
# CONFIGURACIÓN DE PERFILES
# ============================================

PERFILES = {
    "elite": {
        "descripcion": "95-100% todos los días",
        "num_habitos": (6, 8),
        "dias_historial": (75, 90),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: 0.97
    },
    "consistente": {
        "descripcion": "80-90% estable",
        "num_habitos": (7, 10),
        "dias_historial": (60, 80),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: random.uniform(0.80, 0.90)
    },
    "madrugador": {
        "descripcion": "85% L-V, 20% S-D",
        "num_habitos": (6, 9),
        "dias_historial": (50, 70),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: 0.85 if dia < 5 else 0.20
    },
    "nocturno": {
        "descripcion": "20% L-V, 85% S-D",
        "num_habitos": (6, 9),
        "dias_historial": (50, 70),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: 0.20 if dia < 5 else 0.85
    },
    "promedio": {
        "descripcion": "60-70% normal",
        "num_habitos": (7, 11),
        "dias_historial": (55, 75),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: random.uniform(0.60, 0.70)
    },
    "irregular": {
        "descripcion": "40-50% aleatorio",
        "num_habitos": (8, 12),
        "dias_historial": (50, 70),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: random.uniform(0.40, 0.50)
    },
    "principiante": {
        "descripcion": "70%→50% decayendo",
        "num_habitos": (8, 12),
        "dias_historial": (45, 65),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: 0.70 - (0.20 * dias_desde_inicio / max(total_dias, 1))
    },
    "recuperandose": {
        "descripcion": "30%→70% mejorando",
        "num_habitos": (6, 9),
        "dias_historial": (50, 70),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: 0.30 + (0.40 * dias_desde_inicio / max(total_dias, 1))
    },
    "abandonador": {
        "descripcion": "80%→15% caída fuerte",
        "num_habitos": (10, 14),
        "dias_historial": (55, 75),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: 0.80 if dias_desde_inicio < 20 else 0.15
    },
    "esporadico": {
        "descripcion": "20-30% muy bajo",
        "num_habitos": (8, 12),
        "dias_historial": (45, 65),
        "get_prob": lambda dia, dias_desde_inicio, total_dias: random.uniform(0.20, 0.30)
    },
}

# Nombres para generar usuarios
NOMBRES = [
    "Sofia", "Mateo", "Valentina", "Santiago", "Isabella", "Sebastian", "Camila", "Matias",
    "Mariana", "Nicolas", "Luciana", "Daniel", "Gabriela", "Alejandro", "Fernanda", "Diego",
    "Paula", "Andres", "Victoria", "Leonardo", "Renata", "Samuel", "Antonella", "Emiliano",
    "Catalina", "Joaquin", "Regina", "Adrian", "Valeria", "David", "Luna", "Felipe",
    "Martina", "Pablo", "Natalia", "Eduardo", "Emma", "Rodrigo", "Sara", "Carlos",
    "Daniela", "Ivan", "Ana", "Lucas", "Maria", "Jorge", "Elena", "Miguel", "Laura", "Oscar"
]

APELLIDOS = [
    "Garcia", "Rodriguez", "Martinez", "Lopez", "Hernandez", "Gonzalez", "Perez", "Sanchez",
    "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Reyes", "Morales", "Cruz",
    "Ortiz", "Gutierrez", "Chavez", "Ramos", "Vargas", "Castillo", "Jimenez", "Moreno"
]


def get_connection():
    return psycopg.connect(DATABASE_URL)


def get_habitos(cur):
    """Obtiene todos los hábitos disponibles"""
    cur.execute("""
        SELECT habito_id, categoria_id, nombre, puntos_base 
        FROM habitos_predeterminados
        WHERE es_personalizado = false OR es_personalizado IS NULL
        ORDER BY categoria_id;
    """)
    return cur.fetchall()


def generate_user_data(index, perfil_nombre):
    """Genera datos únicos para un usuario"""
    nombre = f"{random.choice(NOMBRES)} {random.choice(APELLIDOS)}"
    correo = f"ai.{perfil_nombre}.{index}@training.com"
    return nombre, correo


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


def assign_habitos(cur, user_id, habitos, num_habitos, dias_historial):
    """Asigna hábitos aleatorios al usuario"""
    selected = random.sample(habitos, min(num_habitos, len(habitos)))
    assigned = []
    
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
            assigned.append({
                "habito_usuario_id": hu_id,
                "puntos": puntos or 10,
                "fecha_agregado": fecha_agregado
            })
        except psycopg.IntegrityError:
            continue
    
    return assigned


def generate_historial(cur, user_id, habitos, perfil_config, dias_historial):
    """
    Genera historial de seguimiento para TODOS los días.
    IMPORTANTE: Inserta tanto completados como NO completados.
    """
    get_prob = perfil_config["get_prob"]
    hoy = date.today()
    
    total_completados = 0
    total_no_completados = 0
    total_puntos = 0
    
    for habito in habitos:
        hu_id = habito["habito_usuario_id"]
        puntos = habito["puntos"]
        fecha_inicio = habito["fecha_agregado"]
        total_dias = dias_historial
        
        fecha_actual = fecha_inicio
        dias_desde_inicio = 0
        
        while fecha_actual < hoy:
            dia_semana = fecha_actual.weekday()  # 0=Lunes, 6=Domingo
            
            # Calcular probabilidad según perfil
            prob = get_prob(dia_semana, dias_desde_inicio, total_dias)
            completado = random.random() < prob
            
            # INSERTAR SIEMPRE (completado o no)
            try:
                if completado:
                    hora = f"{random.randint(6, 22):02d}:{random.randint(0, 59):02d}:00"
                    cur.execute("""
                        INSERT INTO seguimiento_habitos 
                        (habito_usuario_id, fecha, completado, hora_completado)
                        VALUES (%s, %s, true, %s)
                        ON CONFLICT (habito_usuario_id, fecha) DO UPDATE SET completado = true;
                    """, (hu_id, fecha_actual, hora))
                    total_completados += 1
                    total_puntos += puntos
                else:
                    cur.execute("""
                        INSERT INTO seguimiento_habitos 
                        (habito_usuario_id, fecha, completado, hora_completado)
                        VALUES (%s, %s, false, NULL)
                        ON CONFLICT (habito_usuario_id, fecha) DO UPDATE SET completado = false;
                    """, (hu_id, fecha_actual))
                    total_no_completados += 1
            except Exception:
                pass
            
            fecha_actual += timedelta(days=1)
            dias_desde_inicio += 1
    
    return total_completados, total_no_completados, total_puntos


def update_estadisticas(cur, user_id, total_puntos):
    """Actualiza estadísticas del usuario"""
    nivel = min(50, max(1, total_puntos // 100 + 1))
    
    cur.execute("""
        UPDATE estadisticas_usuario 
        SET puntos_totales = %s,
            nivel = %s,
            racha_actual = %s,
            racha_maxima = %s,
            ultima_actividad = CURRENT_DATE - INTERVAL '1 day'
        WHERE user_id = %s;
    """, (total_puntos, nivel, random.randint(0, 15), random.randint(5, 30), user_id))


def main():
    print("=" * 70)
    print("  SEED 50 USUARIOS PARA ENTRENAMIENTO DE IA")
    print("=" * 70)
    
    conn = get_connection()
    
    try:
        with conn.cursor() as cur:
            # Verificar si ya existen usuarios de training
            cur.execute("SELECT COUNT(*) FROM usuarios WHERE correo LIKE '%@training.com';")
            existing = cur.fetchone()[0]
            
            if existing > 0:
                print(f"\n⚠️  Ya existen {existing} usuarios de training.")
                print("   Para recrear, primero elimínalos:")
                print("   DELETE FROM usuarios WHERE correo LIKE '%@training.com';")
                return
            
            # Obtener hábitos disponibles
            habitos = get_habitos(cur)
            print(f"\n📚 Hábitos disponibles: {len(habitos)}")
            
            # Estadísticas globales
            total_users = 0
            total_habitos_asignados = 0
            total_completados = 0
            total_no_completados = 0
            
            # Crear 5 usuarios por cada perfil (10 perfiles x 5 = 50 usuarios)
            for perfil_nombre, perfil_config in PERFILES.items():
                print(f"\n{'─' * 60}")
                print(f"📋 Perfil: {perfil_nombre.upper()}")
                print(f"   {perfil_config['descripcion']}")
                
                for i in range(5):
                    nombre, correo = generate_user_data(i + 1, perfil_nombre)
                    
                    # Crear usuario
                    user_id = create_user(cur, nombre, correo)
                    create_estadisticas(cur, user_id)
                    
                    # Configuración aleatoria dentro del rango
                    num_habitos = random.randint(*perfil_config["num_habitos"])
                    dias_historial = random.randint(*perfil_config["dias_historial"])
                    
                    # Asignar hábitos
                    habitos_asignados = assign_habitos(cur, user_id, habitos, num_habitos, dias_historial)
                    
                    # Generar historial (COMPLETOS Y NO COMPLETOS)
                    completados, no_completados, puntos = generate_historial(
                        cur, user_id, habitos_asignados, perfil_config, dias_historial
                    )
                    
                    # Actualizar estadísticas
                    update_estadisticas(cur, user_id, puntos)
                    
                    # Acumular
                    total_users += 1
                    total_habitos_asignados += len(habitos_asignados)
                    total_completados += completados
                    total_no_completados += no_completados
                    
                    tasa = completados / (completados + no_completados) * 100 if (completados + no_completados) > 0 else 0
                    print(f"   ✓ User {user_id}: {nombre[:20]:<20} | {len(habitos_asignados)} hábitos | {tasa:.0f}% completado")
            
            conn.commit()
            
            # Resumen final
            print(f"\n{'=' * 70}")
            print("  ✅ SEED COMPLETADO")
            print("=" * 70)
            print(f"\n📊 ESTADÍSTICAS FINALES:")
            print(f"   Usuarios creados: {total_users}")
            print(f"   Hábitos asignados: {total_habitos_asignados}")
            print(f"   Registros completados: {total_completados:,}")
            print(f"   Registros NO completados: {total_no_completados:,}")
            print(f"   Total registros: {total_completados + total_no_completados:,}")
            print(f"   Balance: {total_completados/(total_completados+total_no_completados)*100:.1f}% / {total_no_completados/(total_completados+total_no_completados)*100:.1f}%")
            
            print(f"\n🔄 SIGUIENTE PASO - Reentrenar el modelo:")
            print(f"   python -c \"from app.ai import HabitPredictor; p=HabitPredictor(); print(p.train(save=True))\"")
            
            print(f"\n📋 Credenciales: Password = Test123!")
            print(f"   Ejemplos de correos:")
            print(f"   - ai.elite.1@training.com (95%+ completado)")
            print(f"   - ai.esporadico.1@training.com (20-30% completado)")
            print(f"   - ai.madrugador.1@training.com (alto L-V, bajo S-D)")
            
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
