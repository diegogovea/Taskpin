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

# ============================================
# SCHEMAS PARA HÁBITOS VINCULADOS A PLANES
# ============================================

class VincularHabitoSchema(BaseModel):
    """Schema para vincular un hábito a un plan"""
    habito_usuario_id: int
    objetivo_id: Optional[int] = None  # Fase específica (opcional)
    obligatorio: bool = False
    notas: Optional[str] = None
    
    @validator('habito_usuario_id')
    def validate_habito_id(cls, v):
        if v <= 0:
            raise ValueError('habito_usuario_id debe ser mayor a 0')
        return v

class HabitoPlanResponseSchema(BaseModel):
    """Schema para respuesta de hábito vinculado"""
    plan_habito_id: int
    habito_usuario_id: int
    habito_id: int
    nombre: str
    descripcion: Optional[str] = None
    categoria: str
    puntos: int
    obligatorio: bool
    objetivo_id: Optional[int] = None
    notas: Optional[str] = None
    completado_hoy: bool
    hora_completado: Optional[str] = None

class ListaHabitosPlanResponseSchema(BaseModel):
    """Schema para lista de hábitos de un plan"""
    success: bool
    data: List[HabitoPlanResponseSchema]
    total: int

class VincularHabitoResponseSchema(BaseModel):
    """Schema para respuesta al vincular hábito"""
    success: bool
    message: str
    plan_habito_id: Optional[int] = None

class DesvincularHabitoResponseSchema(BaseModel):
    """Schema para respuesta al desvincular hábito"""
    success: bool
    message: str

# ============================================
# SCHEMAS PARA WIZARD DE CREACIÓN DE PLAN
# ============================================

