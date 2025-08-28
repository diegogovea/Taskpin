# Backend/app/main.py

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from .model.userConnection import userConnection
from .model.planesConnection import PlanesConnection
from .schema.userSchema import UserCreateSchema, UserUpdateSchema, LoginData, UserResponseSchema
from fastapi.middleware.cors import CORSMiddleware

SECRET_KEY = "mi_clave_secreta"
ALGORITHM = "HS256"

app = FastAPI()
conn = userConnection()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELOS PYDANTIC PARA PLANES
# ============================================
class AgregarPlanRequest(BaseModel):
    user_id: int
    plan_id: int
    dias_personalizados: Optional[int] = None

# Función auxiliar para convertir tupla de DB a diccionario
def tuple_to_user_dict(data):
    """Convierte tupla de base de datos a diccionario"""
    if not data:
        return None
    return {
        "user_id": data[0],
        "nombre": data[1],
        "correo": data[2],
        "contraseña": data[3],  # Solo para uso interno
        "fecha_registro": data[4],
        "activo": data[5]
    }

# Función auxiliar para respuesta sin contraseña
def user_response(data):
    """Convierte datos de usuario para respuesta (sin contraseña)"""
    user_dict = tuple_to_user_dict(data)
    if user_dict:
        user_dict.pop("contraseña", None)  # Elimina contraseña de la respuesta
    return user_dict

# ============================================
# ENDPOINTS DE USUARIOS
# ============================================

@app.get("/", status_code=HTTP_200_OK)
def get_all_users():
    """Obtener todos los usuarios"""
    items = []
    for data in conn.read_all():
        user_dict = user_response(data)
        if user_dict:
            items.append(user_dict)
    return items

