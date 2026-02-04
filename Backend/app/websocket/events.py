"""
WebSocket Events for Taskpin
============================
Define los tipos de eventos que se envían via WebSocket.
"""

from enum import Enum
from typing import Any, Dict, Optional
from datetime import datetime
import json


class WSEvent(str, Enum):
    """Tipos de eventos WebSocket."""
    
    # Conexión
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    
    # Hábitos
    HABIT_COMPLETED = "habit_completed"
    HABIT_UNCOMPLETED = "habit_uncompleted"
    
    # Cache
    CACHE_INVALIDATED = "cache_invalidated"
    
    # Sistema
    NOTIFICATION = "notification"
    ERROR = "error"


def create_event(
    event_type: WSEvent,
    data: Optional[Dict[str, Any]] = None,
    message: Optional[str] = None
) -> str:
    """
    Crea un evento WebSocket serializado como JSON.
    
    Args:
        event_type: Tipo de evento
        data: Datos adicionales del evento
        message: Mensaje opcional legible
        
    Returns:
        JSON string del evento
    """
    event = {
        "type": event_type.value,
        "timestamp": datetime.now().isoformat(),
        "data": data or {},
    }
    
    if message:
        event["message"] = message
    
    return json.dumps(event, ensure_ascii=False, default=str)


# ==================== EVENTOS PREDEFINIDOS ====================

def event_connected(user_id: int) -> str:
    """Evento: Usuario conectado al WebSocket."""
    return create_event(
        WSEvent.CONNECTED,
        data={"user_id": user_id},
        message="Connected to Taskpin real-time notifications"
    )


def event_habit_completed(
    habito_usuario_id: int,
    nombre: str,
    puntos: int,
    racha_actual: int
) -> str:
    """Evento: Usuario completó un hábito."""
    return create_event(
        WSEvent.HABIT_COMPLETED,
        data={
            "habito_usuario_id": habito_usuario_id,
            "nombre": nombre,
            "puntos": puntos,
            "racha_actual": racha_actual
        },
        message=f"Completed: {nombre} (+{puntos} pts)"
    )


def event_habit_uncompleted(
    habito_usuario_id: int,
    nombre: str
) -> str:
    """Evento: Usuario desmarcó un hábito."""
    return create_event(
        WSEvent.HABIT_UNCOMPLETED,
        data={
            "habito_usuario_id": habito_usuario_id,
            "nombre": nombre
        },
        message=f"Unmarked: {nombre}"
    )


def event_cache_invalidated(cache_type: str, user_id: int) -> str:
    """Evento: Cache invalidado."""
    return create_event(
        WSEvent.CACHE_INVALIDATED,
        data={
            "cache_type": cache_type,
            "user_id": user_id
        }
    )


def event_notification(title: str, body: str, icon: str = "info") -> str:
    """Evento: Notificación genérica."""
    return create_event(
        WSEvent.NOTIFICATION,
        data={
            "title": title,
            "body": body,
            "icon": icon
        },
        message=body
    )
