# Celery Tasks module for Taskpin
from .celery_app import celery_app
from .ai_tasks import train_model_task, generate_recommendations_task, generate_predictions_task

__all__ = [
    "celery_app",
    "train_model_task",
    "generate_recommendations_task",
    "generate_predictions_task"
]
