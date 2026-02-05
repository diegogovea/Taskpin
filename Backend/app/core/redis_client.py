"""
Redis Client for Taskpin
========================
Conexión a Redis usando db=1 para no interferir con otros proyectos.
"""

import json
import os
from typing import Any, Optional
from datetime import timedelta

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None


class RedisClient:
    """
    Cliente Redis con prefijos para Taskpin.
    Usa db=1 para separar de otros proyectos.
    """
    
    PREFIX = "taskpin:"  # Prefijo para todas las keys
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 1,  # DB 1 para Taskpin (db 0 es de otros proyectos)
        decode_responses: bool = True
    ):
        self.host = host
        self.port = port
        self.db = db
        self._client: Optional[redis.Redis] = None
        self._connected = False
        self.decode_responses = decode_responses
        
        if REDIS_AVAILABLE:
            self._connect()
    
    def _connect(self) -> bool:
        """Intenta conectar a Redis."""
        if not REDIS_AVAILABLE:
            print("[Redis] redis-py not installed. Running without cache.")
            return False
            
        try:
            self._client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=self.decode_responses,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self._client.ping()
            self._connected = True
            print(f"[Redis] Connected to {self.host}:{self.port} db={self.db}")
            return True
        except redis.ConnectionError as e:
            print(f"[Redis] Connection failed: {e}. Running without cache.")
            self._connected = False
            return False
        except Exception as e:
            print(f"[Redis] Unexpected error: {e}. Running without cache.")
            self._connected = False
            return False
    
    @property
    def is_connected(self) -> bool:
        """Verifica si está conectado a Redis."""
        return self._connected and self._client is not None
    
    def _make_key(self, key: str) -> str:
        """Agrega el prefijo taskpin: a la key."""
        if key.startswith(self.PREFIX):
            return key
        return f"{self.PREFIX}{key}"
    
    # ==================== OPERACIONES BÁSICAS ====================
    
    def get(self, key: str) -> Optional[str]:
        """Obtiene un valor de Redis."""
        if not self.is_connected:
            return None
        try:
            return self._client.get(self._make_key(key))
        except Exception as e:
            print(f"[Redis] GET error: {e}")
            return None
    
    def set(
        self, 
        key: str, 
        value: str, 
        ttl: Optional[int] = None,
        ttl_timedelta: Optional[timedelta] = None
    ) -> bool:
        """
        Guarda un valor en Redis.
        
        Args:
            key: Clave
            value: Valor (string)
            ttl: Tiempo de vida en segundos
            ttl_timedelta: Tiempo de vida como timedelta
        """
        if not self.is_connected:
            return False
        try:
            full_key = self._make_key(key)
            if ttl_timedelta:
                ttl = int(ttl_timedelta.total_seconds())
            
            if ttl:
                self._client.setex(full_key, ttl, value)
            else:
                self._client.set(full_key, value)
            return True
        except Exception as e:
            print(f"[Redis] SET error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Elimina una key."""
        if not self.is_connected:
            return False
        try:
            self._client.delete(self._make_key(key))
            return True
        except Exception as e:
            print(f"[Redis] DELETE error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Verifica si una key existe."""
        if not self.is_connected:
            return False
        try:
            return self._client.exists(self._make_key(key)) > 0
        except Exception:
            return False
    
    # ==================== OPERACIONES JSON ====================
    
    def get_json(self, key: str) -> Optional[Any]:
        """Obtiene y deserializa JSON de Redis."""
        value = self.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return None
    
    def set_json(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None,
        ttl_timedelta: Optional[timedelta] = None
    ) -> bool:
        """Serializa a JSON y guarda en Redis."""
        try:
            json_str = json.dumps(value, ensure_ascii=False, default=str)
            return self.set(key, json_str, ttl=ttl, ttl_timedelta=ttl_timedelta)
        except (TypeError, ValueError) as e:
            print(f"[Redis] JSON serialization error: {e}")
            return False
    
    # ==================== CACHE HELPERS ====================
    
    def cache_predictions(self, user_id: int, predictions: list, ttl: int = 3600) -> bool:
        """
        Cachea predicciones de AI para un usuario.
        TTL default: 1 hora
        """
        key = f"predictions:user:{user_id}"
        return self.set_json(key, predictions, ttl=ttl)
    
    def get_cached_predictions(self, user_id: int) -> Optional[list]:
        """Obtiene predicciones cacheadas."""
        key = f"predictions:user:{user_id}"
        return self.get_json(key)
    
    def cache_recommendations(self, user_id: int, recommendations: list, ttl: int = 3600) -> bool:
        """
        Cachea recomendaciones de AI para un usuario.
        TTL default: 1 hora
        """
        key = f"recommendations:user:{user_id}"
        return self.set_json(key, recommendations, ttl=ttl)
    
    def get_cached_recommendations(self, user_id: int) -> Optional[list]:
        """Obtiene recomendaciones cacheadas."""
        key = f"recommendations:user:{user_id}"
        return self.get_json(key)
    
    def invalidate_user_cache(self, user_id: int) -> None:
        """Invalida todo el cache de un usuario."""
        self.delete(f"predictions:user:{user_id}")
        self.delete(f"recommendations:user:{user_id}")
    
    # ==================== STATS ====================
    
    def get_stats(self) -> dict:
        """Obtiene estadísticas de Redis."""
        if not self.is_connected:
            return {"connected": False}
        try:
            info = self._client.info()
            keys = self._client.keys(f"{self.PREFIX}*")
            return {
                "connected": True,
                "host": self.host,
                "port": self.port,
                "db": self.db,
                "taskpin_keys": len(keys),
                "used_memory": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
            }
        except Exception as e:
            return {"connected": False, "error": str(e)}


# ==================== SINGLETON ====================

# Instancia global del cliente Redis
redis_client = RedisClient(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=int(os.getenv("REDIS_DB", 1))  # db=1 para Taskpin
)
