# Backend/app/config.py
"""
Configuración centralizada del backend.
Carga las variables de entorno desde .env
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Database Configuration
DATABASE_NAME = os.getenv('DATABASE_NAME', 'taskpin')
DATABASE_USER = os.getenv('DATABASE_USER', 'postgres')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', '123456')
DATABASE_HOST = os.getenv('DATABASE_HOST', 'localhost')
DATABASE_PORT = os.getenv('DATABASE_PORT', '5433')

# Connection string para psycopg
DATABASE_URL = f"dbname={DATABASE_NAME} user={DATABASE_USER} password={DATABASE_PASSWORD} host={DATABASE_HOST} port={DATABASE_PORT}"

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'mi_clave_secreta')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
