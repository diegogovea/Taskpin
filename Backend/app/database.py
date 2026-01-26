# Backend/app/database.py
"""
Módulo centralizado para el pool de conexiones a la base de datos.
Todas las clases de conexión comparten este pool único.
"""

from psycopg_pool import ConnectionPool
from .config import DATABASE_URL
import logging

# Configurar logging
logger = logging.getLogger(__name__)

# Pool de conexiones único para toda la aplicación
# Se inicializa cuando se importa este módulo
connection_pool: ConnectionPool = None

def init_pool():
    """
    Inicializa el pool de conexiones.
    Debe llamarse al iniciar la aplicación.
    """
    global connection_pool
    
    if connection_pool is not None:
        logger.warning("El pool de conexiones ya está inicializado")
        return
    
    try:
        connection_pool = ConnectionPool(
            DATABASE_URL,
            min_size=2,      # Mínimo 2 conexiones siempre disponibles
            max_size=10,     # Máximo 10 conexiones simultáneas
            open=True        # Crear conexiones al inicializar
        )
        logger.info(f"Pool de conexiones inicializado: min={2}, max={10}")
    except Exception as e:
        logger.error(f"Error al inicializar pool de conexiones: {e}")
        raise

def get_pool() -> ConnectionPool:
    """
    Obtiene el pool de conexiones.
    Si no está inicializado, lo inicializa automáticamente.
    """
    global connection_pool
    
    if connection_pool is None:
        logger.info("Pool no inicializado, inicializando automáticamente...")
        init_pool()
    
    return connection_pool

def close_pool():
    """
    Cierra el pool de conexiones.
    Debe llamarse al cerrar la aplicación.
    """
    global connection_pool
    
    if connection_pool is not None:
        connection_pool.close()
        connection_pool = None
        logger.info("Pool de conexiones cerrado")

# Inicializar automáticamente al importar el módulo
init_pool()
