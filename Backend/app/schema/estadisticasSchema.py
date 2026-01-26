# Backend/app/schema/estadisticasSchema.py
"""
Schemas Pydantic para estadísticas de usuario.
Sistema de puntos, rachas y niveles.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class EstadisticasUsuarioSchema(BaseModel):
    """Schema completo para datos de estadísticas"""
    estadistica_id: int
    user_id: int
    puntos_totales: int
    racha_actual: int
    racha_maxima: int
    nivel: int
    ultima_actividad: Optional[date] = None
    fecha_creacion: Optional[datetime] = None


class EstadisticasResumenSchema(BaseModel):
    """Schema para el resumen de estadísticas (endpoint principal)"""
    puntos_totales: int
    racha_actual: int
    racha_maxima: int
    nivel: int
    ultima_actividad: Optional[str] = None
    progreso_siguiente_nivel: int


class EstadisticasResponseSchema(BaseModel):
    """Schema para respuesta del endpoint"""
    success: bool
    data: Optional[EstadisticasResumenSchema] = None
    message: Optional[str] = None


class ActualizarPuntosSchema(BaseModel):
    """Schema para actualizar puntos (uso interno/futuro)"""
    puntos_delta: int


class RachaResponseSchema(BaseModel):
    """Schema para respuesta de actualización de racha"""
    racha_actual: int
    racha_maxima: int
    actualizada: bool


class NivelResponseSchema(BaseModel):
    """Schema para respuesta de actualización de nivel"""
    nivel_anterior: int
    nivel_nuevo: int
    subio_nivel: bool
