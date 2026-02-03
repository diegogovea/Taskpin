"""
Schemas para Reflexiones Diarias
"""
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date

# Estados de ánimo válidos
ESTADOS_ANIMO_VALIDOS = ['great', 'good', 'neutral', 'low', 'bad']

# ============================================
# SCHEMAS DE REQUEST
# ============================================

class CrearReflexionSchema(BaseModel):
    """Schema para crear o actualizar una reflexión"""
    estado_animo: str
    que_salio_bien: Optional[str] = None
    que_mejorar: Optional[str] = None
    
    @validator('estado_animo')
    def validate_estado_animo(cls, v):
        if v not in ESTADOS_ANIMO_VALIDOS:
            raise ValueError(f'Estado de ánimo debe ser: {", ".join(ESTADOS_ANIMO_VALIDOS)}')
        return v
    
    @validator('que_salio_bien', 'que_mejorar')
    def validate_texto(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError('El texto no puede exceder 2000 caracteres')
        return v

# ============================================
# SCHEMAS DE RESPONSE
# ============================================

class ReflexionSchema(BaseModel):
    """Schema para una reflexión individual"""
    reflexion_id: int
    fecha: str
    estado_animo: str
    que_salio_bien: Optional[str] = None
    que_mejorar: Optional[str] = None
    created_at: Optional[str] = None

class ReflexionHoyResponseSchema(BaseModel):
    """Schema para respuesta de reflexión de hoy"""
    tiene_reflexion: bool
    reflexion: Optional[ReflexionSchema] = None

class ResumenAnimoSchema(BaseModel):
    """Schema para resumen de estados de ánimo"""
    great: int = 0
    good: int = 0
    neutral: int = 0
    low: int = 0
    bad: int = 0

class HistorialReflexionesResponseSchema(BaseModel):
    """Schema para historial de reflexiones"""
    success: bool
    reflexiones: List[ReflexionSchema]
    total: int
    resumen: ResumenAnimoSchema

class CrearReflexionResponseSchema(BaseModel):
    """Schema para respuesta al crear reflexión"""
    success: bool
    message: str
    reflexion_id: Optional[int] = None
    es_nueva: bool = True  # True si es nueva, False si se actualizó
