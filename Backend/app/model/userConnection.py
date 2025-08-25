import psycopg  # Importa el módulo psycopg para conectarse a PostgreSQL
from passlib.context import CryptContext  # Para hashear contraseñas

# Configuración para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class userConnection():
    conn = None

    def __init__(self):
        try:
            # IMPORTANTE: Asegúrate de que apunte a la base de datos 'taskpin'
            self.conn = psycopg.connect("dbname=taskpin user=postgres password=210315142320 host=localhost port=5432")
        except psycopg.OperationalError as err:
            print(f"Error de conexión a la base de datos: {err}")

    def hash_password(self, password):
        """Hashea una contraseña"""
        return pwd_context.hash(password)

    def verify_password(self, plain_password, hashed_password):
        """Verifica una contraseña contra su hash"""
        return pwd_context.verify(plain_password, hashed_password)

    def read_all(self):
        """Lee todos los usuarios"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT user_id, nombre, correo, contraseña, fecha_registro, activo 
                FROM usuarios
                ORDER BY fecha_registro DESC;
            """)
            return cur.fetchall()

    def read_one(self, user_id):
        """Lee un usuario por su ID"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT user_id, nombre, correo, contraseña, fecha_registro, activo 
                FROM usuarios 
                WHERE user_id = %s;
            """, (user_id,))
            return cur.fetchone()

    def read_by_email(self, correo):
        """Lee un usuario por correo electrónico"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT user_id, nombre, correo, contraseña, fecha_registro, activo 
                FROM usuarios 
                WHERE correo = %s;
            """, (correo,))
            return cur.fetchone()

    def write(self, data):
        """Inserta un nuevo usuario"""
        with self.conn.cursor() as cur:
            # Hashear la contraseña antes de guardarla
            hashed_password = self.hash_password(data['contraseña'])
            
            cur.execute("""
                INSERT INTO usuarios (nombre, correo, contraseña, activo) 
                VALUES (%(nombre)s, %(correo)s, %(contraseña)s, %(activo)s)
                RETURNING user_id;
            """, {
                'nombre': data['nombre'],
                'correo': data['correo'],
                'contraseña': hashed_password,
                'activo': data.get('activo', True)
            })
            
            # Obtener el ID del usuario recién creado
            user_id = cur.fetchone()[0]
            self.conn.commit()
            return user_id

    def update(self, user_id, data):
        """Actualiza un usuario existente"""
        with self.conn.cursor() as cur:
            # Construir la consulta dinámicamente basada en los campos proporcionados
            set_clauses = []
            params = {'user_id': user_id}
            
            if 'nombre' in data and data['nombre']:
                set_clauses.append("nombre = %(nombre)s")
                params['nombre'] = data['nombre']
            
            if 'correo' in data and data['correo']:
                set_clauses.append("correo = %(correo)s")
                params['correo'] = data['correo']
            
            if 'contraseña' in data and data['contraseña']:
                set_clauses.append("contraseña = %(contraseña)s")
                params['contraseña'] = self.hash_password(data['contraseña'])
            
            if 'activo' in data:
                set_clauses.append("activo = %(activo)s")
                params['activo'] = data['activo']
            
            if not set_clauses:
                return  # No hay nada que actualizar
            
            query = f"""
                UPDATE usuarios 
                SET {', '.join(set_clauses)}
                WHERE user_id = %(user_id)s;
            """
            
            cur.execute(query, params)
            self.conn.commit()

    def delete(self, user_id):
        """Elimina un usuario por ID"""
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM usuarios WHERE user_id = %s;
            """, (user_id,))
            self.conn.commit()

    def authenticate_user(self, correo, contraseña):
        """Autentica un usuario verificando correo y contraseña"""
        user = self.read_by_email(correo)
        if not user:
            return None
        
        # Verificar la contraseña
        if self.verify_password(contraseña, user[3]):  # user[3] es la contraseña hasheada
            return user
        return None