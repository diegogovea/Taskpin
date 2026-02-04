"""
Celery Configuration for Taskpin
================================
Configura Celery con Redis como broker y backend.
"""

from celery import Celery
import os

# Redis URL para Celery (usar db=2 para separar de cache)
REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/2")

# Crear instancia de Celery
celery_app = Celery(
    "taskpin",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.ai_tasks"]
)

# Configuración
celery_app.conf.update(
    # Serialización
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="America/Mexico_City",
    enable_utc=True,
    
    # Resultados
    result_expires=3600,  # 1 hora
    
    # Tareas
    task_track_started=True,
    task_time_limit=300,  # 5 minutos máximo por tarea
    
    # Reintentos
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Prefetch (para tareas largas, mejor 1)
    worker_prefetch_multiplier=1,
)

# Configuración de rutas de tareas (opcional)
celery_app.conf.task_routes = {
    "app.tasks.ai_tasks.train_model_task": {"queue": "ai"},
    "app.tasks.ai_tasks.generate_*": {"queue": "ai"},
}

# Para debugging
celery_app.conf.task_always_eager = False  # Cambiar a True para testing sin worker
