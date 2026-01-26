from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date

class CategoriaHabitoSchema(BaseModel):
    categoria_id: int
    nombre: str
    descripcion: Optional[str]
    icono: Optional[str]
    orden: int

class HabitoPredeterminadoSchema(BaseModel):
    habito_id: int
    categoria_id: int
    nombre: str
    descripcion: Optional[str]
    frecuencia_recomendada: str
    puntos_base: int
    categoria_nombre: Optional[str] = None

class AddHabitoToUserSchema(BaseModel):
    user_id: int
    habito_id: int
    frecuencia_personal: Optional[str] = 'diario'

    @validator('frecuencia_personal')
    def validate_frecuencia(cls, v):
        if v not in ['diario', 'semanal', 'personalizado']:
            raise ValueError('La frecuencia debe ser diario, semanal o personalizado')
        return v

class AddMultipleHabitosSchema(BaseModel):
    user_id: int
    habito_ids: List[int]
    frecuencia_personal: Optional[str] = 'diario'

    @validator('habito_ids')
    def validate_habito_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Debe seleccionar al menos un hábito')
        return v

class HabitoUsuarioSchema(BaseModel):
    habito_usuario_id: int
    user_id: int
    habito_id: int
    fecha_agregado: date
    activo: bool
    frecuencia_personal: str
    nombre: str
    descripcion: Optional[str]
    puntos_base: int
    categoria_nombre: str

class HabitoResponseSchema(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class HabitoFrecuenciaUpdateSchema(BaseModel):
    frecuencia_personal: str

    @validator('frecuencia_personal')
    def validate_frecuencia(cls, v):
        allowed = ['diario', 'semanal', 'mensual', 'personalizado']
        if v not in allowed:
            raise ValueError(f'La frecuencia debe ser: {", ".join(allowed)}')
        return v


class HabitoPersonalizadoCreateSchema(BaseModel):
    """Schema para crear un hábito personalizado"""
    nombre: str
    descripcion: Optional[str] = None
    frecuencia_personal: Optional[str] = 'diario'

    @validator('nombre')
    def validate_nombre(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre no puede exceder 100 caracteres')
        return v

    @validator('descripcion')
    def validate_descripcion(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError('La descripción no puede exceder 500 caracteres')
        return v

    @validator('frecuencia_personal')
    def validate_frecuencia(cls, v):
        allowed = ['diario', 'semanal', 'mensual', 'personalizado']
        if v not in allowed:
            raise ValueError(f'La frecuencia debe ser: {", ".join(allowed)}')
        return v


class HabitoPersonalizadoUpdateSchema(BaseModel):
    """Schema para editar un hábito personalizado"""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

    @validator('nombre')
    def validate_nombre(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 3:
                raise ValueError('El nombre debe tener al menos 3 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre no puede exceder 100 caracteres')
        return v

    @validator('descripcion')
    def validate_descripcion(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError('La descripción no puede exceder 500 caracteres')
        return v