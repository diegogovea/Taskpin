from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date

FRECUENCIAS_VALIDAS = [
    'diario', 'semanal', 'mensual', 'anual',
    'cada_2_dias', 'cada_2_semanas', 'cada_2_meses',
    'personalizado',
]

import re as _re
def _es_frecuencia_valida(v: str) -> bool:
    if v in FRECUENCIAS_VALIDAS:
        return True
    # Acepta patrón: cada_N_dias | cada_N_semanas | cada_N_meses
    return bool(_re.match(r'^cada_\d+_(dias|semanas|meses)$', v))

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
        if not _es_frecuencia_valida(v):
            raise ValueError(f'Frecuencia inválida')
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

class AddHabitoConConfigSchema(BaseModel):
    """Agregar un hábito con toda la configuración en un solo call."""
    habito_id: int
    frecuencia_personal: Optional[str] = 'diario'
    color: Optional[str] = None
    icono: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    meta_valor: Optional[float] = None
    meta_unidad: Optional[str] = None
    puntos_base_override: Optional[int] = None

    @validator('frecuencia_personal')
    def validate_frecuencia(cls, v):
        if not _es_frecuencia_valida(v):
            raise ValueError('Frecuencia inválida')
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
        if v not in FRECUENCIAS_VALIDAS:
            raise ValueError(f'Frecuencia inválida. Opciones: {", ".join(FRECUENCIAS_VALIDAS)}')
        return v


class HabitoPersonalizadoCreateSchema(BaseModel):
    """Schema para crear un hábito personalizado (con todos los campos opcionales)"""
    nombre: str
    descripcion: Optional[str] = None
    frecuencia_personal: Optional[str] = 'diario'
    color: Optional[str] = None          # hex, e.g. '#6366F1'
    icono: Optional[str] = None          # Ionicon name, e.g. 'book-outline'
    tipo: Optional[str] = 'bueno'        # 'bueno' | 'por_eliminar'
    fecha_fin: Optional[date] = None
    meta_valor: Optional[float] = None
    meta_unidad: Optional[str] = None

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
        if v not in FRECUENCIAS_VALIDAS:
            raise ValueError(f'Frecuencia inválida. Opciones: {", ".join(FRECUENCIAS_VALIDAS)}')
        return v

    @validator('color')
    def validate_color(cls, v):
        import re
        if v is not None and not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('El color debe ser un hex válido, ej. #6366F1')
        return v

    @validator('tipo')
    def validate_tipo(cls, v):
        if v not in ('bueno', 'por_eliminar'):
            raise ValueError('El tipo debe ser bueno o por_eliminar')
        return v


class HabitoCamposExtraUpdateSchema(BaseModel):
    """Schema para actualizar campos extra de cualquier hábito de usuario"""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    color: Optional[str] = None
    icono: Optional[str] = None
    tipo: Optional[str] = None
    fecha_fin: Optional[date] = None
    meta_valor: Optional[float] = None
    meta_unidad: Optional[str] = None


class HabitoPersonalizadoUpdateSchema(BaseModel):
    """Schema para editar un hábito personalizado"""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    color: Optional[str] = None
    icono: Optional[str] = None
    tipo: Optional[str] = None
    fecha_fin: Optional[date] = None
    meta_valor: Optional[float] = None
    meta_unidad: Optional[str] = None

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

    @validator('color')
    def validate_color(cls, v):
        import re
        if v is not None and not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('El color debe ser un hex válido, ej. #6366F1')
        return v

    @validator('tipo')
    def validate_tipo(cls, v):
        if v is not None and v not in ('bueno', 'por_eliminar'):
            raise ValueError('El tipo debe ser bueno o por_eliminar')
        return v