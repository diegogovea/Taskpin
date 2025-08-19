from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT
from passlib.context import CryptContext
from jose import jwt
from .model.userConnection import userConnection
from .schema.userSchema import UserSchema, UserCreateSchema, UserUpdateSchema, LoginData, UserResponseSchema
from fastapi.middleware.cors import CORSMiddleware

SECRET_KEY = "mi_clave_secreta"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
conn = userConnection()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O pon la IP de tu app, ej: ["http://localhost:8081"]
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (incluye OPTIONS)
    allow_headers=["*"],  # Permite todos los encabezados
)

# Función auxiliar para convertir tupla de DB a diccionario
def tuple_to_user_dict(data):
    if not data:
        return None
    return {
        "id": data[0],
        "nombre_completo": data[1],
        "correo_electronico": data[2],
        "usuario": data[3],
        "contraseña": data[4],  # Solo para uso interno
        "fecha_nacimiento": data[5],
        "edad": data[6],
        "puntos_totales": data[7],
        "fecha_registro": data[8],
        "ultimo_acceso": data[9],
        "activo": data[10]
    }

# Función auxiliar para respuesta sin contraseña
def user_response(data):
    user_dict = tuple_to_user_dict(data)
    if user_dict:
        user_dict.pop("contraseña", None)  # Elimina contraseña de la respuesta
    return user_dict

# ---------------------- CRUD ----------------------
@app.get("/", status_code=HTTP_200_OK)
def root():
    items = []
    for data in conn.read_all():
        user_dict = user_response(data)
        if user_dict:
            items.append(user_dict)
    return items

@app.get("/api/usuario/{id}", status_code=HTTP_200_OK)
def get_one(id: str):
    data = conn.read_one(id)
    if not data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user_response(data)

@app.post("/api/insert", status_code=HTTP_201_CREATED)
def insert(user_data: UserCreateSchema):
    data = user_data.dict()
    # Agregar valores por defecto
    data["puntos_totales"] = 0
    data["activo"] = True
    conn.write(data)
    return Response(status_code=HTTP_201_CREATED)

@app.put("/api/update/{id}", status_code=HTTP_204_NO_CONTENT)
def update(user_data: UserUpdateSchema, id: str):
    # Verificar que el usuario existe
    existing_user = conn.read_one(id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    data = user_data.dict(exclude_unset=True)  # Solo campos que se envían
    data["id"] = id
    conn.update(data)
    return Response(status_code=HTTP_204_NO_CONTENT)

@app.delete("/api/deleteUsuario/{id}", status_code=HTTP_204_NO_CONTENT)
def delete(id: str):
    # Verificar que el usuario existe
    existing_user = conn.read_one(id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    conn.delete(id)
    return Response(status_code=HTTP_204_NO_CONTENT)

# ---------------------- AUTH ----------------------
@app.post("/register", status_code=HTTP_201_CREATED)
def register(user_data: UserCreateSchema):
    # Verificar si el correo ya existe
    existing_user = conn.read_by_email(user_data.correo_electronico)
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    data = user_data.dict()
    # NO hasheamos la contraseña - guardamos en texto plano como el sistema original
    data["puntos_totales"] = 0
    data["activo"] = True
    
    conn.write(data)
    return {"message": "Usuario registrado correctamente"}

@app.post("/login")
def login(user_data: LoginData):
    users = conn.read_all()
    user = next((u for u in users if u[2] == user_data.correo_electronico), None)
    if not user or user_data.contraseña != user[4]:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = jwt.encode({"sub": user[2]}, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "username": user[3]  # Solo el username que necesitas
    }

# ---------------------- ENDPOINTS ADICIONALES ----------------------
@app.put("/api/usuario/{id}/puntos", status_code=HTTP_200_OK)
def update_points(id: str, puntos: int):
    """Actualizar puntos del usuario"""
    existing_user = conn.read_one(id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    conn.update_points(id, puntos)
    return {"message": f"Se agregaron {puntos} puntos al usuario"}

@app.put("/api/usuario/{id}/activar", status_code=HTTP_200_OK)
def toggle_user_status(id: str):
    """Activar/desactivar usuario"""
    existing_user = conn.read_one(id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_status = not existing_user[10]  # Cambiar estado activo
    data = {"id": id, "activo": new_status}
    conn.update(data)
    
    status_text = "activado" if new_status else "desactivado"
    return {"message": f"Usuario {status_text} correctamente"}