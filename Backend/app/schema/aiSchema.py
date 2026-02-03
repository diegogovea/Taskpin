"""
Schemas para los endpoints de Inteligencia Artificial

Define los modelos de respuesta para:
- Recomendaciones de hábitos
- Predicciones de completado
"""

from pydantic import BaseModel
from typing import List, Optional, Dict


# ========================================
# SCHEMAS PARA RECOMENDACIONES
# ========================================

class RecomendacionHabitoSchema(BaseModel):
    """Una recomendación individual de hábito"""
    habito_id: int
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    puntos_base: int = 10
    score: float
    razon: str


class RecomendacionesResponseSchema(BaseModel):
    """Respuesta del endpoint de recomendaciones"""
    success: bool
    user_id: int
    total_recomendaciones: int
    recomendaciones: List[RecomendacionHabitoSchema]


class UsuarioSimilarSchema(BaseModel):
    """Info de un usuario similar"""
    user_id: int
    similarity: float


class UsuariosSimilaresResponseSchema(BaseModel):
    """Respuesta del endpoint de usuarios similares"""
    success: bool
    user_id: int
    total_similares: int
    usuarios_similares: List[UsuarioSimilarSchema]


# ========================================
# SCHEMAS PARA PREDICCIONES
# ========================================

class PrediccionHabitoSchema(BaseModel):
    """Predicción para un hábito individual"""
    habito_usuario_id: int
    habito_id: int
    nombre: str
    probabilidad: float
    factores_positivos: List[str]
    factores_negativos: List[str]


class PrediccionesHoyResponseSchema(BaseModel):
    """Respuesta del endpoint de predicciones"""
    success: bool
    user_id: int
    fecha: str
    total_habitos: int
    predicciones: List[PrediccionHabitoSchema]


class PrediccionIndividualResponseSchema(BaseModel):
    """Respuesta para predicción de un solo hábito"""
    success: bool
    habito_usuario_id: int
    nombre: Optional[str] = None
    probabilidad: float
    factores_positivos: List[str]
    factores_negativos: List[str]
    features: Optional[Dict] = None


# ========================================
# SCHEMAS PARA INFO DEL MODELO
# ========================================

class ModeloInfoSchema(BaseModel):
    """Información sobre el estado del modelo de IA"""
    is_trained: bool
    model_exists: bool
    training_accuracy: Optional[float] = None
    feature_names: List[str]


class EntrenarModeloResponseSchema(BaseModel):
    """Respuesta del endpoint de entrenamiento"""
    success: bool
    message: str
    total_records: Optional[int] = None
    accuracy: Optional[float] = None
    feature_importance: Optional[Dict[str, float]] = None
