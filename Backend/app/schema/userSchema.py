from pydantic import BaseModel, EmailStr, validator  # Importa BaseModel para validación
from typing import Optional  # Importa Optional para campos opcionales
from datetime import date, datetime  # Para manejar fechas

class UserSchema(BaseModel):  # Define esquema completo del usuario
    id: Optional[int] = None  # Campo opcional 'id'
    nombre_completo: str  # Campo obligatorio para nombre completo
    correo_electronico: EmailStr  # Campo obligatorio tipo email validado
    usuario: str  # Campo obligatorio para username único
    contraseña: str  # Campo obligatorio para contraseña
    fecha_nacimiento: date  # Campo obligatorio para fecha de nacimiento
    edad: Optional[int] = None  # Campo opcional, se calcula automáticamente
    puntos_totales: Optional[int] = 0  # Campo opcional con valor por defecto
    fecha_registro: Optional[datetime] = None  # Se asigna automáticamente en DB
    ultimo_acceso: Optional[datetime] = None  # Se asigna automáticamente en DB
    activo: Optional[bool] = True  # Campo opcional con valor por defecto

    @validator('nombre_completo')
    def validate_nombre_completo(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('El nombre completo debe tener al menos 2 caracteres')
        return v.strip()

    @validator('usuario')
    def validate_usuario(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El usuario debe tener al menos 3 caracteres')
        return v.strip()

    @validator('contraseña')
    def validate_contraseña(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

class UserCreateSchema(BaseModel):  # Esquema para crear usuario (sin campos auto-generados)
    nombre_completo: str
    correo_electronico: EmailStr
    usuario: str
    contraseña: str
    fecha_nacimiento: date

    @validator('nombre_completo')
    def validate_nombre_completo(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('El nombre completo debe tener al menos 2 caracteres')
        return v.strip()

    @validator('usuario')
    def validate_usuario(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El usuario debe tener al menos 3 caracteres')
        return v.strip()

    @validator('contraseña')
    def validate_contraseña(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

class UserUpdateSchema(BaseModel):  # Esquema para actualizar usuario
    nombre_completo: Optional[str] = None
    correo_electronico: Optional[EmailStr] = None
    usuario: Optional[str] = None
    contraseña: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    puntos_totales: Optional[int] = None
    activo: Optional[bool] = None

class LoginData(BaseModel):  # Esquema para login
    correo_electronico: EmailStr  # Cambiado de email a correo_electronico
    contraseña: str

class UserResponseSchema(BaseModel):  # Esquema para respuestas (sin contraseña)
    id: int
    nombre_completo: str
    correo_electronico: str
    usuario: str
    fecha_nacimiento: date
    edad: Optional[int]
    puntos_totales: int
    fecha_registro: datetime
    ultimo_acceso: datetime
    activo: bool