@app.get("/api/usuario/{user_id}", status_code=HTTP_200_OK)
def get_one_user(user_id: int):
    """Obtener un usuario por ID"""
    data = conn.read_one(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user_response(data)

@app.post("/register", status_code=HTTP_201_CREATED)
def register(user_data: UserCreateSchema):
    """Registrar nuevo usuario"""
    # Verificar si el correo ya existe
    existing_user = conn.read_by_email(user_data.correo)
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    try:
        data = user_data.dict()
        data["activo"] = True
        
        # Insertar usuario y obtener su ID
        user_id = conn.write(data)
        
        return {"message": "Usuario registrado correctamente", "user_id": user_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar usuario: {str(e)}")

@app.post("/login")
def login(user_data: LoginData):
    """Iniciar sesión"""
    # Usar el método authenticate_user que verifica la contraseña hasheada
    user = conn.authenticate_user(user_data.correo, user_data.contraseña)
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Verificar que el usuario esté activo
    if not user[5]:  # user[5] es el campo 'activo'
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    
    # Crear token JWT
    token_data = {"sub": user[2], "user_id": user[0]}  # sub = correo, user_id para referencia
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user_id": user[0],
        "nombre": user[1]
    }

@app.put("/api/usuario/{user_id}", status_code=HTTP_204_NO_CONTENT)
def update_user(user_id: int, user_data: UserUpdateSchema):
    """Actualizar usuario"""
    # Verificar que el usuario existe
    existing_user = conn.read_one(user_id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Si se está actualizando el correo, verificar que no exista
    if user_data.correo:
        existing_email = conn.read_by_email(user_data.correo)
        if existing_email and existing_email[0] != user_id:
            raise HTTPException(status_code=400, detail="El correo electrónico ya está en uso")
    
    data = user_data.dict(exclude_unset=True)  # Solo campos que se envían
    conn.update(user_id, data)
    return Response(status_code=HTTP_204_NO_CONTENT)

@app.delete("/api/usuario/{user_id}", status_code=HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
    """Eliminar usuario"""
    # Verificar que el usuario existe
    existing_user = conn.read_one(user_id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    conn.delete(user_id)
    return Response(status_code=HTTP_204_NO_CONTENT)

# ============================================
# ENDPOINTS DE PLANES
# ============================================

@app.get("/api/planes/categorias")
def get_categorias_planes():
    """GET /api/planes/categorias - Obtener categorías de planes"""
    try:
        planes_conn = PlanesConnection()
        categorias = planes_conn.get_categorias_planes()
        
        return {
            'success': True,
            'categorias': categorias
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error al obtener categorías: {str(e)}')

@app.get("/api/planes/categoria/{categoria_id}")
def get_planes_por_categoria(categoria_id: int):
    """GET /api/planes/categoria/1 - Obtener planes de una categoría"""
    try:
        planes_conn = PlanesConnection()
        planes = planes_conn.get_planes_por_categoria(categoria_id)
        
        return {
            'success': True,
            'planes': planes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error al obtener planes: {str(e)}')

@app.get("/api/planes/detalle/{plan_id}")
def get_plan_completo(plan_id: int):
    """GET /api/planes/detalle/1 - Obtener plan completo con fases y tareas"""
    try:
        planes_conn = PlanesConnection()
        plan_completo = planes_conn.get_plan_completo(plan_id)
        
        if not plan_completo:
            raise HTTPException(status_code=404, detail='Plan no encontrado')
        
        return {
            'success': True,
            'plan': plan_completo
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error al obtener plan completo: {str(e)}')

@app.post("/api/planes/agregar")
def agregar_plan_usuario(data: AgregarPlanRequest):
    """POST /api/planes/agregar - VERSIÓN SIMPLE"""
    print(f"DEBUG MAIN: Datos recibidos: {data}")
    
    try:
        planes_conn = PlanesConnection()
        print(f"DEBUG MAIN: Conexión creada")
        
        resultado = planes_conn.agregar_plan_usuario(data.user_id, data.plan_id, None)
        print(f"DEBUG MAIN: Resultado recibido: {resultado}")
        print(f"DEBUG MAIN: Tipo de resultado: {type(resultado)}")
        
        if resultado is None:
            print("DEBUG MAIN ERROR: Resultado es None")
            return {'success': False, 'message': 'Error interno: resultado None'}
        
        if not isinstance(resultado, dict):
            print(f"DEBUG MAIN ERROR: Resultado no es dict: {type(resultado)}")
            return {'success': False, 'message': 'Error interno: formato inválido'}
        
        if 'success' not in resultado:
            print("DEBUG MAIN ERROR: Sin key 'success'")
            return {'success': False, 'message': 'Error interno: respuesta inválida'}
        
        return resultado
        
    except Exception as e:
        print(f"DEBUG MAIN ERROR: {e}")
        import traceback
        print(f"DEBUG MAIN TRACEBACK: {traceback.format_exc()}")
        return {'success': False, 'message': f'Error: {str(e)}'}

@app.get("/api/planes/mis-planes/{user_id}")
def get_mis_planes(user_id: int):
    """GET /api/planes/mis-planes/1 - Obtener planes del usuario"""
    try:
        planes_conn = PlanesConnection()
        mis_planes = planes_conn.get_planes_usuario(user_id)
        
        return {
            'success': True,
            'planes': mis_planes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error al obtener planes del usuario: {str(e)}')

@app.get("/api/planes/tareas-diarias/{plan_usuario_id}")
def get_tareas_diarias(plan_usuario_id: int):
    """GET /api/planes/tareas-diarias/1 - Obtener tareas diarias del plan"""
    try:
        planes_conn = PlanesConnection()
        tareas = planes_conn.get_tareas_diarias_usuario(plan_usuario_id)
        
        if not tareas:
            raise HTTPException(status_code=404, detail='Plan de usuario no encontrado')
        
        return {
            'success': True,
            'tareas_diarias': tareas
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error al obtener tareas diarias: {str(e)}')

class MarcarTareaRequest(BaseModel):
    plan_usuario_id: int
    tarea_id: int

@app.post("/api/planes/marcar-tarea")
def marcar_tarea_completada(data: MarcarTareaRequest):
    """POST /api/planes/marcar-tarea - Marcar tarea como completada/no completada"""
    try:
        planes_conn = PlanesConnection()
        resultado = planes_conn.marcar_tarea_completada(data.plan_usuario_id, data.tarea_id)
        
        return resultado
        
    except Exception as e:
        return {'success': False, 'message': f'Error al marcar tarea: {str(e)}'}

# ============================================
# ENDPOINTS DE PRUEBA
# ============================================

@app.get("/test")
def test_connection():
    """Probar conexión a la base de datos"""
    try:
        users = conn.read_all()
        return {"status": "OK", "usuarios_count": len(users)}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

@app.get("/api/planes/test/plan-completo")
def test_plan_completo():
    """Endpoint de prueba para ver nuestro plan completo"""
    try:
        planes_conn = PlanesConnection()
        plan = planes_conn.get_plan_completo(1)
        
        return {
            'success': True,
            'plan': plan
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error: {str(e)}')