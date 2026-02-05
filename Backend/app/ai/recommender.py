"""
Sistema de Recomendación de Hábitos - Filtrado Colaborativo

Este módulo implementa un sistema de recomendación híbrido basado en
filtrado colaborativo usando similitud coseno.

Modelo Matemático - Similitud Coseno:

                    Σᵢ (Aᵢ × Bᵢ)
    sim(A, B) = ────────────────────────────
                √(Σᵢ Aᵢ²) × √(Σᵢ Bᵢ²)

Donde:
- A = vector de hábitos del usuario actual [1,0,1,1,0,...]
- B = vector de hábitos de otro usuario
- sim ∈ [0, 1] donde 1 = usuarios idénticos

El sistema encuentra usuarios con patrones similares de hábitos
y recomienda los hábitos que ellos tienen pero el usuario actual no.

CACHE: Las recomendaciones se cachean en Redis por 1 hora.
"""

import numpy as np
import time
from typing import Dict, List, Tuple, Optional
from .feature_extractor import FeatureExtractor

# Import Redis client (graceful fallback if not available)
try:
    from ..core.redis_client import redis_client
    REDIS_AVAILABLE = redis_client.is_connected
except ImportError:
    redis_client = None
    REDIS_AVAILABLE = False


class HabitRecommender:
    """
    Sistema de recomendación de hábitos usando filtrado colaborativo.
    
    Encuentra usuarios similares basándose en los hábitos que tienen
    y recomienda hábitos que el usuario actual no tiene pero
    usuarios similares sí.
    """
    
    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self._matrix_cache = None
        self._user_ids_cache = None
        self._habit_ids_cache = None
    
    def _load_matrix(self, force_reload: bool = False):
        """Carga la matriz usuario-hábito (con cache)"""
        if self._matrix_cache is None or force_reload:
            matrix, user_ids, habit_ids = self.feature_extractor.get_user_habit_matrix()
            self._matrix_cache = matrix
            self._user_ids_cache = user_ids
            self._habit_ids_cache = habit_ids
        return self._matrix_cache, self._user_ids_cache, self._habit_ids_cache
    
    def cosine_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """
        Calcula la similitud coseno entre dos vectores.
        
        Fórmula:
                        Σᵢ (Aᵢ × Bᵢ)
        sim(A, B) = ────────────────────────────
                    √(Σᵢ Aᵢ²) × √(Σᵢ Bᵢ²)
        
        Args:
            vec_a: Primer vector (numpy array)
            vec_b: Segundo vector (numpy array)
            
        Returns:
            Similitud entre 0 y 1 (1 = idénticos)
        """
        # Producto punto: Σᵢ (Aᵢ × Bᵢ)
        dot_product = np.dot(vec_a, vec_b)
        
        # Normas: √(Σᵢ Aᵢ²) y √(Σᵢ Bᵢ²)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        
        # Evitar división por cero
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        # Similitud coseno
        similarity = dot_product / (norm_a * norm_b)
        
        return float(similarity)
    
    def find_similar_users(self, user_id: int, top_n: int = 10) -> List[Dict]:
        """
        Encuentra los N usuarios más similares al usuario dado.
        
        Proceso:
        1. Obtener vector de hábitos del usuario
        2. Calcular similitud con todos los demás usuarios
        3. Ordenar por similitud descendente
        4. Retornar top N (excluyendo al usuario mismo)
        
        Args:
            user_id: ID del usuario
            top_n: Número de usuarios similares a retornar
            
        Returns:
            Lista de dicts con user_id y similarity score
        """
        matrix, user_ids, habit_ids = self._load_matrix()
        
        if len(user_ids) == 0:
            return []
        
        # Verificar que el usuario existe en la matriz
        if user_id not in user_ids:
            return []
        
        # Obtener índice del usuario
        user_idx = user_ids.index(user_id)
        user_vector = matrix[user_idx]
        
        # Calcular similitud con todos los usuarios
        similarities = []
        for i, other_user_id in enumerate(user_ids):
            if other_user_id == user_id:
                continue  # Saltar el mismo usuario
            
            other_vector = matrix[i]
            sim = self.cosine_similarity(user_vector, other_vector)
            
            if sim > 0:  # Solo incluir si hay alguna similitud
                similarities.append({
                    'user_id': other_user_id,
                    'similarity': round(sim, 4)
                })
        
        # Ordenar por similitud descendente
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Retornar top N
        return similarities[:top_n]
    
    def get_recommendations(self, user_id: int, limit: int = 5, use_cache: bool = True) -> List[Dict]:
        """
        Genera recomendaciones de hábitos para un usuario.
        
        Algoritmo:
        1. Encontrar usuarios similares
        2. Obtener hábitos que el usuario NO tiene
        3. Contar cuántos usuarios similares tienen cada hábito
        4. Calcular score = (usuarios con hábito / total similares)
        5. Ordenar por score y retornar top N
        
        CACHE: Resultados cacheados en Redis por 1 hora (3600 segundos).
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de recomendaciones
            use_cache: Si usar cache de Redis (default True)
            
        Returns:
            Lista de recomendaciones con habito_id, nombre, score, razon
        """
        # Intentar obtener de cache
        cache_key = f"recommendations:user:{user_id}:limit:{limit}"
        
        if use_cache and REDIS_AVAILABLE and redis_client:
            cached = redis_client.get_json(cache_key)
            if cached is not None:
                print(f"[Cache HIT] Recommendations for user {user_id}")
                return cached
        
        start_time = time.time()
        
        # Obtener usuarios similares
        similar_users = self.find_similar_users(user_id, top_n=15)
        
        if not similar_users:
            # Si no hay usuarios similares, recomendar hábitos populares
            return self._get_popular_habits(user_id, limit)
        
        matrix, user_ids, habit_ids = self._load_matrix()
        
        # Obtener hábitos que el usuario actual NO tiene
        habits_user_doesnt_have = self.feature_extractor.get_habits_user_doesnt_have(user_id)
        
        if not habits_user_doesnt_have:
            return []  # El usuario ya tiene todos los hábitos
        
        # Crear mapeo de habito_id a índice
        habit_to_idx = {hid: idx for idx, hid in enumerate(habit_ids)}
        
        # Contar cuántos usuarios similares tienen cada hábito
        habit_scores = {}
        total_similar = len(similar_users)
        
        for habit in habits_user_doesnt_have:
            habito_id = habit['habito_id']
            
            if habito_id not in habit_to_idx:
                continue
            
            habit_idx = habit_to_idx[habito_id]
            
            # Contar usuarios similares que tienen este hábito
            count = 0
            weighted_count = 0.0
            
            for similar in similar_users:
                similar_user_id = similar['user_id']
                similarity = similar['similarity']
                
                if similar_user_id in user_ids:
                    similar_idx = user_ids.index(similar_user_id)
                    if matrix[similar_idx, habit_idx] == 1:
                        count += 1
                        weighted_count += similarity  # Ponderar por similitud
            
            if count > 0:
                # Score ponderado por similitud
                score = weighted_count / total_similar
                habit_scores[habito_id] = {
                    'count': count,
                    'score': score,
                    'info': habit
                }
        
        # Ordenar por score
        sorted_habits = sorted(
            habit_scores.items(),
            key=lambda x: x[1]['score'],
            reverse=True
        )
        
        # Construir respuesta
        recommendations = []
        for habito_id, data in sorted_habits[:limit]:
            info = data['info']
            count = data['count']
            score = data['score']
            
            # Calcular porcentaje para la razón
            percentage = int((count / total_similar) * 100)
            
            recommendations.append({
                'habito_id': habito_id,
                'nombre': info['nombre'],
                'descripcion': info.get('descripcion'),
                'categoria': info.get('categoria'),
                'puntos_base': info.get('puntos_base', 10),
                'score': round(score, 3),
                'razon': f"{percentage}% de usuarios similares tienen este hábito"
            })
        
        # Guardar en cache (1 hora = 3600 segundos)
        if use_cache and REDIS_AVAILABLE and redis_client:
            redis_client.set_json(cache_key, recommendations, ttl=3600)
            elapsed = time.time() - start_time
            print(f"[Cache SET] Recommendations for user {user_id} ({elapsed:.3f}s)")
        
        return recommendations
    
    def _get_popular_habits(self, user_id: int, limit: int = 5) -> List[Dict]:
        """
        Fallback: recomendar hábitos más populares que el usuario no tiene.
        Se usa cuando no hay suficientes usuarios similares.
        """
        matrix, user_ids, habit_ids = self._load_matrix()
        
        # Obtener hábitos que el usuario no tiene
        habits_available = self.feature_extractor.get_habits_user_doesnt_have(user_id)
        
        if not habits_available:
            return []
        
        # Contar popularidad de cada hábito
        habit_to_idx = {hid: idx for idx, hid in enumerate(habit_ids)}
        
        popularity = []
        for habit in habits_available:
            habito_id = habit['habito_id']
            if habito_id in habit_to_idx:
                idx = habit_to_idx[habito_id]
                count = int(np.sum(matrix[:, idx]))
                popularity.append({
                    'habito_id': habito_id,
                    'nombre': habit['nombre'],
                    'descripcion': habit.get('descripcion'),
                    'categoria': habit.get('categoria'),
                    'puntos_base': habit.get('puntos_base', 10),
                    'score': count / len(user_ids),
                    'razon': f"Popular entre {count} usuarios",
                    'count': count
                })
        
        # Ordenar por popularidad
        popularity.sort(key=lambda x: x['count'], reverse=True)
        
        # Remover count del output
        for p in popularity:
            del p['count']
        
        return popularity[:limit]
    
    def get_recommendation_explanation(self, user_id: int, habito_id: int) -> Optional[Dict]:
        """
        Explica por qué se recomienda un hábito específico.
        
        Args:
            user_id: ID del usuario
            habito_id: ID del hábito recomendado
            
        Returns:
            Dict con explicación detallada o None
        """
        similar_users = self.find_similar_users(user_id, top_n=10)
        
        if not similar_users:
            return None
        
        matrix, user_ids, habit_ids = self._load_matrix()
        
        if habito_id not in habit_ids:
            return None
        
        habit_idx = habit_ids.index(habito_id)
        
        # Encontrar usuarios similares que tienen este hábito
        users_with_habit = []
        for similar in similar_users:
            similar_user_id = similar['user_id']
            if similar_user_id in user_ids:
                similar_idx = user_ids.index(similar_user_id)
                if matrix[similar_idx, habit_idx] == 1:
                    users_with_habit.append({
                        'user_id': similar_user_id,
                        'similarity': similar['similarity']
                    })
        
        habit_info = self.feature_extractor.get_habit_info(habito_id)
        
        return {
            'habito': habit_info,
            'usuarios_similares_total': len(similar_users),
            'usuarios_con_habito': len(users_with_habit),
            'porcentaje': round(len(users_with_habit) / len(similar_users) * 100, 1),
            'detalle_usuarios': users_with_habit[:5]  # Top 5 más similares
        }
