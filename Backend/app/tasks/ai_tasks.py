"""
AI Tasks for Celery
===================
Tareas de inteligencia artificial que se ejecutan en background.
"""

from .celery_app import celery_app
from celery import states
from typing import Dict, Any, Optional
import time


@celery_app.task(bind=True, name="taskpin.train_model")
def train_model_task(self, force_retrain: bool = False) -> Dict[str, Any]:
    """
    Tarea: Entrenar el modelo de predicción de hábitos.
    
    Esta tarea puede tomar varios segundos dependiendo de la cantidad de datos.
    Se ejecuta en background para no bloquear la API.
    
    Args:
        force_retrain: Si es True, reentrenar aunque ya exista modelo
        
    Returns:
        Dict con resultados del entrenamiento
    """
    try:
        # Actualizar estado a "procesando"
        self.update_state(state="TRAINING", meta={"progress": 0, "step": "Initializing..."})
        
        # Importar aquí para evitar imports circulares
        from ..ai import HabitPredictor
        
        self.update_state(state="TRAINING", meta={"progress": 20, "step": "Loading data..."})
        
        # Crear predictor y entrenar
        predictor = HabitPredictor()
        
        self.update_state(state="TRAINING", meta={"progress": 50, "step": "Training model..."})
        
        # Entrenar
        results = predictor.train(test_size=0.2, save=True)
        
        self.update_state(state="TRAINING", meta={"progress": 90, "step": "Saving model..."})
        
        # Preparar respuesta
        response = {
            "success": True,
            "samples": results.get("samples_entrenamiento", 0) + results.get("samples_prueba", 0),
            "accuracy": results.get("accuracy", 0),
            "precision": results.get("precision", 0),
            "recall": results.get("recall", 0),
            "f1_score": results.get("f1_score", 0),
            "message": "Model trained successfully"
        }
        
        self.update_state(state="SUCCESS", meta={"progress": 100, "step": "Complete"})
        
        return response
        
    except Exception as e:
        self.update_state(state=states.FAILURE, meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="taskpin.generate_recommendations")
def generate_recommendations_task(self, user_id: int, limit: int = 5) -> Dict[str, Any]:
    """
    Tarea: Generar recomendaciones para un usuario.
    
    Calcula recomendaciones usando collaborative filtering y las guarda en cache.
    
    Args:
        user_id: ID del usuario
        limit: Número de recomendaciones
        
    Returns:
        Dict con las recomendaciones
    """
    try:
        self.update_state(state="PROCESSING", meta={"progress": 0, "step": "Loading recommender..."})
        
        from ..ai import HabitRecommender
        from ..core.redis_client import redis_client
        
        self.update_state(state="PROCESSING", meta={"progress": 30, "step": "Computing recommendations..."})
        
        recommender = HabitRecommender()
        recommendations = recommender.get_recommendations(user_id, limit=limit, use_cache=False)
        
        self.update_state(state="PROCESSING", meta={"progress": 80, "step": "Caching results..."})
        
        # Guardar en cache
        cache_key = f"recommendations:user:{user_id}:limit:{limit}"
        redis_client.set_json(cache_key, recommendations, ttl=3600)
        
        return {
            "success": True,
            "user_id": user_id,
            "count": len(recommendations),
            "recommendations": recommendations
        }
        
    except Exception as e:
        self.update_state(state=states.FAILURE, meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="taskpin.generate_predictions")
def generate_predictions_task(self, user_id: int) -> Dict[str, Any]:
    """
    Tarea: Generar predicciones de completado para un usuario.
    
    Calcula la probabilidad de completar cada hábito hoy y guarda en cache.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Dict con las predicciones
    """
    try:
        self.update_state(state="PROCESSING", meta={"progress": 0, "step": "Loading predictor..."})
        
        from ..ai import HabitPredictor
        from ..core.redis_client import redis_client
        
        self.update_state(state="PROCESSING", meta={"progress": 30, "step": "Computing predictions..."})
        
        predictor = HabitPredictor()
        predictions = predictor.predict_all_habits(user_id, use_cache=False)
        
        self.update_state(state="PROCESSING", meta={"progress": 80, "step": "Caching results..."})
        
        # Guardar en cache
        cache_key = f"predictions:user:{user_id}"
        redis_client.set_json(cache_key, predictions, ttl=1800)
        
        return {
            "success": True,
            "user_id": user_id,
            "count": len(predictions),
            "predictions": predictions
        }
        
    except Exception as e:
        self.update_state(state=states.FAILURE, meta={"error": str(e)})
        raise


@celery_app.task(name="taskpin.health_check")
def health_check_task() -> Dict[str, Any]:
    """
    Tarea simple para verificar que Celery está funcionando.
    """
    return {
        "status": "ok",
        "message": "Celery worker is running",
        "timestamp": time.time()
    }
