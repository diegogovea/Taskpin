from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT
from jose import jwt
from .model.userConnection import userConnection
from .schema.userSchema import UserCreateSchema, UserUpdateSchema, LoginData, UserResponseSchema
from fastapi.middleware.cors import CORSMiddleware

#IMPORTACIONES PARA HABITOS

from .model.habitConnection import habitConnection
from .schema.habitSchema import (
    CategoriaHabitoSchema, 
    HabitoPredeterminadoSchema, 
    AddHabitoToUserSchema, 
    AddMultipleHabitosSchema,
    HabitoUsuarioSchema,
    HabitoResponseSchema
)

# Crear conexión para hábitos
habit_conn = habitConnection()

# Crear conexión para hábitos
habit_conn = habitConnection()


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

# ========================================
# FUNCIONES AUXILIARES PARA HÁBITOS
# ========================================

def tuple_to_categoria_dict(data):
    """Convierte tupla de categoría a diccionario"""
    if not data:
        return None
    return {
        "categoria_id": data[0],
        "nombre": data[1],
        "descripcion": data[2],
        "icono": data[3],
        "orden": data[4]
    }

def tuple_to_habito_dict(data):
    """Convierte tupla de hábito a diccionario"""
    if not data:
        return None
    return {
        "habito_id": data[0],
        "categoria_id": data[1],
        "nombre": data[2],
        "descripcion": data[3],
        "frecuencia_recomendada": data[4],
        "puntos_base": data[5],
        "categoria_nombre": data[6] if len(data) > 6 else None
    }

def tuple_to_habito_usuario_dict(data):
    """Convierte tupla de hábito de usuario a diccionario"""
    if not data:
        return None
    return {
        "habito_usuario_id": data[0],
        "user_id": data[1],
        "habito_id": data[2],
        "fecha_agregado": data[3],
        "activo": data[4],
        "frecuencia_personal": data[5],
        "nombre": data[6],
        "descripcion": data[7],
        "puntos_base": data[8],
        "categoria_nombre": data[9]
    }

# ---------------------- ENDPOINTS PRINCIPALES ----------------------

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

# Reemplazar tu endpoint de login actual en main.py

@app.post("/login")
def login(user_data: LoginData):
    """Iniciar sesión y crear sesión en control"""
    # Usar el método authenticate_user que verifica la contraseña hasheada
    user = conn.authenticate_user(user_data.correo, user_data.contraseña)
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Verificar que el usuario esté activo
    if not user[5]:  # user[5] es el campo 'activo'
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    
    # Crear sesión en la tabla control
    control_id = conn.create_session(user[0])  # user[0] es user_id
    
    # Crear token JWT (incluir control_id para identificar sesión)
    token_data = {
        "sub": user[2],      # sub = correo
        "user_id": user[0],  # user_id
        "control_id": control_id  # ID de la sesión
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user_id": user[0],
        "nombre": user[1],
        "control_id": control_id
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

# ---------------------- ENDPOINT DE PRUEBA ----------------------
@app.get("/test")
def test_connection():
    """Probar conexión a la base de datos"""
    try:
        users = conn.read_all()
        return {"status": "OK", "usuarios_count": len(users)}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}
    

# ========================================
# ENDPOINTS PARA HÁBITOS
# ========================================

