# Backend/app/model/planesConnection.py

import psycopg
from ..database import get_pool  # Importar pool de conexiones

class PlanesConnection:
    """
    Clase para manejar operaciones de planes.
    Usa el pool de conexiones compartido.
    """
    
    def __init__(self):
        # Ya no creamos conexión aquí, usamos el pool
        pass

    def agregar_plan_usuario(self, user_id, plan_id, dias_personalizados=None):
        """Agregar plan a usuario - VERSIÓN CORREGIDA"""
        print(f"DEBUG PlanesConnection: Iniciando agregar_plan_usuario")
        print(f"DEBUG PlanesConnection: user_id={user_id}, plan_id={plan_id}, dias={dias_personalizados}")
        
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    print("DEBUG PlanesConnection: Cursor creado")
                    
                    # Verificar duplicado
                    cur.execute("""
                        SELECT plan_usuario_id FROM planes_usuario 
                        WHERE user_id = %s AND plan_id = %s AND estado != 'cancelado'
                    """, (user_id, plan_id))
                    
                    if cur.fetchone():
                        print("DEBUG PlanesConnection: Plan duplicado encontrado")
                        return {'success': False, 'message': 'Ya tienes este plan agregado'}
                    
                    print("DEBUG PlanesConnection: No hay duplicado, insertando...")
                    
                    # Calcular fecha_objetivo si se proporcionan días personalizados
                    fecha_objetivo = None
                    if dias_personalizados:
                        from datetime import date, timedelta
                        fecha_objetivo = date.today() + timedelta(days=dias_personalizados)
                        print(f"DEBUG PlanesConnection: fecha_objetivo calculada: {fecha_objetivo}")
                    
                    # Insertar plan_usuario
                    cur.execute("""
                        INSERT INTO planes_usuario (user_id, plan_id, fecha_objetivo, estado, progreso_porcentaje)
                        VALUES (%s, %s, %s, 'activo', 0)
                        RETURNING plan_usuario_id
                    """, (user_id, plan_id, fecha_objetivo))
                    
                    result = cur.fetchone()
                    print(f"DEBUG PlanesConnection: Resultado INSERT: {result}")
                    
                    if not result:
                        print("DEBUG PlanesConnection: Error en INSERT")
                        return {'success': False, 'message': 'Error al insertar'}
                    
                    plan_usuario_id = result[0]
                    print(f"DEBUG PlanesConnection: plan_usuario_id creado: {plan_usuario_id}")
                    
                    # Crear registros de progreso
                    print("DEBUG PlanesConnection: Creando progreso_planes...")
                    cur.execute("""
                        INSERT INTO progreso_planes (plan_usuario_id, objetivo_id, completado, progreso_objetivo_porcentaje)
                        SELECT %s, objetivo_id, false, 0
                        FROM objetivos_intermedios 
                        WHERE plan_id = %s
                    """, (plan_usuario_id, plan_id))
                    
                    # Verificar inserción
                    cur.execute("SELECT COUNT(*) FROM progreso_planes WHERE plan_usuario_id = %s", (plan_usuario_id,))
                    count = cur.fetchone()[0]
                    print(f"DEBUG PlanesConnection: {count} registros de progreso creados")
                    
                    # Commit
                    conn.commit()
                    print("DEBUG PlanesConnection: Commit exitoso")
                    
                    return {
                        'success': True, 
                        'plan_usuario_id': plan_usuario_id,
                        'message': 'Plan agregado correctamente'
                    }
                
        except Exception as e:
            print(f"DEBUG PlanesConnection ERROR: {e}")
            return {'success': False, 'message': f'Error interno: {str(e)}'}

    def get_categorias_planes(self):
        """Obtener categorías"""
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT categoria_plan_id, nombre, descripcion, icono, orden
                        FROM categorias_planes ORDER BY orden
                    """)
                    categorias = cur.fetchall()
                    
                    result = []
                    for cat in categorias:
                        result.append({
                            'categoria_plan_id': cat[0],
                            'nombre': cat[1],
                            'descripcion': cat[2],
                            'icono': cat[3],
                            'orden': cat[4]
                        })
                    return result
        except Exception as e:
            print(f"Error get_categorias_planes: {e}")
            return []

    def get_planes_por_categoria(self, categoria_plan_id):
        """Obtener planes por categoría"""
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT plan_id, meta_principal, descripcion, plazo_dias_estimado, dificultad, imagen
                        FROM planes_predeterminados 
                        WHERE categoria_plan_id = %s
                        ORDER BY plan_id
                    """, (categoria_plan_id,))
                    planes = cur.fetchall()
                    
                    result = []
                    for plan in planes:
                        result.append({
                            'plan_id': plan[0],
                            'meta_principal': plan[1],
                            'descripcion': plan[2],
                            'plazo_dias_estimado': plan[3],
                            'dificultad': plan[4],
                            'imagen': plan[5]
                        })
                    return result
        except Exception as e:
            print(f"Error get_planes_por_categoria: {e}")
            return []

    def get_plan_completo(self, plan_id):
        """Obtener plan completo con fases y tareas"""
        pool = get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cur:
                # Info básica del plan
                cur.execute("""
                    SELECT p.plan_id, p.meta_principal, p.descripcion, p.plazo_dias_estimado, 
                           p.dificultad, p.imagen, c.nombre as categoria_nombre
                    FROM planes_predeterminados p
                    JOIN categorias_planes c ON p.categoria_plan_id = c.categoria_plan_id
                    WHERE p.plan_id = %s
                """, (plan_id,))
                plan_data = cur.fetchone()
                
                if not plan_data:
                    return None
                
                # Objetivos (fases)
                cur.execute("""
                    SELECT objetivo_id, titulo, descripcion, orden_fase, duracion_dias
                    FROM objetivos_intermedios 
                    WHERE plan_id = %s
                    ORDER BY orden_fase
                """, (plan_id,))
                objetivos = cur.fetchall()
                
                fases = []
                for objetivo in objetivos:
                    # Tareas del objetivo
                    cur.execute("""
                        SELECT tarea_id, titulo, descripcion, tipo, orden, es_diaria
                        FROM tareas_predeterminadas 
                        WHERE objetivo_id = %s
                        ORDER BY orden
                    """, (objetivo[0],))
                    tareas = cur.fetchall()
                    
                    tareas_lista = []
                    for tarea in tareas:
                        tareas_lista.append({
                            'tarea_id': tarea[0],
                            'titulo': tarea[1],
                            'descripcion': tarea[2],
                            'tipo': tarea[3],
                            'orden': tarea[4],
                            'es_diaria': tarea[5]
                        })
                    
                    fases.append({
                        'objetivo_id': objetivo[0],
                        'titulo': objetivo[1],
                        'descripcion': objetivo[2],
                        'orden_fase': objetivo[3],
                        'duracion_dias': objetivo[4],
                        'tareas': tareas_lista
                    })
                
                plan_completo = {
                    'plan_id': plan_data[0],
                    'meta_principal': plan_data[1],
                    'descripcion': plan_data[2],
                    'plazo_dias_estimado': plan_data[3],
                    'dificultad': plan_data[4],
                    'imagen': plan_data[5],
                    'categoria_nombre': plan_data[6],
                    'fases': fases,
                    'total_fases': len(fases),
                    'total_tareas': sum(len(fase['tareas']) for fase in fases)
                }
                
                return plan_completo

    def get_tareas_diarias_usuario(self, plan_usuario_id, fecha=None):
        """Obtener tareas diarias del usuario para una fecha específica"""
        pool = get_pool()
        try:
            if fecha is None:
                from datetime import date
                fecha = date.today()
            
            print(f"DEBUG get_tareas_diarias: plan_usuario_id={plan_usuario_id}, fecha={fecha}")
            
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # Obtener información básica del plan del usuario
                    cur.execute("""
                        SELECT pu.plan_usuario_id, pu.user_id, pu.plan_id, pu.fecha_inicio,
                               p.meta_principal, p.dificultad
                        FROM planes_usuario pu
                        JOIN planes_predeterminados p ON pu.plan_id = p.plan_id
                        WHERE pu.plan_usuario_id = %s
                    """, (plan_usuario_id,))
                    
                    plan_info = cur.fetchone()
                    if not plan_info:
                        return None
                    
                    # Calcular qué fase corresponde a la fecha actual
                    dias_transcurridos = (fecha - plan_info[3]).days + 1  # +1 para incluir día de inicio
                    
                    cur.execute("""
                        SELECT o.objetivo_id, o.titulo, o.descripcion, o.orden_fase, o.duracion_dias,
                               SUM(o2.duracion_dias) as dias_acumulados_anteriores
                        FROM objetivos_intermedios o
                        LEFT JOIN objetivos_intermedios o2 ON o2.plan_id = o.plan_id AND o2.orden_fase < o.orden_fase
                        WHERE o.plan_id = %s
                        GROUP BY o.objetivo_id, o.titulo, o.descripcion, o.orden_fase, o.duracion_dias
                        ORDER BY o.orden_fase
                    """, (plan_info[2],))
                    
                    objetivos = cur.fetchall()
                    
                    # Determinar objetivo actual basado en días transcurridos
                    objetivo_actual = None
                    for objetivo in objetivos:
                        dias_anteriores = objetivo[5] if objetivo[5] else 0
                        dia_inicio_fase = dias_anteriores + 1
                        dia_fin_fase = dias_anteriores + objetivo[4]
                        
                        if dia_inicio_fase <= dias_transcurridos <= dia_fin_fase:
                            objetivo_actual = objetivo
                            break
                    
                    if not objetivo_actual:
                        # Si se pasó del tiempo, usar última fase
                        objetivo_actual = objetivos[-1] if objetivos else None
                    
                    if not objetivo_actual:
                        return None
                    
                    # Obtener tareas del objetivo actual
                    cur.execute("""
                        SELECT t.tarea_id, t.titulo, t.descripcion, t.tipo, t.es_diaria
                        FROM tareas_predeterminadas t
                        WHERE t.objetivo_id = %s
                        ORDER BY t.orden
                    """, (objetivo_actual[0],))
                    
                    tareas = cur.fetchall()
                    
                    # Verificar qué tareas ya están completadas para esta fecha
                    tareas_con_estado = []
                    for tarea in tareas:
                        cur.execute("""
                            SELECT tarea_usuario_id, completada, hora_completada
                            FROM tareas_usuario
                            WHERE plan_usuario_id = %s AND tarea_id = %s AND fecha_asignada = %s
                        """, (plan_usuario_id, tarea[0], fecha))
                        
                        estado_tarea = cur.fetchone()
                        
                        tareas_con_estado.append({
                            'tarea_id': tarea[0],
                            'titulo': tarea[1],
                            'descripcion': tarea[2],
                            'tipo': tarea[3],
                            'es_diaria': tarea[4],
                            'completada': estado_tarea[1] if estado_tarea else False,
                            'hora_completada': str(estado_tarea[2]) if estado_tarea and estado_tarea[2] else None,
                            'tarea_usuario_id': estado_tarea[0] if estado_tarea else None
                        })
                    
                    resultado = {
                        'plan_usuario_id': plan_info[0],
                        'meta_principal': plan_info[4],
                        'dificultad': plan_info[5],
                        'fecha': fecha.isoformat(),
                        'dias_transcurridos': dias_transcurridos,
                        'fase_actual': {
                            'objetivo_id': objetivo_actual[0],
                            'titulo': objetivo_actual[1],
                            'descripcion': objetivo_actual[2],
                            'orden_fase': objetivo_actual[3],
                            'duracion_dias': objetivo_actual[4]
                        },
                        'tareas': tareas_con_estado
                    }
                    
                    return resultado
                
        except Exception as e:
            print(f"DEBUG ERROR get_tareas_diarias: {e}")
            import traceback
            print(f"DEBUG TRACEBACK get_tareas_diarias: {traceback.format_exc()}")
            return None

    def marcar_tarea_completada(self, plan_usuario_id, tarea_id, fecha=None):
        """Marcar una tarea como completada"""
        pool = get_pool()
        try:
            if fecha is None:
                from datetime import date
                fecha = date.today()
                
            print(f"DEBUG marcar_tarea: plan_usuario_id={plan_usuario_id}, tarea_id={tarea_id}, fecha={fecha}")
            
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # Verificar si ya existe el registro
                    cur.execute("""
                        SELECT tarea_usuario_id, completada FROM tareas_usuario
                        WHERE plan_usuario_id = %s AND tarea_id = %s AND fecha_asignada = %s
                    """, (plan_usuario_id, tarea_id, fecha))
                    
                    registro_existente = cur.fetchone()
                    
                    if registro_existente:
                        # Actualizar estado existente
                        nueva_completada = not registro_existente[1]  # Toggle
                        
                        if nueva_completada:
                            # Marcar como completada con hora actual
                            from datetime import datetime
                            cur.execute("""
                                UPDATE tareas_usuario 
                                SET completada = true, hora_completada = %s
                                WHERE tarea_usuario_id = %s
                            """, (datetime.now().time(), registro_existente[0]))
                        else:
                            # Desmarcar
                            cur.execute("""
                                UPDATE tareas_usuario 
                                SET completada = false, hora_completada = NULL
                                WHERE tarea_usuario_id = %s
                            """, (registro_existente[0],))
                        
                        print(f"DEBUG marcar_tarea: Actualizado a completada={nueva_completada}")
                    else:
                        # Crear nuevo registro como completada
                        from datetime import datetime
                        cur.execute("""
                            INSERT INTO tareas_usuario (plan_usuario_id, tarea_id, fecha_asignada, completada, hora_completada)
                            VALUES (%s, %s, %s, true, %s)
                        """, (plan_usuario_id, tarea_id, fecha, datetime.now().time()))
                        
                        print(f"DEBUG marcar_tarea: Nuevo registro creado como completada")
                    
                    # Actualizar progreso del plan
                    self._actualizar_progreso_plan(plan_usuario_id)
                    
                    conn.commit()
                    return {'success': True, 'message': 'Tarea actualizada'}
                
        except Exception as e:
            print(f"DEBUG ERROR marcar_tarea: {e}")
            return {'success': False, 'message': f'Error al marcar tarea: {str(e)}'}

    def _actualizar_progreso_plan(self, plan_usuario_id):
        """Actualizar progreso general del plan basado en tareas completadas"""
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # Obtener información del plan
                    cur.execute("""
                        SELECT pu.plan_id, pu.fecha_inicio
                        FROM planes_usuario pu
                        WHERE pu.plan_usuario_id = %s
                    """, (plan_usuario_id,))
                    
                    plan_data = cur.fetchone()
                    if not plan_data:
                        return
                    
                    # Calcular progreso basado en días activos y tareas completadas
                    from datetime import date
                    dias_transcurridos = (date.today() - plan_data[1]).days + 1
                    
                    # Contar tareas completadas vs total de tareas hasta la fecha
                    cur.execute("""
                        SELECT COUNT(*) as total_tareas,
                               COUNT(CASE WHEN tu.completada = true THEN 1 END) as tareas_completadas
                        FROM objetivos_intermedios o
                        JOIN tareas_predeterminadas t ON o.objetivo_id = t.objetivo_id
                        LEFT JOIN tareas_usuario tu ON t.tarea_id = tu.tarea_id 
                                                    AND tu.plan_usuario_id = %s
                                                    AND tu.fecha_asignada <= %s
                        WHERE o.plan_id = %s AND t.es_diaria = true
                    """, (plan_usuario_id, date.today(), plan_data[0]))
                    
                    stats = cur.fetchone()
                    total_tareas = stats[0] * min(dias_transcurridos, 60)  # Máximo 60 días
                    tareas_completadas = stats[1] if stats[1] else 0
                    
                    # Calcular porcentaje
                    if total_tareas > 0:
                        progreso_porcentaje = min(100, int((tareas_completadas / total_tareas) * 100))
                    else:
                        progreso_porcentaje = 0
                    
                    # Actualizar progreso en la BD
                    cur.execute("""
                        UPDATE planes_usuario 
                        SET progreso_porcentaje = %s
                        WHERE plan_usuario_id = %s
                    """, (progreso_porcentaje, plan_usuario_id))
                    
                    print(f"DEBUG _actualizar_progreso: {tareas_completadas}/{total_tareas} = {progreso_porcentaje}%")
                
        except Exception as e:
            print(f"DEBUG ERROR _actualizar_progreso: {e}")

    def get_planes_usuario(self, user_id):
        """Obtener planes del usuario con progreso"""
        print(f"DEBUG get_planes_usuario: user_id={user_id}")
        
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT pu.plan_usuario_id, pu.fecha_inicio, pu.fecha_objetivo, 
                               pu.estado, pu.progreso_porcentaje,
                               p.meta_principal, p.descripcion, p.dificultad, p.imagen
                        FROM planes_usuario pu
                        JOIN planes_predeterminados p ON pu.plan_id = p.plan_id
                        WHERE pu.user_id = %s AND pu.estado != 'cancelado'
                        ORDER BY pu.fecha_agregado DESC
                    """, (user_id,))
                    
                    planes = cur.fetchall()
                    print(f"DEBUG get_planes_usuario: Encontrados {len(planes)} planes")
                    
                    result = []
                    for plan in planes:
                        result.append({
                            'plan_usuario_id': plan[0],
                            'fecha_inicio': plan[1].isoformat() if plan[1] else None,
                            'fecha_objetivo': plan[2].isoformat() if plan[2] else None,
                            'estado': plan[3],
                            'progreso_porcentaje': plan[4],
                            'meta_principal': plan[5],
                            'descripcion': plan[6],
                            'dificultad': plan[7],
                            'imagen': plan[8]
                        })
                    
                    print(f"DEBUG get_planes_usuario: Resultado preparado: {len(result)} items")
                    return result
                
        except Exception as e:
            print(f"DEBUG ERROR get_planes_usuario: {e}")
            import traceback
            print(f"DEBUG TRACEBACK get_planes_usuario: {traceback.format_exc()}")
            return []

    def actualizar_estado_plan(self, plan_usuario_id: int, user_id: int, nuevo_estado: str):
        """
        Actualiza el estado de un plan del usuario.
        
        Estados válidos: 'activo', 'pausado', 'completado', 'cancelado'
        
        Reglas de transición:
        - activo → pausado, cancelado, completado ✅
        - pausado → activo (reanudar), cancelado ✅
        - completado → ninguno ❌
        - cancelado → ninguno ❌
        
        Returns:
            dict: { success: bool, data: {...}, message: str }
        """
        from datetime import datetime
        
        # Estados válidos
        ESTADOS_VALIDOS = ['activo', 'pausado', 'completado', 'cancelado']
        
        # Validar nuevo estado
        if nuevo_estado not in ESTADOS_VALIDOS:
            return {
                'success': False, 
                'message': f'Estado no válido. Debe ser: {", ".join(ESTADOS_VALIDOS)}'
            }
        
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # 1. Verificar que el plan existe y pertenece al usuario
                    cur.execute("""
                        SELECT plan_usuario_id, estado 
                        FROM planes_usuario 
                        WHERE plan_usuario_id = %s AND user_id = %s
                    """, (plan_usuario_id, user_id))
                    
                    plan = cur.fetchone()
                    
                    if not plan:
                        return {
                            'success': False, 
                            'message': 'Plan no encontrado o no te pertenece'
                        }
                    
                    estado_actual = plan[1]
                    
                    # 2. Validar transiciones permitidas
                    if estado_actual == 'completado':
                        return {
                            'success': False, 
                            'message': 'No se puede modificar un plan completado'
                        }
                    
                    if estado_actual == 'cancelado':
                        return {
                            'success': False, 
                            'message': 'No se puede reactivar un plan cancelado'
                        }
                    
                    if estado_actual == nuevo_estado:
                        return {
                            'success': False, 
                            'message': f'El plan ya está en estado "{nuevo_estado}"'
                        }
                    
                    # 3. Preparar campos de fecha según el nuevo estado
                    ahora = datetime.now()
                    
                    if nuevo_estado == 'pausado':
                        cur.execute("""
                            UPDATE planes_usuario 
                            SET estado = %s, fecha_pausado = %s 
                            WHERE plan_usuario_id = %s
                        """, (nuevo_estado, ahora, plan_usuario_id))
                        
                    elif nuevo_estado == 'cancelado':
                        cur.execute("""
                            UPDATE planes_usuario 
                            SET estado = %s, fecha_cancelado = %s 
                            WHERE plan_usuario_id = %s
                        """, (nuevo_estado, ahora, plan_usuario_id))
                        
                    elif nuevo_estado == 'completado':
                        cur.execute("""
                            UPDATE planes_usuario 
                            SET estado = %s, fecha_completado = %s 
                            WHERE plan_usuario_id = %s
                        """, (nuevo_estado, ahora, plan_usuario_id))
                        
                    elif nuevo_estado == 'activo':
                        # Al reanudar, limpiamos fecha_pausado
                        cur.execute("""
                            UPDATE planes_usuario 
                            SET estado = %s, fecha_pausado = NULL 
                            WHERE plan_usuario_id = %s
                        """, (nuevo_estado, plan_usuario_id))
                    
                    conn.commit()
                    
                    # 4. Mensaje según la acción
                    mensajes = {
                        'pausado': 'Plan pausado correctamente',
                        'activo': 'Plan reanudado correctamente',
                        'cancelado': 'Plan cancelado',
                        'completado': '¡Felicidades! Plan completado'
                    }
                    
                    print(f"DEBUG actualizar_estado_plan: {estado_actual} → {nuevo_estado}")
                    
                    return {
                        'success': True,
                        'data': {
                            'plan_usuario_id': plan_usuario_id,
                            'estado_anterior': estado_actual,
                            'estado_nuevo': nuevo_estado
                        },
                        'message': mensajes.get(nuevo_estado, 'Estado actualizado')
                    }
                    
        except Exception as e:
            print(f"Error actualizar_estado_plan: {e}")
            return {
                'success': False, 
                'message': f'Error al actualizar estado: {str(e)}'
            }

    # ============================================
    # MÉTODOS PARA VINCULAR HÁBITOS A PLANES
    # ============================================

    def vincular_habito_a_plan(self, plan_usuario_id, habito_usuario_id, objetivo_id=None, obligatorio=False, notas=None):
        """
        Vincula un hábito existente del usuario a un plan.
        
        Args:
            plan_usuario_id: ID del plan del usuario
            habito_usuario_id: ID del hábito del usuario
            objetivo_id: (opcional) Fase específica donde aplica el hábito
            obligatorio: Si el hábito es requerido para el plan
            notas: Notas opcionales sobre el vínculo
        
        Returns:
            dict con success, message, y plan_habito_id si fue exitoso
        """
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # 1. Verificar que el plan_usuario existe
                    cur.execute("""
                        SELECT pu.plan_usuario_id, pu.user_id, pu.estado
                        FROM planes_usuario pu
                        WHERE pu.plan_usuario_id = %s
                    """, (plan_usuario_id,))
                    
                    plan = cur.fetchone()
                    if not plan:
                        return {'success': False, 'message': 'Plan no encontrado'}
                    
                    plan_user_id = plan[1]
                    plan_estado = plan[2]
                    
                    # No permitir vincular a planes cancelados
                    if plan_estado == 'cancelado':
                        return {'success': False, 'message': 'No se puede vincular a un plan cancelado'}
                    
                    # 2. Verificar que el habito_usuario existe y pertenece al mismo usuario
                    cur.execute("""
                        SELECT hu.habito_usuario_id, hu.user_id, hp.nombre
                        FROM habitos_usuario hu
                        JOIN habitos_predeterminados hp ON hu.habito_id = hp.habito_id
                        WHERE hu.habito_usuario_id = %s
                    """, (habito_usuario_id,))
                    
                    habito = cur.fetchone()
                    if not habito:
                        return {'success': False, 'message': 'Hábito no encontrado'}
                    
                    habito_user_id = habito[1]
                    habito_nombre = habito[2]
                    
                    # Verificar que ambos pertenecen al mismo usuario
                    if plan_user_id != habito_user_id:
                        return {'success': False, 'message': 'El hábito no pertenece al usuario del plan'}
                    
                    # 3. Verificar objetivo_id si se proporciona
                    if objetivo_id:
                        cur.execute("""
                            SELECT oi.objetivo_id 
                            FROM objetivos_intermedios oi
                            JOIN planes_usuario pu ON oi.plan_id = pu.plan_id
                            WHERE oi.objetivo_id = %s AND pu.plan_usuario_id = %s
                        """, (objetivo_id, plan_usuario_id))
                        
                        if not cur.fetchone():
                            return {'success': False, 'message': 'Fase no válida para este plan'}
                    
                    # 4. Insertar vínculo (la constraint UNIQUE manejará duplicados)
                    try:
                        cur.execute("""
                            INSERT INTO plan_habitos (plan_usuario_id, habito_usuario_id, objetivo_id, obligatorio, notas)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING plan_habito_id
                        """, (plan_usuario_id, habito_usuario_id, objetivo_id, obligatorio, notas))
                        
                        result = cur.fetchone()
                        conn.commit()
                        
                        print(f"DEBUG vincular_habito: Hábito '{habito_nombre}' vinculado a plan {plan_usuario_id}")
                        
                        return {
                            'success': True,
                            'message': f'Hábito "{habito_nombre}" vinculado exitosamente',
                            'plan_habito_id': result[0]
                        }
                        
                    except psycopg.errors.UniqueViolation:
                        return {'success': False, 'message': 'Este hábito ya está vinculado al plan'}
                    
        except Exception as e:
            print(f"Error vincular_habito_a_plan: {e}")
            return {'success': False, 'message': f'Error al vincular hábito: {str(e)}'}

    def desvincular_habito_de_plan(self, plan_usuario_id, habito_usuario_id):
        """
        Elimina el vínculo entre un hábito y un plan.
        No elimina el hábito, solo la relación.
        
        Args:
            plan_usuario_id: ID del plan del usuario
            habito_usuario_id: ID del hábito del usuario
        
        Returns:
            dict con success y message
        """
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # Verificar que el vínculo existe y obtener info para el mensaje
                    cur.execute("""
                        SELECT ph.plan_habito_id, hp.nombre
                        FROM plan_habitos ph
                        JOIN habitos_usuario hu ON ph.habito_usuario_id = hu.habito_usuario_id
                        JOIN habitos_predeterminados hp ON hu.habito_id = hp.habito_id
                        WHERE ph.plan_usuario_id = %s AND ph.habito_usuario_id = %s
                    """, (plan_usuario_id, habito_usuario_id))
                    
                    vinculo = cur.fetchone()
                    if not vinculo:
                        return {'success': False, 'message': 'Este hábito no está vinculado al plan'}
                    
                    habito_nombre = vinculo[1]
                    
                    # Eliminar el vínculo
                    cur.execute("""
                        DELETE FROM plan_habitos 
                        WHERE plan_usuario_id = %s AND habito_usuario_id = %s
                    """, (plan_usuario_id, habito_usuario_id))
                    
                    conn.commit()
                    
                    print(f"DEBUG desvincular_habito: Hábito '{habito_nombre}' desvinculado de plan {plan_usuario_id}")
                    
                    return {
                        'success': True,
                        'message': f'Hábito "{habito_nombre}" desvinculado del plan'
                    }
                    
        except Exception as e:
            print(f"Error desvincular_habito_de_plan: {e}")
            return {'success': False, 'message': f'Error al desvincular hábito: {str(e)}'}

    def get_habitos_del_plan(self, plan_usuario_id, fecha=None):
        """
        Obtiene los hábitos vinculados a un plan con su estado del día.
        
        Args:
            plan_usuario_id: ID del plan del usuario
            fecha: Fecha para verificar el estado (default: hoy)
        
        Returns:
            Lista de hábitos con info y estado del día
        """
        from datetime import date
        
        if fecha is None:
            fecha = date.today()
        
        pool = get_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    # Verificar que el plan existe
                    cur.execute("""
                        SELECT plan_usuario_id FROM planes_usuario 
                        WHERE plan_usuario_id = %s
                    """, (plan_usuario_id,))
                    
                    if not cur.fetchone():
                        return []
                    
                    # Obtener hábitos vinculados con estado de hoy
                    cur.execute("""
                        SELECT 
                            ph.plan_habito_id,
                            ph.habito_usuario_id,
                            ph.obligatorio,
                            ph.objetivo_id,
                            ph.notas,
                            hu.habito_id,
                            hp.nombre,
                            hp.descripcion,
                            hp.puntos,
                            ch.nombre as categoria,
                            sh.completado,
                            sh.hora_completado
                        FROM plan_habitos ph
                        JOIN habitos_usuario hu ON ph.habito_usuario_id = hu.habito_usuario_id
                        JOIN habitos_predeterminados hp ON hu.habito_id = hp.habito_id
                        JOIN categorias_habitos ch ON hp.categoria_id = ch.categoria_id
                        LEFT JOIN seguimiento_habitos sh ON hu.habito_usuario_id = sh.habito_usuario_id 
                            AND sh.fecha = %s
                        WHERE ph.plan_usuario_id = %s
                        ORDER BY ph.obligatorio DESC, hp.nombre
                    """, (fecha, plan_usuario_id))
                    
                    habitos = cur.fetchall()
                    
                    resultado = []
                    for h in habitos:
                        resultado.append({
                            'plan_habito_id': h[0],
                            'habito_usuario_id': h[1],
                            'obligatorio': h[2],
                            'objetivo_id': h[3],
                            'notas': h[4],
                            'habito_id': h[5],
                            'nombre': h[6],
                            'descripcion': h[7],
                            'puntos': h[8],
                            'categoria': h[9],
                            'completado_hoy': h[10] if h[10] is not None else False,
                            'hora_completado': str(h[11]) if h[11] else None
                        })
                    
                    print(f"DEBUG get_habitos_del_plan: {len(resultado)} hábitos encontrados para plan {plan_usuario_id}")
                    
                    return resultado
                    
        except Exception as e:
            print(f"Error get_habitos_del_plan: {e}")
            return []
