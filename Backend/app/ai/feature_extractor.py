"""
Feature Extractor para Taskpin AI

Este módulo extrae y prepara datos de la base de datos
para que los modelos de IA puedan procesarlos.

Funciones principales:
- get_user_habit_matrix(): Matriz usuarios × hábitos para recomendaciones
- get_user_habit_vector(): Vector de hábitos de un usuario específico
- get_habit_completion_features(): Features para predicción de completado
"""

import numpy as np
from datetime import date, timedelta
from typing import Dict, List, Tuple, Optional
from ..database import get_pool


class FeatureExtractor:
    """
    Extractor de características para los modelos de IA de Taskpin.
    
    Convierte datos de la base de datos en formatos numéricos
    que los algoritmos de ML pueden procesar.
    """
    
    def __init__(self):
        self.pool = get_pool()
    
    # ========================================
    # FUNCIONES PARA SISTEMA DE RECOMENDACIÓN
    # ========================================
    
    def get_all_habit_ids(self) -> List[int]:
        """
        Obtiene todos los IDs de hábitos predeterminados disponibles.
        
        Returns:
            Lista ordenada de habito_id
        """
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT habito_id 
                    FROM habitos_predeterminados
                    WHERE es_personalizado = false OR es_personalizado IS NULL
                    ORDER BY habito_id;
                """)
                return [row[0] for row in cur.fetchall()]
    
    def get_all_user_ids(self) -> List[int]:
        """
        Obtiene todos los IDs de usuarios activos.
        
        Returns:
            Lista de user_id
        """
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id 
                    FROM usuarios 
                    WHERE activo = true
                    ORDER BY user_id;
                """)
                return [row[0] for row in cur.fetchall()]
    
    def get_user_habit_matrix(self) -> Tuple[np.ndarray, List[int], List[int]]:
        """
        Crea la matriz Usuario × Hábito para filtrado colaborativo.
        
        Cada celda es 1 si el usuario tiene el hábito activo, 0 si no.
        
        Modelo matemático:
        M[i,j] = 1 si usuario_i tiene habito_j
        M[i,j] = 0 si no
        
        Returns:
            Tuple de:
            - matrix: numpy array de shape (n_usuarios, n_habitos)
            - user_ids: lista de user_id correspondientes a cada fila
            - habit_ids: lista de habito_id correspondientes a cada columna
        """
        # Obtener todos los hábitos y usuarios
        habit_ids = self.get_all_habit_ids()
        user_ids = self.get_all_user_ids()
        
        if not habit_ids or not user_ids:
            return np.array([]), [], []
        
        # Crear mapeos de ID a índice
        habit_to_idx = {hid: idx for idx, hid in enumerate(habit_ids)}
        user_to_idx = {uid: idx for idx, uid in enumerate(user_ids)}
        
        # Inicializar matriz con ceros
        matrix = np.zeros((len(user_ids), len(habit_ids)), dtype=np.float32)
        
        # Obtener todos los hábitos de usuario activos
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, habito_id
                    FROM habitos_usuario
                    WHERE activo = true;
                """)
                
                for user_id, habito_id in cur.fetchall():
                    if user_id in user_to_idx and habito_id in habit_to_idx:
                        i = user_to_idx[user_id]
                        j = habit_to_idx[habito_id]
                        matrix[i, j] = 1.0
        
        return matrix, user_ids, habit_ids
    
    def get_user_habit_vector(self, user_id: int) -> Tuple[np.ndarray, List[int]]:
        """
        Obtiene el vector de hábitos de un usuario específico.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Tuple de:
            - vector: numpy array de shape (n_habitos,)
            - habit_ids: lista de habito_id correspondientes a cada posición
        """
        habit_ids = self.get_all_habit_ids()
        
        if not habit_ids:
            return np.array([]), []
        
        habit_to_idx = {hid: idx for idx, hid in enumerate(habit_ids)}
        vector = np.zeros(len(habit_ids), dtype=np.float32)
        
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT habito_id
                    FROM habitos_usuario
                    WHERE user_id = %s AND activo = true;
                """, (user_id,))
                
                for (habito_id,) in cur.fetchall():
                    if habito_id in habit_to_idx:
                        vector[habit_to_idx[habito_id]] = 1.0
        
        return vector, habit_ids
    
    def get_habits_user_doesnt_have(self, user_id: int) -> List[Dict]:
        """
        Obtiene los hábitos que el usuario NO tiene (candidatos a recomendar).
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de dicts con info de cada hábito disponible
        """
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT hp.habito_id, hp.nombre, hp.descripcion, 
                           hp.puntos_base, ch.nombre as categoria
                    FROM habitos_predeterminados hp
                    INNER JOIN categorias_habitos ch ON hp.categoria_id = ch.categoria_id
                    WHERE (hp.es_personalizado = false OR hp.es_personalizado IS NULL)
                      AND hp.habito_id NOT IN (
                          SELECT habito_id 
                          FROM habitos_usuario 
                          WHERE user_id = %s AND activo = true
                      )
                    ORDER BY hp.habito_id;
                """, (user_id,))
                
                return [
                    {
                        'habito_id': row[0],
                        'nombre': row[1],
                        'descripcion': row[2],
                        'puntos_base': row[3],
                        'categoria': row[4]
                    }
                    for row in cur.fetchall()
                ]
    
    # ========================================
    # FUNCIONES PARA PREDICTOR DE COMPLETADO
    # ========================================
    
    def get_habit_completion_features(self, user_id: int, habito_usuario_id: int) -> Optional[Dict]:
        """
        Extrae características de un hábito para predecir completado.
        
        Features extraídas:
        - dia_semana: 0-6 (Lunes=0, Domingo=6)
        - hora_actual: 0-23
        - racha_actual: días consecutivos completando
        - tasa_exito_7_dias: % completado últimos 7 días
        - tasa_exito_30_dias: % completado últimos 30 días
        - completado_ayer: 0 o 1
        - dias_desde_agregado: antigüedad del hábito
        
        Args:
            user_id: ID del usuario
            habito_usuario_id: ID del hábito del usuario
            
        Returns:
            Dict con las features o None si no existe el hábito
        """
        hoy = date.today()
        ayer = hoy - timedelta(days=1)
        hace_7_dias = hoy - timedelta(days=7)
        hace_30_dias = hoy - timedelta(days=30)
        
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                # Verificar que el hábito existe y pertenece al usuario
                cur.execute("""
                    SELECT habito_usuario_id, fecha_agregado
                    FROM habitos_usuario
                    WHERE habito_usuario_id = %s 
                      AND user_id = %s 
                      AND activo = true;
                """, (habito_usuario_id, user_id))
                
                result = cur.fetchone()
                if not result:
                    return None
                
                fecha_agregado = result[1]
                dias_desde_agregado = (hoy - fecha_agregado).days if fecha_agregado else 0
                
                # Obtener historial de completado
                cur.execute("""
                    SELECT fecha, completado
                    FROM seguimiento_habitos
                    WHERE habito_usuario_id = %s
                      AND fecha >= %s
                    ORDER BY fecha DESC;
                """, (habito_usuario_id, hace_30_dias))
                
                historial = {row[0]: row[1] for row in cur.fetchall()}
                
                # Calcular tasa de éxito últimos 7 días
                dias_7 = [(hoy - timedelta(days=i)) for i in range(1, 8)]
                completados_7 = sum(1 for d in dias_7 if historial.get(d, False))
                tasa_7_dias = completados_7 / 7.0
                
                # Calcular tasa de éxito últimos 30 días
                dias_30 = [(hoy - timedelta(days=i)) for i in range(1, 31)]
                completados_30 = sum(1 for d in dias_30 if historial.get(d, False))
                tasa_30_dias = completados_30 / 30.0
                
                # Verificar si completó ayer
                completado_ayer = 1 if historial.get(ayer, False) else 0
                
                # Calcular racha actual
                racha_actual = 0
                fecha_check = ayer
                while historial.get(fecha_check, False):
                    racha_actual += 1
                    fecha_check -= timedelta(days=1)
                
                # Features actuales (momento de predicción)
                from datetime import datetime
                ahora = datetime.now()
                
                return {
                    'dia_semana': hoy.weekday(),  # 0=Lunes, 6=Domingo
                    'hora_actual': ahora.hour,
                    'racha_actual': racha_actual,
                    'tasa_exito_7_dias': round(tasa_7_dias, 3),
                    'tasa_exito_30_dias': round(tasa_30_dias, 3),
                    'completado_ayer': completado_ayer,
                    'dias_desde_agregado': dias_desde_agregado
                }
    
    def get_all_user_habits_features(self, user_id: int) -> List[Dict]:
        """
        Obtiene features de TODOS los hábitos activos de un usuario.
        
        Útil para hacer predicciones batch de todos los hábitos.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de dicts con habito_usuario_id, nombre, y features
        """
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                # Obtener todos los hábitos del usuario
                cur.execute("""
                    SELECT hu.habito_usuario_id, hp.nombre, hp.habito_id
                    FROM habitos_usuario hu
                    INNER JOIN habitos_predeterminados hp ON hu.habito_id = hp.habito_id
                    WHERE hu.user_id = %s AND hu.activo = true
                    ORDER BY hu.habito_usuario_id;
                """, (user_id,))
                
                habitos = cur.fetchall()
        
        results = []
        for habito_usuario_id, nombre, habito_id in habitos:
            features = self.get_habit_completion_features(user_id, habito_usuario_id)
            if features:
                results.append({
                    'habito_usuario_id': habito_usuario_id,
                    'habito_id': habito_id,
                    'nombre': nombre,
                    'features': features
                })
        
        return results
    
    def get_training_data_for_predictor(self, min_records: int = 100) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepara datos de entrenamiento para el modelo de predicción.
        
        Obtiene historial de todos los usuarios y construye un dataset
        con features y labels (completado/no completado).
        
        Args:
            min_records: Mínimo de registros requeridos
            
        Returns:
            Tuple de:
            - X: numpy array de features (n_samples, n_features)
            - y: numpy array de labels (n_samples,) - 1=completado, 0=no
        """
        X_list = []
        y_list = []
        
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                # Obtener historial con features calculables
                cur.execute("""
                    SELECT 
                        sh.habito_usuario_id,
                        sh.fecha,
                        sh.completado,
                        hu.user_id,
                        hu.fecha_agregado
                    FROM seguimiento_habitos sh
                    INNER JOIN habitos_usuario hu ON sh.habito_usuario_id = hu.habito_usuario_id
                    WHERE sh.fecha < CURRENT_DATE  -- Solo datos pasados
                    ORDER BY sh.fecha;
                """)
                
                registros = cur.fetchall()
                
                # Para cada registro, calcular features del día anterior
                # (simulamos que predecimos basándonos en datos disponibles)
                for habito_usuario_id, fecha, completado, user_id, fecha_agregado in registros:
                    # Calcular features para ese día
                    dia_semana = fecha.weekday()
                    dias_desde_agregado = (fecha - fecha_agregado).days if fecha_agregado else 0
                    
                    # Obtener historial previo a esa fecha
                    cur.execute("""
                        SELECT fecha, completado
                        FROM seguimiento_habitos
                        WHERE habito_usuario_id = %s
                          AND fecha < %s
                          AND fecha >= %s
                        ORDER BY fecha DESC;
                    """, (habito_usuario_id, fecha, fecha - timedelta(days=30)))
                    
                    historial_previo = {row[0]: row[1] for row in cur.fetchall()}
                    
                    # Calcular features
                    ayer = fecha - timedelta(days=1)
                    completado_ayer = 1 if historial_previo.get(ayer, False) else 0
                    
                    # Tasa últimos 7 días antes de esta fecha
                    dias_7 = [(fecha - timedelta(days=i)) for i in range(1, 8)]
                    completados_7 = sum(1 for d in dias_7 if historial_previo.get(d, False))
                    tasa_7 = completados_7 / 7.0
                    
                    # Racha antes de esta fecha
                    racha = 0
                    fecha_check = ayer
                    while historial_previo.get(fecha_check, False):
                        racha += 1
                        fecha_check -= timedelta(days=1)
                    
                    # Feature vector (sin hora porque es dato histórico)
                    # [dia_semana, racha, tasa_7, completado_ayer, dias_agregado]
                    features = [
                        dia_semana,
                        racha,
                        tasa_7,
                        completado_ayer,
                        min(dias_desde_agregado, 365)  # Cap a 1 año
                    ]
                    
                    X_list.append(features)
                    y_list.append(1 if completado else 0)
        
        if len(X_list) < min_records:
            print(f"Advertencia: Solo {len(X_list)} registros disponibles (mínimo: {min_records})")
        
        return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32)
    
    # ========================================
    # FUNCIONES AUXILIARES
    # ========================================
    
    def get_habit_info(self, habito_id: int) -> Optional[Dict]:
        """Obtiene información de un hábito predeterminado"""
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT hp.habito_id, hp.nombre, hp.descripcion, 
                           hp.puntos_base, ch.nombre as categoria
                    FROM habitos_predeterminados hp
                    INNER JOIN categorias_habitos ch ON hp.categoria_id = ch.categoria_id
                    WHERE hp.habito_id = %s;
                """, (habito_id,))
                
                row = cur.fetchone()
                if row:
                    return {
                        'habito_id': row[0],
                        'nombre': row[1],
                        'descripcion': row[2],
                        'puntos_base': row[3],
                        'categoria': row[4]
                    }
                return None
    
    def get_user_stats(self, user_id: int) -> Optional[Dict]:
        """Obtiene estadísticas de un usuario"""
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT puntos_totales, nivel, racha_actual, racha_maxima
                    FROM estadisticas_usuario
                    WHERE user_id = %s;
                """, (user_id,))
                
                row = cur.fetchone()
                if row:
                    return {
                        'puntos_totales': row[0],
                        'nivel': row[1],
                        'racha_actual': row[2],
                        'racha_maxima': row[3]
                    }
                return None
