import psycopg  # Importa el módulo psycopg para conectarse a PostgreSQL
from datetime import datetime, date  # Para calcular la edad

class userConnection():  # Clase para manejar la conexión y operaciones con la base de datos
    conn = None  # Atributo para almacenar la conexión

    def __init__(self):  # Constructor de la clase
        try:
            # Intenta establecer conexión con la base de datos
            self.conn = psycopg.connect("dbname=Math_M1M user=postgres password=210315142320 host=localhost port=5432")
        except psycopg.OperationalError as err:
            # Si hay un error de conexión, lo imprime
            print(err)
            # No se debe cerrar la conexión si falló, porque aún no existe
            # self.conn.close()  # Esta línea podría dar error si self.conn no se asignó

    def _calculate_age(self, birth_date):
        """Calcula la edad basada en la fecha de nacimiento"""
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    def read_all(self):  # Lee todos los registros de la tabla usuarios
        with self.conn.cursor() as cur:  # Abre un cursor
            data = cur.execute("""
                select * from "usuarios";
            """)  # Ejecuta la consulta
            return data.fetchall()  # Devuelve todos los resultados

    def read_one(self, id):  # Lee un solo usuario por su id
        with self.conn.cursor() as cur:
            data = cur.execute("""
                select * from "usuarios" where id = %s;
            """, (id,))  # Usa parámetro para evitar inyección SQL
            return data.fetchone()  # Devuelve un solo registro

    def read_by_email(self, correo_electronico):  # Lee un usuario por correo_electronico
        with self.conn.cursor() as cur:
            data = cur.execute("""
                select * from "usuarios" where correo_electronico = %s;
            """, (correo_electronico,))
            return data.fetchone()

    def write(self, data):  # Inserta un nuevo usuario
        with self.conn.cursor() as cur:
            # Calcula la edad si se proporciona fecha_nacimiento
            edad = None
            if 'fecha_nacimiento' in data:
                edad = self._calculate_age(data['fecha_nacimiento'])
            
            cur.execute("""
                insert into public.usuarios 
                ("nombre_completo", "correo_electronico", "usuario", "contraseña", "fecha_nacimiento", "edad", "puntos_totales", "activo") 
                values (%(nombre_completo)s, %(correo_electronico)s, %(usuario)s, %(contraseña)s, %(fecha_nacimiento)s, %(edad)s, %(puntos_totales)s, %(activo)s);
            """, {**data, 'edad': edad})  # Fusiona data con edad calculada
        self.conn.commit()  # Guarda los cambios

    def delete(self, id):  # Elimina un usuario por id
        with self.conn.cursor() as cur:
            cur.execute("""
                delete from "usuarios" where id = %s;
            """, (id,))  # Usa parámetro id
        self.conn.commit()  # Guarda los cambios

    def update(self, data):  # Actualiza un usuario existente
        with self.conn.cursor() as cur:
            # Calcula la edad si se proporciona fecha_nacimiento
            edad = None
            if 'fecha_nacimiento' in data:
                edad = self._calculate_age(data['fecha_nacimiento'])
                
            cur.execute("""
                update "usuarios" set 
                nombre_completo = %(nombre_completo)s, 
                correo_electronico = %(correo_electronico)s, 
                usuario = %(usuario)s,
                contraseña = %(contraseña)s,
                fecha_nacimiento = %(fecha_nacimiento)s,
                edad = %(edad)s,
                puntos_totales = %(puntos_totales)s,
                ultimo_acceso = CURRENT_TIMESTAMP,
                activo = %(activo)s
                where id = %(id)s;
            """, {**data, 'edad': edad})  # Fusiona data con edad calculada
        self.conn.commit()  # Guarda los cambios

    def update_last_access(self, id):  # Actualiza último acceso
        with self.conn.cursor() as cur:
            cur.execute("""
                update "usuarios" set ultimo_acceso = CURRENT_TIMESTAMP where id = %s;
            """, (id,))
        self.conn.commit()

    def update_points(self, id, points):  # Actualiza puntos
        with self.conn.cursor() as cur:
            cur.execute("""
                update "usuarios" set puntos_totales = puntos_totales + %s where id = %s;
            """, (points, id))
        self.conn.commit()

    def __del__(self):  # Destructor de la clase
        if self.conn:  # Si hay conexión activa
            self.conn.close()  # Cierra la conexión