from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserCreateSchema(BaseModel):  # Esquema para crear usuario - SOLO campos básicos
    nombre: str  # Cambiado de nombre_completo a nombre
    correo: EmailStr  # Cambiado de correo_electronico a correo
    contraseña: str

    @validator('nombre')
    def validate_nombre(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('El nombre debe tener al menos 2 caracteres')
        return v.strip()

    @validator('contraseña')
    def validate_contraseña(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

class UserUpdateSchema(BaseModel):  # Esquema para actualizar usuario
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None
    contraseña: Optional[str] = None
    activo: Optional[bool] = None

    @validator('nombre')
    def validate_nombre(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('El nombre debe tener al menos 2 caracteres')
        return v.strip() if v else v

    @validator('contraseña')
    def validate_contraseña(cls, v):
        if v and len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

class LoginData(BaseModel):  # Esquema para login
    correo: EmailStr  # Cambiado de correo_electronico a correo
    contraseña: str

class UserResponseSchema(BaseModel):  # Esquema para respuestas (sin contraseña)
    user_id: int  # Cambiado de id a user_id para coincidir con tu tabla
    nombre: str
    correo: str
    fecha_registro: datetime
    activo: bool