import psycopg  # Importa el módulo psycopg para manejar excepciones
from ..database import get_pool  # Importar pool de conexiones

class habitConnection():
    """
    Clase para manejar operaciones de hábitos.
    Usa el pool de conexiones compartido.
    """
    
    def __init__(self):
        # Ya no creamos conexión aquí, usamos el pool
        pass

    def get_categorias_habitos(self):
        """Obtiene todas las categorías de hábitos"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT categoria_id, nombre, descripcion, icono, orden 
                    FROM categorias_habitos
                    ORDER BY orden;
                """)
                return cur.fetchall()

    def get_habitos_by_categoria(self, categoria_id):
        """Obtiene todos los hábitos predeterminados de una categoría específica"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT h.habito_id, h.categoria_id, h.nombre, h.descripcion, 
                           h.frecuencia_recomendada, h.puntos_base, c.nombre as categoria_nombre
                    FROM habitos_predeterminados h
                    INNER JOIN categorias_habitos c ON h.categoria_id = c.categoria_id
                    WHERE h.categoria_id = %s
                    ORDER BY h.habito_id;
                """, (categoria_id,))
                return cur.fetchall()

    def get_all_habitos_predeterminados(self):
        """Obtiene todos los hábitos predeterminados con su categoría"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT h.habito_id, h.categoria_id, h.nombre, h.descripcion, 
                           h.frecuencia_recomendada, h.puntos_base, c.nombre as categoria_nombre
                    FROM habitos_predeterminados h
                    INNER JOIN categorias_habitos c ON h.categoria_id = c.categoria_id
                    ORDER BY c.orden, h.habito_id;
                """)
                return cur.fetchall()

    def get_habito_by_id(self, habito_id):
        """Obtiene un hábito específico por su ID"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT h.habito_id, h.categoria_id, h.nombre, h.descripcion, 
                           h.frecuencia_recomendada, h.puntos_base, c.nombre as categoria_nombre
                    FROM habitos_predeterminados h
                    INNER JOIN categorias_habitos c ON h.categoria_id = c.categoria_id
                    WHERE h.habito_id = %s;
                """, (habito_id,))
                return cur.fetchone()

    def add_habito_to_user(self, user_id, habito_id, frecuencia_personal='diario'):
        """Agrega un hábito predeterminado al perfil del usuario"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        INSERT INTO habitos_usuario (user_id, habito_id, frecuencia_personal, activo)
                        VALUES (%s, %s, %s, %s)
                        RETURNING habito_usuario_id;
                    """, (user_id, habito_id, frecuencia_personal, True))
                    
                    habito_usuario_id = cur.fetchone()[0]
                    conn.commit()
                    return habito_usuario_id
                    
                except psycopg.IntegrityError:
                    # El hábito ya está agregado para este usuario
                    conn.rollback()
                    return None

    def get_user_habitos(self, user_id):
        """Obtiene todos los hábitos activos de un usuario"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT hu.habito_usuario_id, hu.user_id, hu.habito_id, hu.fecha_agregado,
                           hu.activo, hu.frecuencia_personal, 
                           h.nombre, h.descripcion, h.puntos_base, c.nombre as categoria_nombre
                    FROM habitos_usuario hu
                    INNER JOIN habitos_predeterminados h ON hu.habito_id = h.habito_id
                    INNER JOIN categorias_habitos c ON h.categoria_id = c.categoria_id
                    WHERE hu.user_id = %s AND hu.activo = true
                    ORDER BY hu.fecha_agregado DESC;
                """, (user_id,))
                return cur.fetchall()

    def get_user_habito_ids(self, user_id):
        """Obtiene solo los IDs de hábitos predeterminados que el usuario ya tiene (para filtrado)"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT habito_id 
                    FROM habitos_usuario 
                    WHERE user_id = %s AND activo = true;
                """, (user_id,))
                return [row[0] for row in cur.fetchall()]

    def remove_habito_from_user(self, user_id, habito_id):
        """Desactiva un hábito del usuario (soft delete)"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE habitos_usuario 
                    SET activo = false 
                    WHERE user_id = %s AND habito_id = %s;
                """, (user_id, habito_id))
                conn.commit()
                return cur.rowcount > 0

    def update_habito_frecuencia(self, habito_usuario_id, frecuencia_personal):
        """Actualiza la frecuencia personal de un hábito del usuario"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE habitos_usuario 
                    SET frecuencia_personal = %s 
                    WHERE habito_usuario_id = %s AND activo = true
                    RETURNING habito_usuario_id, frecuencia_personal;
                """, (frecuencia_personal, habito_usuario_id))
                result = cur.fetchone()
                conn.commit()
                return result

    def get_habito_usuario_detalle(self, habito_usuario_id, user_id):
        """Obtiene el detalle completo de un hábito del usuario incluyendo estadísticas"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                # Info básica del hábito
                cur.execute("""
                    SELECT 
                        hu.habito_usuario_id,
                        hu.user_id,
                        hu.habito_id,
                        hu.fecha_agregado,
                        hu.activo,
                        hu.frecuencia_personal,
                        h.nombre,
                        h.descripcion,
                        h.puntos_base,
                        h.frecuencia_recomendada,
                        c.nombre as categoria_nombre,
                        c.icono as categoria_icono,
                        c.categoria_id
                    FROM habitos_usuario hu
                    INNER JOIN habitos_predeterminados h ON hu.habito_id = h.habito_id
                    INNER JOIN categorias_habitos c ON h.categoria_id = c.categoria_id
                    WHERE hu.habito_usuario_id = %s 
                      AND hu.user_id = %s 
                      AND hu.activo = true;
                """, (habito_usuario_id, user_id))
                habito_info = cur.fetchone()
                
                if not habito_info:
                    return None
                
                # Estadísticas: días completados total
                cur.execute("""
                    SELECT COUNT(*) 
                    FROM seguimiento_habitos 
                    WHERE habito_usuario_id = %s AND completado = true;
                """, (habito_usuario_id,))
                dias_completados = cur.fetchone()[0]
                
                # Estadísticas: racha actual
                cur.execute("""
                    SELECT fecha FROM seguimiento_habitos 
                    WHERE habito_usuario_id = %s AND completado = true
                    ORDER BY fecha DESC;
                """, (habito_usuario_id,))
                fechas = [row[0] for row in cur.fetchall()]
                
                racha_actual = 0
                if fechas:
                    from datetime import date, timedelta
                    hoy = date.today()
                    fecha_esperada = hoy
                    for fecha in fechas:
                        if fecha == fecha_esperada or fecha == fecha_esperada - timedelta(days=1):
                            racha_actual += 1
                            fecha_esperada = fecha - timedelta(days=1)
                        else:
                            break
                
                return {
                    'habito_usuario_id': habito_info[0],
                    'user_id': habito_info[1],
                    'habito_id': habito_info[2],
                    'fecha_agregado': habito_info[3],
                    'activo': habito_info[4],
                    'frecuencia_personal': habito_info[5],
                    'nombre': habito_info[6],
                    'descripcion': habito_info[7],
                    'puntos_base': habito_info[8],
                    'frecuencia_recomendada': habito_info[9],
                    'categoria_nombre': habito_info[10],
                    'categoria_icono': habito_info[11],
                    'categoria_id': habito_info[12],
                    'estadisticas': {
                        'dias_completados': dias_completados,
                        'racha_actual': racha_actual,
                    }
                }

    def create_habito_personalizado(self, user_id, nombre, descripcion=None, frecuencia_personal='diario'):
        """Crea un hábito personalizado y lo agrega automáticamente al usuario"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    # 1. Crear el hábito en habitos_predeterminados
                    cur.execute("""
                        INSERT INTO habitos_predeterminados 
                        (categoria_id, nombre, descripcion, frecuencia_recomendada, 
                         puntos_base, es_personalizado, creado_por_user_id)
                        VALUES (6, %s, %s, 'diario', 10, true, %s)
                        RETURNING habito_id;
                    """, (nombre, descripcion, user_id))
                    habito_id = cur.fetchone()[0]
                    
                    # 2. Agregarlo automáticamente al usuario
                    cur.execute("""
                        INSERT INTO habitos_usuario (user_id, habito_id, frecuencia_personal, activo)
                        VALUES (%s, %s, %s, true)
                        RETURNING habito_usuario_id;
                    """, (user_id, habito_id, frecuencia_personal))
                    habito_usuario_id = cur.fetchone()[0]
                    
                    conn.commit()
                    return {
                        'habito_id': habito_id,
                        'habito_usuario_id': habito_usuario_id,
                        'nombre': nombre,
                        'descripcion': descripcion,
                        'puntos_base': 10,
                        'frecuencia_personal': frecuencia_personal,
                        'categoria_nombre': 'My Custom Habits'
                    }
                except Exception as e:
                    conn.rollback()
                    raise e

    def update_habito_personalizado(self, user_id, habito_id, nombre=None, descripcion=None):
        """Edita un hábito personalizado (solo si el usuario es el creador)"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                # Verificar que el hábito es personalizado Y del usuario
                cur.execute("""
                    SELECT habito_id FROM habitos_predeterminados
                    WHERE habito_id = %s 
                      AND es_personalizado = true 
                      AND creado_por_user_id = %s;
                """, (habito_id, user_id))
                
                if not cur.fetchone():
                    return None  # No existe o no es del usuario
                
                # Construir UPDATE dinámico según los campos proporcionados
                updates = []
                values = []
                if nombre is not None:
                    updates.append("nombre = %s")
                    values.append(nombre)
                if descripcion is not None:
                    updates.append("descripcion = %s")
                    values.append(descripcion)
                
                if not updates:
                    # Si no hay nada que actualizar, devolver datos actuales
                    cur.execute("""
                        SELECT habito_id, nombre, descripcion 
                        FROM habitos_predeterminados WHERE habito_id = %s;
                    """, (habito_id,))
                    result = cur.fetchone()
                    return {
                        'habito_id': result[0],
                        'nombre': result[1],
                        'descripcion': result[2]
                    }
                
                values.extend([habito_id, user_id])
                cur.execute(f"""
                    UPDATE habitos_predeterminados
                    SET {', '.join(updates)}
                    WHERE habito_id = %s AND creado_por_user_id = %s
                    RETURNING habito_id, nombre, descripcion;
                """, values)
                
                result = cur.fetchone()
                conn.commit()
                return {
                    'habito_id': result[0],
                    'nombre': result[1],
                    'descripcion': result[2]
                }

    def delete_habito_personalizado(self, user_id, habito_id):
        """Elimina completamente un hábito personalizado (solo si el usuario es el creador)"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                # Verificar que el hábito es personalizado Y del usuario
                cur.execute("""
                    SELECT habito_id FROM habitos_predeterminados
                    WHERE habito_id = %s 
                      AND es_personalizado = true 
                      AND creado_por_user_id = %s;
                """, (habito_id, user_id))
                
                if not cur.fetchone():
                    return False  # No existe o no es del usuario
                
                # Eliminar de habitos_usuario primero (por integridad referencial)
                cur.execute("""
                    DELETE FROM habitos_usuario 
                    WHERE habito_id = %s;
                """, (habito_id,))
                
                # Eliminar de habitos_predeterminados
                cur.execute("""
                    DELETE FROM habitos_predeterminados 
                    WHERE habito_id = %s AND creado_por_user_id = %s;
                """, (habito_id, user_id))
                
                conn.commit()
                return True

    def get_user_custom_habitos(self, user_id):
        """Obtiene todos los hábitos personalizados creados por el usuario"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        h.habito_id, h.nombre, h.descripcion, h.puntos_base,
                        hu.habito_usuario_id, hu.frecuencia_personal, hu.fecha_agregado
                    FROM habitos_predeterminados h
                    LEFT JOIN habitos_usuario hu ON h.habito_id = hu.habito_id 
                        AND hu.user_id = %s AND hu.activo = true
                    WHERE h.es_personalizado = true 
                      AND h.creado_por_user_id = %s
                    ORDER BY h.habito_id DESC;
                """, (user_id, user_id))
                
                results = cur.fetchall()
                return [{
                    'habito_id': row[0],
                    'nombre': row[1],
                    'descripcion': row[2],
                    'puntos_base': row[3],
                    'habito_usuario_id': row[4],
                    'frecuencia_personal': row[5],
                    'fecha_agregado': row[6],
                    'categoria_nombre': 'My Custom Habits'
                } for row in results]