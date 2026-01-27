from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime, time

# ============================================
# SCHEMAS PARA CATEGORÍAS Y PLANES BÁSICOS
# ============================================

class CategoriaPlanSchema(BaseModel):
    """Schema para categoría de plan"""
    categoria_plan_id: int
    nombre: str
    descripcion: Optional[str]
    icono: Optional[str]
    orden: int

class PlanPredeterminadoSchema(BaseModel):
    """Schema para plan predeterminado básico"""
    plan_id: int
    meta_principal: str
    descripcion: Optional[str]
    plazo_dias_estimado: int
    dificultad: str
    imagen: Optional[str]
    categoria_plan_id: Optional[int] = None
    categoria_nombre: Optional[str] = None

    @validator('dificultad')
    def validate_dificultad(cls, v):
        if v not in ['fácil', 'intermedio', 'difícil']:
            raise ValueError('La dificultad debe ser: fácil, intermedio o difícil')
        return v

    @validator('plazo_dias_estimado')
    def validate_plazo(cls, v):
        if v <= 0:
            raise ValueError('El plazo en días debe ser mayor a 0')
        return v

# ============================================
# SCHEMAS PARA AGREGAR PLAN A USUARIO
# ============================================

class AgregarPlanUsuarioSchema(BaseModel):
    """Schema para agregar un plan a un usuario"""
    user_id: int
    plan_id: int
    dias_personalizados: Optional[int] = None

    @validator('user_id', 'plan_id')
    def validate_ids(cls, v):
        if v <= 0:
            raise ValueError('Los IDs deben ser mayores a 0')
        return v

    @validator('dias_personalizados')
    def validate_dias_personalizados(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Los días personalizados deben ser mayores a 0')
        return v

# ============================================
# SCHEMAS PARA PLAN COMPLETO (CON FASES Y TAREAS)
# ============================================

class TareaPredeterminadaSchema(BaseModel):
    """Schema para tarea predeterminada"""
    tarea_id: int
    titulo: str
    descripcion: Optional[str]
    tipo: str
    orden: Optional[int]
    es_diaria: bool

    @validator('tipo')
    def validate_tipo(cls, v):
        if v not in ['diaria', 'semanal', 'única']:
            raise ValueError('El tipo debe ser: diaria, semanal o única')
        return v

class ObjetivoIntermedioSchema(BaseModel):
    """Schema para objetivo intermedio (fase del plan)"""
    objetivo_id: int
    titulo: str
    descripcion: Optional[str]
    orden_fase: int
    duracion_dias: Optional[int]
    tareas: List[TareaPredeterminadaSchema] = []

    @validator('orden_fase')
    def validate_orden_fase(cls, v):
        if v <= 0:
            raise ValueError('El orden de fase debe ser mayor a 0')
        return v

    @validator('duracion_dias')
    def validate_duracion(cls, v):
        if v is not None and v <= 0:
            raise ValueError('La duración en días debe ser mayor a 0')
        return v

class PlanCompletoSchema(BaseModel):
    """Schema para plan completo con todas sus fases y tareas"""
    plan_id: int
    meta_principal: str
    descripcion: Optional[str]
    plazo_dias_estimado: int
    dificultad: str
    imagen: Optional[str]
    categoria_nombre: Optional[str]
    fases: List[ObjetivoIntermedioSchema] = []
    total_fases: int
    total_tareas: int

# ============================================
# SCHEMAS PARA PLANES DEL USUARIO
# ============================================

class PlanUsuarioSchema(BaseModel):
    """Schema para plan del usuario con progreso"""
    plan_usuario_id: int
    user_id: Optional[int] = None
    plan_id: Optional[int] = None
    fecha_inicio: Optional[date]
    fecha_objetivo: Optional[date]
    estado: str
    progreso_porcentaje: int
    meta_principal: Optional[str] = None
    descripcion: Optional[str] = None
    dificultad: Optional[str] = None
    imagen: Optional[str] = None

    @validator('estado')
    def validate_estado(cls, v):
        if v not in ['activo', 'pausado', 'completado', 'cancelado']:
            raise ValueError('El estado debe ser: activo, pausado, completado o cancelado')
        return v

    @validator('progreso_porcentaje')
    def validate_progreso(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('El progreso debe estar entre 0 y 100')
        return v

# ============================================
# SCHEMAS PARA TAREAS DIARIAS
# ============================================

class TareaDiariaSchema(BaseModel):
    """Schema para tarea diaria del usuario"""
    tarea_id: int
    titulo: str
    descripcion: Optional[str]
    tipo: str
    es_diaria: bool
    completada: bool
    hora_completada: Optional[str] = None  # Puede venir como string desde la BD
    tarea_usuario_id: Optional[int] = None

class FaseActualSchema(BaseModel):
    """Schema para la fase actual del plan"""
    objetivo_id: int
    titulo: str
    descripcion: Optional[str]
    orden_fase: int
    duracion_dias: Optional[int]

class TareasDiariasResponseSchema(BaseModel):
    """Schema para respuesta de tareas diarias"""
    plan_usuario_id: int
    meta_principal: str
    dificultad: str
    fecha: str
    dias_transcurridos: int
    fase_actual: FaseActualSchema
    tareas: List[TareaDiariaSchema]

# ============================================
# SCHEMAS PARA MARCAR TAREAS
# ============================================

class MarcarTareaSchema(BaseModel):
    """Schema para marcar/desmarcar una tarea como completada"""
    plan_usuario_id: int
    tarea_id: int
    fecha: Optional[date] = None

    @validator('plan_usuario_id', 'tarea_id')
    def validate_ids(cls, v):
        if v <= 0:
            raise ValueError('Los IDs deben ser mayores a 0')
        return v

# ============================================
# SCHEMAS DE RESPUESTA
# ============================================

class PlanResponseSchema(BaseModel):
    """Schema genérico para respuestas de planes"""
    success: bool
    message: str
    data: Optional[dict] = None

class PlanUsuarioResponseSchema(BaseModel):
    """Schema para respuesta al agregar plan a usuario"""
    success: bool
    message: str
    plan_usuario_id: Optional[int] = None

class TareaMarcadaResponseSchema(BaseModel):
    """Schema para respuesta al marcar tarea"""
    success: bool
    message: str
    tarea_id: Optional[int] = None
    completada: Optional[bool] = None

# ============================================
# SCHEMAS PARA GESTIÓN DE ESTADO DE PLANES
# ============================================

class PlanEstadoUpdateSchema(BaseModel):
    """Schema para actualizar estado de un plan"""
    estado: str
    
    @validator('estado')
    def validate_estado(cls, v):
        estados_validos = ['activo', 'pausado', 'completado', 'cancelado']
        if v not in estados_validos:
            raise ValueError(f'Estado debe ser: {", ".join(estados_validos)}')
        return v

class PlanEstadoResponseSchema(BaseModel):
    """Schema para respuesta de cambio de estado"""
    success: bool
    message: str
    data: Optional[dict] = None
