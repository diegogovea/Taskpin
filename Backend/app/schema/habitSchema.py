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