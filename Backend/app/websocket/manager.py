"""
WebSocket Connection Manager for Taskpin
========================================
Administra las conexiones WebSocket activas por usuario.
Permite enviar mensajes a usuarios específicos o broadcast.
"""

from typing import Dict, List, Set
from fastapi import WebSocket
import asyncio
import json

from .events import event_connected, WSEvent, create_event


class ConnectionManager:
    """
    Administrador de conexiones WebSocket.
    
    Mantiene un registro de todas las conexiones activas,
    organizadas por user_id. Un usuario puede tener múltiples
    conexiones (ej: app + web).
    """
    
    def __init__(self):
        # Dict de user_id -> lista de websockets
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Set de todos los user_ids conectados
        self.connected_users: Set[int] = set()
    
    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        """
        Acepta una nueva conexión WebSocket.
        
        Args:
            user_id: ID del usuario
            websocket: Conexión WebSocket
        """
        await websocket.accept()
        
        # Agregar a la lista de conexiones del usuario
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        self.connected_users.add(user_id)
        
        # Enviar evento de conexión exitosa
        await websocket.send_text(event_connected(user_id))
        
        print(f"[WS] User {user_id} connected. Total connections: {self.total_connections}")
    
    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        """
        Remueve una conexión WebSocket.
        
        Args:
            user_id: ID del usuario
            websocket: Conexión WebSocket a remover
        """
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # Si no quedan conexiones, remover el user_id
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.connected_users.discard(user_id)
        
        print(f"[WS] User {user_id} disconnected. Total connections: {self.total_connections}")
    
    async def send_to_user(self, user_id: int, message: str) -> int:
        """
        Envía un mensaje a todas las conexiones de un usuario.
        
        Args:
            user_id: ID del usuario
            message: Mensaje JSON a enviar
            
        Returns:
            Número de conexiones a las que se envió
        """
        if user_id not in self.active_connections:
            return 0
        
        sent_count = 0
        dead_connections = []
        
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(message)
                sent_count += 1
            except Exception as e:
                print(f"[WS] Error sending to user {user_id}: {e}")
                dead_connections.append(websocket)
        
        # Limpiar conexiones muertas
        for ws in dead_connections:
            self.disconnect(user_id, ws)
        
        return sent_count
    
    async def broadcast(self, message: str, exclude_user: int = None) -> int:
        """
        Envía un mensaje a todos los usuarios conectados.
        
        Args:
            message: Mensaje JSON a enviar
            exclude_user: User ID a excluir (opcional)
            
        Returns:
            Número total de conexiones a las que se envió
        """
        total_sent = 0
        
        for user_id in list(self.connected_users):
            if exclude_user and user_id == exclude_user:
                continue
            
            sent = await self.send_to_user(user_id, message)
            total_sent += sent
        
        return total_sent
    
    def is_user_connected(self, user_id: int) -> bool:
        """Verifica si un usuario tiene conexiones activas."""
        return user_id in self.connected_users
    
    @property
    def total_connections(self) -> int:
        """Número total de conexiones activas."""
        return sum(len(conns) for conns in self.active_connections.values())
    
    @property
    def total_users(self) -> int:
        """Número de usuarios únicos conectados."""
        return len(self.connected_users)
    
    def get_stats(self) -> dict:
        """Estadísticas de conexiones."""
        return {
            "total_connections": self.total_connections,
            "total_users": self.total_users,
            "connected_user_ids": list(self.connected_users)
        }


# ==================== SINGLETON ====================

# Instancia global del manager
ws_manager = ConnectionManager()
