import psycopg  # Importa el módulo psycopg para conectarse a PostgreSQL

class habitConnection():
    conn = None

    def __init__(self):
        try:
            # IMPORTANTE: Misma conexión que userConnection
            self.conn = psycopg.connect("dbname=taskpin user=postgres password=123456 host=localhost port=5432")
        except psycopg.OperationalError as err:
            print(f"Error de conexión a la base de datos: {err}")

    def get_categorias_habitos(self):
        """Obtiene todas las categorías de hábitos"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT categoria_id, nombre, descripcion, icono, orden 
                FROM categorias_habitos
                ORDER BY orden;
            """)
            return cur.fetchall()

    def get_habitos_by_categoria(self, categoria_id):
        """Obtiene todos los hábitos predeterminados de una categoría específica"""
        with self.conn.cursor() as cur:
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
        with self.conn.cursor() as cur:
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
        with self.conn.cursor() as cur:
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
        with self.conn.cursor() as cur:
            try:
                cur.execute("""
                    INSERT INTO habitos_usuario (user_id, habito_id, frecuencia_personal, activo)
                    VALUES (%s, %s, %s, %s)
                    RETURNING habito_usuario_id;
                """, (user_id, habito_id, frecuencia_personal, True))
                
                habito_usuario_id = cur.fetchone()[0]
                self.conn.commit()
                return habito_usuario_id
                
            except psycopg.IntegrityError:
                # El hábito ya está agregado para este usuario
                self.conn.rollback()
                return None

    def get_user_habitos(self, user_id):
        """Obtiene todos los hábitos activos de un usuario"""
        with self.conn.cursor() as cur:
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

    def remove_habito_from_user(self, user_id, habito_id):
        """Desactiva un hábito del usuario (soft delete)"""
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE habitos_usuario 
                SET activo = false 
                WHERE user_id = %s AND habito_id = %s;
            """, (user_id, habito_id))
            self.conn.commit()
            return cur.rowcount > 0