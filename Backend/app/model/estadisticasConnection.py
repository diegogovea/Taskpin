# Backend/app/model/estadisticasConnection.py
"""
Clase para manejar operaciones de estadísticas de usuario.
Sistema de puntos, rachas y niveles.
"""

from ..database import get_pool
from datetime import date, timedelta


class EstadisticasConnection:
    """
    Clase para manejar operaciones de estadísticas de usuario.
    Usa el pool de conexiones compartido.
    """
    
    def __init__(self):
        # Usamos el pool compartido, no creamos conexión aquí
        pass
    
    def get_estadisticas_usuario(self, user_id: int):
        """
        Obtiene las estadísticas de un usuario.
        
        Returns:
            tuple: (estadistica_id, user_id, puntos_totales, racha_actual, 
                   racha_maxima, nivel, ultima_actividad, fecha_creacion)
            None: si no existe
        """
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT estadistica_id, user_id, puntos_totales, 
                           racha_actual, racha_maxima, nivel, 
                           ultima_actividad, fecha_creacion
                    FROM estadisticas_usuario
                    WHERE user_id = %s;
                """, (user_id,))
                return cur.fetchone()
    
    def crear_estadisticas_usuario(self, user_id: int):
        """
        Crea registro de estadísticas para un nuevo usuario.
        Se usa al momento del registro.
        
        Returns:
            int: estadistica_id del registro creado
            None: si ya existe o hay error
        """
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        INSERT INTO estadisticas_usuario 
                            (user_id, puntos_totales, racha_actual, racha_maxima, nivel)
                        VALUES (%s, 0, 0, 0, 1)
                        ON CONFLICT (user_id) DO NOTHING
                        RETURNING estadistica_id;
                    """, (user_id,))
                    result = cur.fetchone()
                    conn.commit()
                    return result[0] if result else None
                except Exception as e:
                    conn.rollback()
                    print(f"Error al crear estadísticas: {e}")
                    return None
    
    def actualizar_puntos(self, user_id: int, puntos_delta: int):
        """
        Suma o resta puntos al usuario.
        
        Args:
            user_id: ID del usuario
            puntos_delta: Puntos a sumar (positivo) o restar (negativo)
        
        Returns:
            int: Nuevo total de puntos
            None: si hay error
        """
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        UPDATE estadisticas_usuario
                        SET puntos_totales = GREATEST(0, puntos_totales + %s)
                        WHERE user_id = %s
                        RETURNING puntos_totales;
                    """, (puntos_delta, user_id))
                    result = cur.fetchone()
                    conn.commit()
                    return result[0] if result else None
                except Exception as e:
                    conn.rollback()
                    print(f"Error al actualizar puntos: {e}")
                    return None
    
    def reset_racha_si_expirada(self, user_id: int):
        """
        Verifica si la racha del usuario está rota (sin actividad ayer ni hoy) y,
        de ser así, la pone a 0 en BD y devuelve 0.

        Llamar ANTES de exponer racha_actual al cliente (GET /estadisticas).

        Returns:
            int: racha_actual vigente (0 si se acaba de resetear, o la guardada si sigue viva)
            None: si no existe el registro
        """
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        SELECT racha_actual, ultima_actividad
                        FROM estadisticas_usuario
                        WHERE user_id = %s;
                    """, (user_id,))
                    result = cur.fetchone()
                    if not result:
                        return None

                    racha_actual, ultima_actividad = result
                    hoy = date.today()
                    ayer = hoy - timedelta(days=1)

                    # La racha sigue viva si la última actividad fue hoy o ayer
                    racha_viva = ultima_actividad is not None and ultima_actividad >= ayer

                    if not racha_viva and racha_actual != 0:
                        cur.execute("""
                            UPDATE estadisticas_usuario
                            SET racha_actual = 0
                            WHERE user_id = %s;
                        """, (user_id,))
                        conn.commit()
                        return 0

                    return racha_actual

                except Exception as e:
                    conn.rollback()
                    print(f"Error al verificar expiración de racha: {e}")
                    return None

    def actualizar_racha(self, user_id: int):
        """
        Actualiza la racha del usuario basándose en la última actividad.
        
        Lógica:
        - Si última actividad fue ayer: incrementar racha
        - Si última actividad fue hoy: no cambiar
        - Si última actividad fue antes de ayer: reiniciar a 1
        
        Returns:
            dict: {racha_actual, racha_maxima, actualizada}
            None: si hay error
        """
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    # Obtener última actividad
                    cur.execute("""
                        SELECT ultima_actividad, racha_actual, racha_maxima
                        FROM estadisticas_usuario
                        WHERE user_id = %s;
                    """, (user_id,))
                    result = cur.fetchone()
                    
                    if not result:
                        return None
                    
                    ultima_actividad, racha_actual, racha_maxima = result
                    hoy = date.today()
                    ayer = hoy - timedelta(days=1)
                    
                    nueva_racha = racha_actual
                    
                    if ultima_actividad is None:
                        # Primera actividad
                        nueva_racha = 1
                    elif ultima_actividad == hoy:
                        # Ya completó algo hoy, no cambiar racha
                        pass
                    elif ultima_actividad == ayer:
                        # Continúa la racha
                        nueva_racha = racha_actual + 1
                    else:
                        # Racha rota, reiniciar
                        nueva_racha = 1
                    
                    # Actualizar racha máxima si es necesario
                    nueva_racha_maxima = max(racha_maxima, nueva_racha)
                    
                    # Guardar cambios
                    cur.execute("""
                        UPDATE estadisticas_usuario
                        SET racha_actual = %s,
                            racha_maxima = %s,
                            ultima_actividad = %s
                        WHERE user_id = %s;
                    """, (nueva_racha, nueva_racha_maxima, hoy, user_id))
                    
                    conn.commit()
                    
                    return {
                        "racha_actual": nueva_racha,
                        "racha_maxima": nueva_racha_maxima,
                        "actualizada": nueva_racha != racha_actual
                    }
                    
                except Exception as e:
                    conn.rollback()
                    print(f"Error al actualizar racha: {e}")
                    return None
    
    def actualizar_nivel(self, user_id: int):
        """
        Recalcula y actualiza el nivel del usuario basándose en sus puntos.
        
        Fórmula: Nivel n requiere 50 * 2^(n-2) puntos adicionales
        - Nivel 1: 0 puntos
        - Nivel 2: 50 puntos
        - Nivel 3: 150 puntos (50 + 100)
        - Nivel 4: 350 puntos (150 + 200)
        - etc.
        
        Returns:
            dict: {nivel_anterior, nivel_nuevo, subio_nivel}
            None: si hay error
        """
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                try:
                    # Obtener puntos actuales y nivel
                    cur.execute("""
                        SELECT puntos_totales, nivel
                        FROM estadisticas_usuario
                        WHERE user_id = %s;
                    """, (user_id,))
                    result = cur.fetchone()
                    
                    if not result:
                        return None
                    
                    puntos_totales, nivel_actual = result
                    
                    # Calcular nivel correspondiente a los puntos
                    nuevo_nivel = self._calcular_nivel_por_puntos(puntos_totales)
                    
                    # Actualizar si cambió
                    if nuevo_nivel != nivel_actual:
                        cur.execute("""
                            UPDATE estadisticas_usuario
                            SET nivel = %s
                            WHERE user_id = %s;
                        """, (nuevo_nivel, user_id))
                        conn.commit()
                    
                    return {
                        "nivel_anterior": nivel_actual,
                        "nivel_nuevo": nuevo_nivel,
                        "subio_nivel": nuevo_nivel > nivel_actual
                    }
                    
                except Exception as e:
                    conn.rollback()
                    print(f"Error al actualizar nivel: {e}")
                    return None
    
    def _calcular_nivel_por_puntos(self, puntos_totales: int) -> int:
        """
        Calcula el nivel correspondiente a una cantidad de puntos.
        Usa la misma fórmula que calcular_nivel_desde_puntos en main.py:
        puntos_para_subir_nivel(n) = 100 * n² + 100

        - Nivel 1→2:  200 pts
        - Nivel 2→3:  500 pts
        - Nivel 3→4: 1 000 pts
        - Nivel 4→5: 1 700 pts
        """
        nivel = 1
        puntos_acumulados = 0

        while True:
            necesarios = 100 * (nivel ** 2) + 100
            if puntos_acumulados + necesarios > puntos_totales:
                break
            puntos_acumulados += necesarios
            nivel += 1

        return nivel
