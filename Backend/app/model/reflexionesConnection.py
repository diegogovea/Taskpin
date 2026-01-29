"""
Conexión y métodos CRUD para Reflexiones Diarias
"""
from ..database import get_pool
from datetime import date, datetime


class ReflexionesConnection:
    """Clase para manejar operaciones de reflexiones diarias"""
    
    def __init__(self):
        pass
    
    def crear_o_actualizar_reflexion(self, user_id: int, estado_animo: str, 
                                      que_salio_bien: str = None, que_mejorar: str = None):
        """
        Crear o actualizar la reflexión del día.
        Si ya existe una reflexión para hoy, la actualiza.
        """
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    fecha_hoy = date.today()
                    
                    # Verificar si ya existe una reflexión para hoy
                    cur.execute("""
                        SELECT reflexion_id FROM reflexiones_diarias
                        WHERE user_id = %s AND fecha = %s
                    """, (user_id, fecha_hoy))
                    
                    existente = cur.fetchone()
                    
                    if existente:
                        # Actualizar reflexión existente
                        cur.execute("""
                            UPDATE reflexiones_diarias
                            SET estado_animo = %s,
                                que_salio_bien = %s,
                                que_mejorar = %s,
                                updated_at = NOW()
                            WHERE reflexion_id = %s
                            RETURNING reflexion_id
                        """, (estado_animo, que_salio_bien, que_mejorar, existente[0]))
                        
                        conn.commit()
                        return {
                            'success': True,
                            'reflexion_id': existente[0],
                            'es_nueva': False,
                            'message': 'Reflexión actualizada'
                        }
                    else:
                        # Crear nueva reflexión
                        cur.execute("""
                            INSERT INTO reflexiones_diarias 
                            (user_id, fecha, estado_animo, que_salio_bien, que_mejorar)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING reflexion_id
                        """, (user_id, fecha_hoy, estado_animo, que_salio_bien, que_mejorar))
                        
                        result = cur.fetchone()
                        conn.commit()
                        
                        return {
                            'success': True,
                            'reflexion_id': result[0],
                            'es_nueva': True,
                            'message': 'Reflexión guardada'
                        }
                        
        except Exception as e:
            print(f"Error crear_o_actualizar_reflexion: {e}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def get_reflexion_hoy(self, user_id: int):
        """
        Obtener la reflexión del día actual.
        Retorna None si no hay reflexión para hoy.
        """
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    fecha_hoy = date.today()
                    
                    cur.execute("""
                        SELECT reflexion_id, fecha, estado_animo, 
                               que_salio_bien, que_mejorar, created_at
                        FROM reflexiones_diarias
                        WHERE user_id = %s AND fecha = %s
                    """, (user_id, fecha_hoy))
                    
                    row = cur.fetchone()
                    
                    if row:
                        return {
                            'tiene_reflexion': True,
                            'reflexion': {
                                'reflexion_id': row[0],
                                'fecha': row[1].isoformat(),
                                'estado_animo': row[2],
                                'que_salio_bien': row[3],
                                'que_mejorar': row[4],
                                'created_at': row[5].isoformat() if row[5] else None
                            }
                        }
                    else:
                        return {
                            'tiene_reflexion': False,
                            'reflexion': None
                        }
                        
        except Exception as e:
            print(f"Error get_reflexion_hoy: {e}")
            return {'tiene_reflexion': False, 'reflexion': None}
    
    def get_historial_reflexiones(self, user_id: int, limite: int = 30):
        """
        Obtener historial de reflexiones del usuario.
        Incluye resumen de estados de ánimo.
        """
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # Obtener reflexiones ordenadas por fecha
                    cur.execute("""
                        SELECT reflexion_id, fecha, estado_animo,
                               que_salio_bien, que_mejorar, created_at
                        FROM reflexiones_diarias
                        WHERE user_id = %s
                        ORDER BY fecha DESC
                        LIMIT %s
                    """, (user_id, limite))
                    
                    rows = cur.fetchall()
                    
                    reflexiones = []
                    for row in rows:
                        reflexiones.append({
                            'reflexion_id': row[0],
                            'fecha': row[1].isoformat(),
                            'estado_animo': row[2],
                            'que_salio_bien': row[3],
                            'que_mejorar': row[4],
                            'created_at': row[5].isoformat() if row[5] else None
                        })
                    
                    # Obtener resumen de estados de ánimo
                    cur.execute("""
                        SELECT estado_animo, COUNT(*) as count
                        FROM reflexiones_diarias
                        WHERE user_id = %s
                        GROUP BY estado_animo
                    """, (user_id,))
                    
                    resumen_rows = cur.fetchall()
                    resumen = {
                        'great': 0,
                        'good': 0,
                        'neutral': 0,
                        'low': 0,
                        'bad': 0
                    }
                    
                    for row in resumen_rows:
                        if row[0] in resumen:
                            resumen[row[0]] = row[1]
                    
                    # Total de reflexiones
                    cur.execute("""
                        SELECT COUNT(*) FROM reflexiones_diarias WHERE user_id = %s
                    """, (user_id,))
                    total = cur.fetchone()[0]
                    
                    return {
                        'success': True,
                        'reflexiones': reflexiones,
                        'total': total,
                        'resumen': resumen
                    }
                    
        except Exception as e:
            print(f"Error get_historial_reflexiones: {e}")
            return {
                'success': False,
                'reflexiones': [],
                'total': 0,
                'resumen': {'great': 0, 'good': 0, 'neutral': 0, 'low': 0, 'bad': 0}
            }
    
    def get_resumen_animo(self, user_id: int, dias: int = 30):
        """
        Obtener resumen de estados de ánimo de los últimos N días.
        Útil para estadísticas y gráficos.
        """
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT estado_animo, COUNT(*) as count
                        FROM reflexiones_diarias
                        WHERE user_id = %s 
                          AND fecha >= CURRENT_DATE - INTERVAL '%s days'
                        GROUP BY estado_animo
                    """, (user_id, dias))
                    
                    rows = cur.fetchall()
                    resumen = {
                        'great': 0,
                        'good': 0,
                        'neutral': 0,
                        'low': 0,
                        'bad': 0
                    }
                    
                    total = 0
                    for row in rows:
                        if row[0] in resumen:
                            resumen[row[0]] = row[1]
                            total += row[1]
                    
                    return {
                        'success': True,
                        'resumen': resumen,
                        'total_dias': total,
                        'periodo_dias': dias
                    }
                    
        except Exception as e:
            print(f"Error get_resumen_animo: {e}")
            return {
                'success': False,
                'resumen': {'great': 0, 'good': 0, 'neutral': 0, 'low': 0, 'bad': 0},
                'total_dias': 0,
                'periodo_dias': dias
            }