class AgregarPlanConHabitosSchema(BaseModel):
    """Schema para agregar plan con hábitos vinculados (wizard)"""
    user_id: int
    plan_id: int
    dias_personalizados: Optional[int] = None
    fecha_inicio: Optional[date] = None  # Por defecto: hoy
    habitos_a_vincular: List[int] = []   # Lista de habito_usuario_id
    
    @validator('user_id', 'plan_id')
    def validate_ids(cls, v):
        if v <= 0:
            raise ValueError('IDs deben ser mayores a 0')
        return v
    
    @validator('dias_personalizados')
    def validate_dias(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Días personalizados debe ser mayor a 0')
        return v

class AgregarPlanConHabitosResponseSchema(BaseModel):
    """Schema para respuesta al agregar plan con hábitos"""
    success: bool
    message: str
    plan_usuario_id: Optional[int] = None
    habitos_vinculados: int = 0

# ============================================
# SCHEMAS PARA DASHBOARD DEL PLAN (2D)
# ============================================

class ProgresoGeneralSchema(BaseModel):
    """Progreso general del plan"""
    dias_transcurridos: int
    dias_totales: int
    porcentaje: int

class FaseActualDashboardSchema(BaseModel):
    """Información de la fase actual para el dashboard"""
    objetivo_id: int
    titulo: str
    descripcion: Optional[str] = None
    orden_fase: int
    total_fases: int
    dia_en_fase: int
    duracion_fase: int
    porcentaje_fase: int

class TareaDashboardSchema(BaseModel):
    """Tarea para el dashboard"""
    tarea_id: int
    titulo: str
    descripcion: Optional[str] = None
    tipo: str
    es_diaria: bool
    completada: bool
    hora_completada: Optional[str] = None

class HabitoDashboardSchema(BaseModel):
    """Hábito vinculado al plan para el dashboard"""
    habito_usuario_id: int
    nombre: str
    descripcion: Optional[str] = None
    categoria: str
    puntos: int
    completado_hoy: bool
    hora_completado: Optional[str] = None

class DashboardPlanResponseSchema(BaseModel):
    """Schema completo para el dashboard del plan"""
    plan_usuario_id: int
    meta_principal: str
    dificultad: str
    estado: str
    fecha: str
    
    progreso_general: ProgresoGeneralSchema
    fase_actual: FaseActualDashboardSchema
    
    tareas_hoy: List[TareaDashboardSchema]
    tareas_completadas: int
    tareas_total: int
    
    habitos_plan: List[HabitoDashboardSchema]
    habitos_completados: int
    habitos_total: int

# ============================================
# SCHEMAS PARA TIMELINE (2F)
# ============================================

class TimelinePlanInfoSchema(BaseModel):
    """Info básica del plan para el timeline"""
    plan_usuario_id: int
    meta_principal: str
    estado: str
    fecha_inicio: str
    fecha_objetivo: Optional[str] = None
    dias_totales: int
    dia_actual: int
    dias_restantes: int
    progreso_porcentaje: int

class TimelineFaseSchema(BaseModel):
    """Fase del plan para el timeline"""
    objetivo_id: int
    titulo: str
    descripcion: Optional[str] = None
    orden_fase: int
    dia_inicio: int
    dia_fin: int
    duracion_dias: int
    estado: str  # completada, en_progreso, atrasada, pendiente
    porcentaje_completado: int
    tareas_completadas: int
    tareas_total: int

class TimelineResponseSchema(BaseModel):
    """Schema completo para el timeline del plan"""
    success: bool
    plan_info: TimelinePlanInfoSchema
    fases: List[TimelineFaseSchema]
    total_fases: int

# ============================================
# SCHEMAS PARA PLANES PERSONALIZADOS (2H)
# ============================================

class TareaCustomSchema(BaseModel):
    """Tarea dentro de una fase personalizada"""
    titulo: str
    descripcion: Optional[str] = None
    tipo: str = 'diaria'  # diaria, semanal, única
    orden: Optional[int] = None
    
    @validator('titulo')
    def validate_titulo(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El título de la tarea debe tener al menos 3 caracteres')
        return v.strip()
    
    @validator('tipo')
    def validate_tipo(cls, v):
        if v not in ['diaria', 'semanal', 'única']:
            raise ValueError('El tipo debe ser: diaria, semanal o única')
        return v

class FaseCustomSchema(BaseModel):
    """Fase de un plan personalizado"""
    titulo: str
    descripcion: Optional[str] = None
    duracion_dias: int
    orden_fase: int
    tareas: List[TareaCustomSchema] = []
    
    @validator('titulo')
    def validate_titulo(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El título de la fase debe tener al menos 3 caracteres')
        return v.strip()
    
    @validator('duracion_dias')
    def validate_duracion(cls, v):
        if v < 1 or v > 365:
            raise ValueError('La duración debe estar entre 1 y 365 días')
        return v

class CrearPlanCustomSchema(BaseModel):
    """Schema para crear un plan personalizado"""
    user_id: int
    meta_principal: str
    descripcion: Optional[str] = None
    plazo_dias_estimado: int
    dificultad: str = 'intermedio'
    categoria_plan_id: Optional[int] = None
    fases: List[FaseCustomSchema]
    habitos_a_vincular: Optional[List[int]] = None
    es_publico: bool = False
    
    @validator('meta_principal')
    def validate_meta(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('La meta principal debe tener al menos 5 caracteres')
        return v.strip()
    
    @validator('plazo_dias_estimado')
    def validate_plazo(cls, v):
        if v < 7 or v > 365:
            raise ValueError('El plazo debe estar entre 7 y 365 días')
        return v
    
    @validator('dificultad')
    def validate_dificultad(cls, v):
        if v not in ['fácil', 'intermedio', 'difícil']:
            raise ValueError('La dificultad debe ser: fácil, intermedio o difícil')
        return v
    
    @validator('fases')
    def validate_fases(cls, v):
        if len(v) < 1:
            raise ValueError('El plan debe tener al menos 1 fase')
        if len(v) > 10:
            raise ValueError('El plan no puede tener más de 10 fases')
        return v

class CrearPlanCustomResponseSchema(BaseModel):
    """Respuesta al crear un plan personalizado"""
    success: bool
    message: str
    plan_id: Optional[int] = None
    plan_usuario_id: Optional[int] = None
    total_fases: int = 0
    total_tareas: int = 0