@app.get("/api/categorias-habitos", status_code=HTTP_200_OK)
def get_categorias_habitos():
    """Obtener todas las categorías de hábitos"""
    try:
        categorias = []
        for data in habit_conn.get_categorias_habitos():
            categoria_dict = tuple_to_categoria_dict(data)
            if categoria_dict:
                categorias.append(categoria_dict)
        return {"success": True, "data": categorias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {str(e)}")

@app.get("/api/habitos/categoria/{categoria_id}", status_code=HTTP_200_OK)
def get_habitos_by_categoria(categoria_id: int):
    """Obtener hábitos predeterminados por categoría"""
    try:
        habitos = []
        for data in habit_conn.get_habitos_by_categoria(categoria_id):
            habito_dict = tuple_to_habito_dict(data)
            if habito_dict:
                habitos.append(habito_dict)
        
        if not habitos:
            raise HTTPException(status_code=404, detail="Categoría no encontrada o sin hábitos")
        
        return {"success": True, "data": habitos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener hábitos: {str(e)}")

@app.get("/api/habitos", status_code=HTTP_200_OK)
def get_all_habitos():
    """Obtener todos los hábitos predeterminados"""
    try:
        habitos = []
        for data in habit_conn.get_all_habitos_predeterminados():
            habito_dict = tuple_to_habito_dict(data)
            if habito_dict:
                habitos.append(habito_dict)
        return {"success": True, "data": habitos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener hábitos: {str(e)}")

@app.get("/api/habito/{habito_id}", status_code=HTTP_200_OK)
def get_habito_by_id(habito_id: int):
    """Obtener un hábito específico por ID"""
    try:
        data = habit_conn.get_habito_by_id(habito_id)
        if not data:
            raise HTTPException(status_code=404, detail="Hábito no encontrado")
        
        habito_dict = tuple_to_habito_dict(data)
        return {"success": True, "data": habito_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener hábito: {str(e)}")

@app.post("/api/usuario/{user_id}/habitos", status_code=HTTP_201_CREATED)
def add_habito_to_user(user_id: int, habito_data: AddHabitoToUserSchema):
    """Agregar un hábito al usuario"""
    try:
        # Verificar que el usuario existe
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que el hábito existe
        habito = habit_conn.get_habito_by_id(habito_data.habito_id)
        if not habito:
            raise HTTPException(status_code=404, detail="Hábito no encontrado")
        
        # Agregar hábito al usuario
        result = habit_conn.add_habito_to_user(
            user_id, 
            habito_data.habito_id, 
            habito_data.frecuencia_personal
        )
        
        if result is None:
            raise HTTPException(status_code=400, detail="El hábito ya está agregado para este usuario")
        
        return {
            "success": True, 
            "message": "Hábito agregado correctamente",
            "data": {"habito_usuario_id": result}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar hábito: {str(e)}")

@app.post("/api/usuario/{user_id}/habitos/multiple", status_code=HTTP_201_CREATED)
def add_multiple_habitos_to_user(user_id: int, habitos_data: AddMultipleHabitosSchema):
    """Agregar múltiples hábitos al usuario"""
    try:
        # Verificar que el usuario existe
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        added_habitos = []
        already_added = []
        errors = []
        
        for habito_id in habitos_data.habito_ids:
            try:
                # Verificar que el hábito existe
                habito = habit_conn.get_habito_by_id(habito_id)
                if not habito:
                    errors.append(f"Hábito {habito_id} no encontrado")
                    continue
                
                # Intentar agregar el hábito
                result = habit_conn.add_habito_to_user(
                    user_id, 
                    habito_id, 
                    habitos_data.frecuencia_personal
                )
                
                if result is None:
                    already_added.append(habito_id)
                else:
                    added_habitos.append({"habito_id": habito_id, "habito_usuario_id": result})
                    
            except Exception as e:
                errors.append(f"Error con hábito {habito_id}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Proceso completado. {len(added_habitos)} hábitos agregados",
            "data": {
                "added_habitos": added_habitos,
                "already_added": already_added,
                "errors": errors
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar hábitos: {str(e)}")

@app.get("/api/usuario/{user_id}/habitos", status_code=HTTP_200_OK)
def get_user_habitos(user_id: int):
    """Obtener todos los hábitos activos de un usuario"""
    try:
        # Verificar que el usuario existe
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        habitos = []
        for data in habit_conn.get_user_habitos(user_id):
            habito_dict = tuple_to_habito_usuario_dict(data)
            if habito_dict:
                habitos.append(habito_dict)
        
        return {"success": True, "data": habitos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener hábitos del usuario: {str(e)}")

@app.delete("/api/usuario/{user_id}/habito/{habito_id}", status_code=HTTP_200_OK)
def remove_habito_from_user(user_id: int, habito_id: int):
    """Remover un hábito del usuario"""
    try:
        # Verificar que el usuario existe
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        success = habit_conn.remove_habito_from_user(user_id, habito_id)
        if not success:
            raise HTTPException(status_code=404, detail="Hábito no encontrado para este usuario")
        
        return {"success": True, "message": "Hábito removido correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al remover hábito: {str(e)}")

# ========================================
# ENDPOINT DE PRUEBA PARA HÁBITOS
# ========================================

@app.get("/test-habitos")
def test_habitos_connection():
    """Probar conexión y datos de hábitos"""
    try:
        categorias = habit_conn.get_categorias_habitos()
        habitos = habit_conn.get_all_habitos_predeterminados()
        return {
            "status": "OK", 
            "categorias_count": len(categorias),
            "habitos_count": len(habitos)
        }
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}


@app.get("/api/current-user", status_code=200)
def get_current_user():
    """Obtener el usuario de la sesión activa más reciente"""
    try:
        with conn.conn.cursor() as cur:
            # Obtener la sesión más reciente (último usuario que hizo login)
            cur.execute("""
                SELECT c.user_id, u.nombre, u.correo, c.last_access, c.id_control
                FROM control c
                INNER JOIN usuarios u ON c.user_id = u.user_id
                WHERE u.activo = true
                ORDER BY c.last_access DESC
                LIMIT 1;
            """)
            
            session_data = cur.fetchone()
            
            if not session_data:
                raise HTTPException(status_code=404, detail="No hay sesión activa")
            
            return {
                "success": True,
                "data": {
                    "user_id": session_data[0],
                    "nombre": session_data[1],
                    "correo": session_data[2],
                    "last_access": session_data[3],
                    "control_id": session_data[4]
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuario actual: {str(e)}")

# ========================================
# ENDPOINTS PARA SEGUIMIENTO DIARIO DE HÁBITOS
# Agregar estos endpoints a tu main.py
# ========================================

@app.get("/api/usuario/{user_id}/habitos/hoy", status_code=HTTP_200_OK)
def get_user_habits_today(user_id: int):
    """Obtener hábitos del usuario con su estado de hoy"""
    try:
        # Verificar que el usuario existe
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        with habit_conn.conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    hu.habito_usuario_id,
                    hu.user_id,
                    hu.habito_id,
                    h.nombre,
                    h.descripcion,
                    h.puntos_base,
                    c.nombre as categoria_nombre,
                    hu.frecuencia_personal,
                    hu.fecha_agregado,
                    COALESCE(sh.completado, false) as completado_hoy,
                    sh.hora_completado,
                    sh.notas
                FROM habitos_usuario hu
                INNER JOIN habitos_predeterminados h ON hu.habito_id = h.habito_id
                INNER JOIN categorias_habitos c ON h.categoria_id = c.categoria_id
                LEFT JOIN seguimiento_habitos sh ON (
                    sh.habito_usuario_id = hu.habito_usuario_id 
                    AND sh.fecha = CURRENT_DATE
                )
                WHERE hu.user_id = %s AND hu.activo = true
                ORDER BY h.categoria_id, h.nombre;
            """, (user_id,))
            
            habits_data = cur.fetchall()
            
            habits = []
            for data in habits_data:
                habit_dict = {
                    "habito_usuario_id": data[0],
                    "user_id": data[1],
                    "habito_id": data[2],
                    "nombre": data[3],
                    "descripcion": data[4],
                    "puntos_base": data[5],
                    "categoria_nombre": data[6],
                    "frecuencia_personal": data[7],
                    "fecha_agregado": data[8],
                    "completado_hoy": data[9],
                    "hora_completado": data[10],
                    "notas": data[11]
                }
                habits.append(habit_dict)
            
            # Calcular estadísticas
            total_habitos = len(habits)
            completados = len([h for h in habits if h["completado_hoy"]])
            pendientes = total_habitos - completados
            
            return {
                "success": True,
                "data": {
                    "habitos": habits,
                    "estadisticas": {
                        "total": total_habitos,
                        "completados": completados,
                        "pendientes": pendientes,
                        "fecha": "today"
                    }
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener hábitos del día: {str(e)}")

@app.post("/api/usuario/{user_id}/habito/{habito_usuario_id}/toggle", status_code=HTTP_200_OK)
def toggle_habit_completion(user_id: int, habito_usuario_id: int):
    """Alternar el completado de un hábito para hoy"""
    try:
        # Verificar que el usuario y hábito existen
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        with habit_conn.conn.cursor() as cur:
            # Verificar que el hábito pertenece al usuario
            cur.execute("""
                SELECT habito_usuario_id FROM habitos_usuario 
                WHERE habito_usuario_id = %s AND user_id = %s AND activo = true;
            """, (habito_usuario_id, user_id))
            
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Hábito no encontrado para este usuario")
            
            # Verificar si ya existe un registro para hoy
            cur.execute("""
                SELECT seguimiento_id, completado FROM seguimiento_habitos
                WHERE habito_usuario_id = %s AND fecha = CURRENT_DATE;
            """, (habito_usuario_id,))
            
            existing_record = cur.fetchone()
            
            if existing_record:
                # Ya existe, alternar el estado
                new_status = not existing_record[1]
                hora_completado = "CURRENT_TIME" if new_status else "NULL"
                
                cur.execute(f"""
                    UPDATE seguimiento_habitos 
                    SET completado = %s, 
                        hora_completado = {hora_completado}
                    WHERE seguimiento_id = %s;
                """, (new_status, existing_record[0]))
                
            else:
                # No existe, crear nuevo registro como completado
                cur.execute("""
                    INSERT INTO seguimiento_habitos (habito_usuario_id, fecha, completado, hora_completado)
                    VALUES (%s, CURRENT_DATE, true, CURRENT_TIME);
                """, (habito_usuario_id,))
                new_status = True
            
            habit_conn.conn.commit()
            
            return {
                "success": True,
                "message": "Hábito actualizado correctamente",
                "data": {
                    "habito_usuario_id": habito_usuario_id,
                    "completado": new_status,
                    "fecha": "today"
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar hábito: {str(e)}")

@app.get("/api/usuario/{user_id}/estadisticas-habitos", status_code=HTTP_200_OK)
def get_user_habits_stats(user_id: int):
    """Obtener estadísticas de hábitos del usuario"""
    try:
        existing_user = conn.read_one(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        with habit_conn.conn.cursor() as cur:
            # Estadísticas de hoy
            cur.execute("""
                SELECT 
                    COUNT(*) as total_habitos,
                    COUNT(CASE WHEN sh.completado = true THEN 1 END) as completados_hoy,
                    COUNT(CASE WHEN sh.completado = false OR sh.completado IS NULL THEN 1 END) as pendientes_hoy
                FROM habitos_usuario hu
                LEFT JOIN seguimiento_habitos sh ON (
                    sh.habito_usuario_id = hu.habito_usuario_id 
                    AND sh.fecha = CURRENT_DATE
                )
                WHERE hu.user_id = %s AND hu.activo = true;
            """, (user_id,))
            
            stats_today = cur.fetchone()
            
            return {
                "success": True,
                "data": {
                    "fecha": "today",
                    "total_habitos": stats_today[0] if stats_today[0] else 0,
                    "completados": stats_today[1] if stats_today[1] else 0,
                    "pendientes": stats_today[2] if stats_today[2] else 0
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")