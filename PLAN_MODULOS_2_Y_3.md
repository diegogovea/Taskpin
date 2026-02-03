# Plan de Implementación: Módulos 2 y 3 - Taskpin

## Contexto del Proyecto

**Taskpin** es una aplicación de seguimiento de hábitos y planes de vida.
- **Backend**: FastAPI + PostgreSQL (Python)
- **Frontend**: Expo / React Native (TypeScript)
- **Base de datos**: PostgreSQL con 15+ tablas

Este documento contiene el plan para implementar los requisitos de:
- **Módulo 2**: Sistemas Inteligentes (IA/ML)
- **Módulo 3**: Sistemas Distribuidos

---

## Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA TASKPIN v2.0                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     WebSocket      ┌──────────────────────────────────────┐  │
│  │   App Móvil  │◄──────────────────►│                                      │  │
│  └──────────────┘                    │         FastAPI Backend              │  │
│                                      │    ┌─────────────────────────┐       │  │
│  ┌──────────────┐     WebSocket      │    │   WebSocket Manager     │       │  │
│  │   App Web    │◄──────────────────►│    │   (Sincronización)      │       │  │
│  └──────────────┘                    │    └─────────────────────────┘       │  │
│                                      │                                      │  │
│                                      │    ┌─────────────────────────┐       │  │
│                                      │    │   Motor de IA           │       │  │
│                                      │    │   - Recomendaciones     │       │  │
│                                      │    │   - Predicciones        │       │  │
│                                      │    │   - Análisis Patrones   │       │  │
│                                      │    └─────────────────────────┘       │  │
│                                      └──────────────────────────────────────┘  │
│                                                    │                           │
│                           ┌────────────────────────┼────────────────────────┐  │
│                           │                        │                        │  │
│                           ▼                        ▼                        ▼  │
│                    ┌─────────────┐          ┌─────────────┐          ┌───────┐│
│                    │ PostgreSQL  │          │    Redis    │          │Celery ││
│                    │   (Datos)   │          │(Cache/PubSub)│         │Workers││
│                    └─────────────┘          └─────────────┘          └───────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# MÓDULO 2: Sistema de Inteligencia Artificial

## Funcionalidades de IA a Implementar

| # | Funcionalidad | Algoritmo | Modelo Matemático |
|---|---------------|-----------|-------------------|
| 1 | Recomendación de Hábitos | Filtrado Colaborativo + Contenido (Híbrido) | Similitud coseno + TF-IDF |
| 2 | Predicción de Completado | Random Forest Classifier | Ensemble de árboles de decisión |
| 3 | Detección de Mejor Horario | Análisis de Series Temporales | K-Means Clustering |
| 4 | Análisis de Estado de Ánimo | Clasificación de Texto (NLP) | Naive Bayes / Bag of Words |

---

## Componente 1: Sistema de Recomendación Híbrido

### Objetivo
Recomendar hábitos nuevos al usuario basándose en usuarios similares y características de hábitos.

### Modelo Matemático - Similitud Coseno

```
                    Σᵢ (Aᵢ × Bᵢ)
sim(A, B) = ────────────────────────────
            √(Σᵢ Aᵢ²) × √(Σᵢ Bᵢ²)

Donde:
- A = vector de hábitos del usuario actual [1,0,1,1,0,...]
- B = vector de hábitos de otro usuario
- sim ∈ [0, 1] donde 1 = idénticos
```

### Datos SQL Necesarios

```sql
-- Matriz Usuario-Hábito
SELECT user_id, habito_id, 
       CASE WHEN activo THEN 1 ELSE 0 END as tiene_habito
FROM habitos_usuario;

-- Tasa de éxito por hábito por usuario
SELECT hu.user_id, hu.habito_id,
       COUNT(CASE WHEN sh.completado THEN 1 END)::float / 
       NULLIF(COUNT(*), 0) as tasa_exito
FROM habitos_usuario hu
LEFT JOIN seguimiento_habitos sh ON hu.habito_usuario_id = sh.habito_usuario_id
GROUP BY hu.user_id, hu.habito_id;
```

---

## Componente 2: Predicción de Completado de Hábitos

### Objetivo
Predecir la probabilidad de que el usuario complete un hábito hoy.

### Modelo Matemático - Random Forest (Gini Impurity)

```
Predicción final = Modo(árbol₁, árbol₂, ..., árbolₙ)

Cada árbol usa Gini Impurity:
Gini(S) = 1 - Σᵢ pᵢ²

Donde pᵢ = proporción de clase i en el nodo S
```

### Features a Extraer

```python
features = {
    'dia_semana': 0-6,              # Lunes=0, Domingo=6
    'hora_actual': 0-23,            # Hora del día
    'racha_actual': int,            # Días consecutivos completando
    'tasa_exito_7_dias': float,     # % completado últimos 7 días
    'tasa_exito_30_dias': float,    # % completado últimos 30 días
    'completado_ayer': 0/1,         # ¿Lo completó ayer?
    'promedio_hora_completado': float,  # Hora promedio cuando lo completa
    'dificultad_habito': 1-3,       # Fácil/Medio/Difícil
    'dias_desde_agregado': int,     # Antigüedad del hábito
    'total_habitos_usuario': int,   # Cantidad de hábitos activos
}
```

---

## Componente 3: Detección de Mejor Horario

### Objetivo
Identificar a qué hora el usuario tiene más probabilidad de completar cada hábito.

### Modelo Matemático - K-Means Clustering

```
Minimizar: J = Σᵢ Σⱼ ||xⱼ - μᵢ||²

Donde:
- xⱼ = hora de completado de instancia j
- μᵢ = centroide del cluster i
- Se buscan K clusters de horarios óptimos
```

### Query de Datos

```sql
SELECT 
    hu.habito_id,
    EXTRACT(HOUR FROM sh.hora_completado) as hora,
    EXTRACT(DOW FROM sh.fecha) as dia_semana,
    COUNT(*) as frecuencia
FROM seguimiento_habitos sh
JOIN habitos_usuario hu ON sh.habito_usuario_id = hu.habito_usuario_id
WHERE sh.completado = true
GROUP BY hu.habito_id, hora, dia_semana;
```

---

## Componente 4: Análisis de Sentimientos

### Objetivo
Clasificar el estado de ánimo basado en el texto de las reflexiones diarias.

### Modelo Matemático - Naive Bayes

```
P(clase|texto) = P(clase) × Πᵢ P(palabraᵢ|clase) / P(texto)

Clasificación = argmax P(clase|texto)
                clase

Clases: {muy_positivo, positivo, neutro, negativo, muy_negativo}
```

### Datos de Reflexiones

```sql
SELECT 
    user_id,
    estado_animo,           -- Ya existe (1-5)
    que_salio_bien,         -- Texto a analizar
    que_mejorar,            -- Texto a analizar
    fecha
FROM reflexiones_diarias;
```

---

## Estructura de Archivos - Módulo 2

```
Backend/
├── app/
│   ├── ai/                              # NUEVO - Motor de IA
│   │   ├── __init__.py
│   │   ├── recommender.py               # Sistema de recomendación híbrido
│   │   ├── predictor.py                 # Predicción de completado
│   │   ├── time_analyzer.py             # Análisis de horarios óptimos
│   │   ├── sentiment_analyzer.py        # Análisis de sentimientos
│   │   ├── feature_extractor.py         # Extracción de características
│   │   └── models/                      # Modelos entrenados (.pkl)
│   │       ├── recommender_model.pkl
│   │       ├── predictor_model.pkl
│   │       └── sentiment_model.pkl
│   ├── model/
│   │   └── aiConnection.py              # Queries para datos de IA
│   └── main.py                          # Nuevos endpoints de IA
```

---

## Endpoints de IA a Crear

```python
# 1. Obtener recomendaciones de hábitos
GET /api/ai/usuario/{user_id}/recomendaciones
Response: {
    "success": true,
    "recomendaciones": [
        {
            "habito_id": 15,
            "nombre": "Meditar 5 minutos",
            "score": 0.87,
            "razon": "Usuarios similares a ti tienen éxito con este hábito"
        }
    ]
}

# 2. Obtener predicción de completado para hoy
GET /api/ai/usuario/{user_id}/predicciones/hoy
Response: {
    "success": true,
    "predicciones": [
        {
            "habito_usuario_id": 23,
            "nombre": "Tomar agua",
            "probabilidad_completado": 0.92,
            "mejor_hora_sugerida": "08:30",
            "factores": ["racha de 5 días", "alta tasa reciente"]
        }
    ]
}

# 3. Obtener análisis de patrones
GET /api/ai/usuario/{user_id}/patrones
Response: {
    "success": true,
    "patrones": {
        "mejor_dia": "Martes",
        "peor_dia": "Domingo",
        "hora_mas_productiva": "09:00-11:00",
        "racha_promedio": 4.2,
        "tendencia_estado_animo": "mejorando"
    }
}

# 4. Obtener insights de reflexiones
GET /api/ai/usuario/{user_id}/insights/reflexiones
Response: {
    "success": true,
    "insights": {
        "sentimiento_promedio": "positivo",
        "temas_frecuentes_positivos": ["ejercicio", "productividad"],
        "temas_frecuentes_negativos": ["sueño", "estrés"],
        "correlacion_habitos_animo": [
            {"habito": "Meditar", "impacto_positivo": 0.73}
        ]
    }
}
```

---

# MÓDULO 3: Sistema Distribuido

## Componentes Distribuidos a Implementar

| # | Componente | Criterio que Cubre | Descripción |
|---|------------|-------------------|-------------|
| 1 | WebSocket Server | 3.1.6, 3.3 | Sincronización en tiempo real entre dispositivos |
| 2 | Redis Pub/Sub | 3.1.1, 3.2 | Comunicación entre múltiples instancias del backend |
| 3 | Celery Workers | 3.1.4 | Procesamiento distribuido de tareas de IA |
| 4 | Multi-instancia | 3.1.5 | Tolerancia a fallos con múltiples backends |

---

## Flujo de WebSocket

```
Usuario completa hábito en CELULAR
        │
        ▼
┌─────────────────┐    POST /toggle    ┌──────────────────┐
│   App Celular   │ ──────────────────►│    FastAPI       │
└─────────────────┘                    │                  │
                                       │  1. Guarda en DB │
                                       │  2. Publica en   │
                                       │     Redis        │
                                       └────────┬─────────┘
                                                │
                                  ┌─────────────▼───────────┐
                                  │        Redis            │
                                  │   Canal: user:{id}      │
                                  └─────────────┬───────────┘
                                                │
        ┌───────────────────────────────────────┤
        │                                       │
        ▼                                       ▼
┌─────────────────┐                    ┌─────────────────┐
│  WebSocket a    │                    │  WebSocket a    │
│  App Celular    │                    │  App Web        │
│  (confirma)     │                    │  (actualiza UI) │
└─────────────────┘                    └─────────────────┘
```

---

## Protocolo de Comunicación WebSocket

### Conexión
```
URL: wss://api.taskpin.com/ws/{user_id}
Headers: Authorization: Bearer {jwt_token}
```

### Mensajes Cliente → Servidor

```json
// SUBSCRIBE - Suscribirse a eventos
{
    "type": "subscribe",
    "channels": ["habits", "plans", "notifications"]
}

// PING - Mantener conexión viva
{
    "type": "ping",
    "timestamp": 1706990400
}
```

### Mensajes Servidor → Cliente

```json
// HABIT_UPDATED - Hábito actualizado
{
    "type": "habit_updated",
    "data": {
        "habito_usuario_id": 23,
        "completado": true,
        "timestamp": "2026-02-03T14:30:00Z",
        "source_device": "mobile"
    }
}

// PLAN_PROGRESS - Progreso de plan actualizado
{
    "type": "plan_progress",
    "data": {
        "plan_usuario_id": 5,
        "progreso_porcentaje": 45,
        "fase_actual": 2
    }
}

// AI_NOTIFICATION - Notificación del sistema de IA
{
    "type": "ai_notification",
    "data": {
        "tipo": "recordatorio_inteligente",
        "mensaje": "Es tu mejor hora para 'Meditar'. ¡Tienes 85% de probabilidad de completarlo ahora!",
        "habito_id": 15
    }
}

// PONG - Respuesta a ping
{
    "type": "pong",
    "timestamp": 1706990400
}
```

### Códigos de Error
- `4001` - Token inválido
- `4002` - Usuario no encontrado
- `4003` - Canal no válido
- `4004` - Rate limit excedido

---

## Estructura de Archivos - Módulo 3

```
Backend/
├── app/
│   ├── websocket/                       # NUEVO - WebSocket
│   │   ├── __init__.py
│   │   ├── manager.py                   # Gestión de conexiones WS
│   │   ├── handlers.py                  # Manejadores de mensajes
│   │   └── protocol.py                  # Definición del protocolo
│   ├── distributed/                     # NUEVO - Componentes distribuidos
│   │   ├── __init__.py
│   │   ├── redis_client.py              # Cliente Redis
│   │   ├── pubsub.py                    # Pub/Sub para sincronización
│   │   └── tasks.py                     # Definición de tareas Celery
│   ├── celery_app.py                    # NUEVO - Configuración Celery
│   └── main.py                          # Agregar rutas WebSocket
├── workers/                             # NUEVO - Workers distribuidos
│   ├── __init__.py
│   ├── ai_worker.py                     # Worker para tareas de IA
│   └── notification_worker.py           # Worker para notificaciones
├── docker-compose.yml                   # NUEVO - Orquestación
└── requirements.txt                     # Agregar dependencias
```

---

## Arquitectura de Deployment

```
                         ┌─────────────────┐
                         │  Load Balancer  │
                         │   (nginx)       │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
     ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
     │   FastAPI #1    │ │   FastAPI #2    │ │   FastAPI #3    │
     │   + WebSocket   │ │   + WebSocket   │ │   + WebSocket   │
     └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
           ┌─────────────────┐        ┌─────────────────┐
           │      Redis      │        │   PostgreSQL    │
           │  (Cache/PubSub) │        │    (Primary)    │
           └─────────────────┘        └─────────────────┘
                    │
                    ▼
     ┌──────────────────────────────────────────────────┐
     │              Celery Workers                       │
     │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
     │  │Worker 1 │  │Worker 2 │  │Worker 3 │          │
     │  │  (IA)   │  │  (IA)   │  │(Notif.) │          │
     │  └─────────┘  └─────────┘  └─────────┘          │
     └──────────────────────────────────────────────────┘
```

### Opciones de Hosting
- **Railway.app** (más fácil, ~$5-20/mes)
- **DigitalOcean App Platform** (~$12-25/mes)
- **Render.com** (tier gratis disponible)
- **AWS ECS/Fargate** (~$20-50/mes)

---

# PLAN DE IMPLEMENTACIÓN - CHECKLIST

## Fase 0: Preparación (1-2 días)

- [ ] **0.1** Instalar dependencias nuevas (redis, celery, websockets, scikit-learn, numpy, pandas)
- [ ] **0.2** Configurar Redis localmente (`brew install redis` en Mac, luego `redis-server`)
- [ ] **0.3** Crear estructura de carpetas:
  - `Backend/app/ai/`
  - `Backend/app/websocket/`
  - `Backend/app/distributed/`
  - `Backend/workers/`
- [ ] **0.4** Crear archivo `Backend/app/config_distributed.py` con configuración de Redis y Celery

---

## Fase 1: Módulo 2 - Sistema de IA (5-7 días)

### Día 1: Extractor de Características
- [ ] **1.1** Crear `Backend/app/ai/__init__.py`
- [ ] **1.2** Crear `Backend/app/ai/feature_extractor.py`:
  - Función `extraer_features_usuario(user_id)` - obtiene datos del usuario
  - Función `extraer_features_habito(habito_usuario_id)` - obtiene datos del hábito
  - Función `construir_matriz_usuarios_habitos()` - matriz para colaborativo

### Días 2-3: Sistema de Recomendación
- [ ] **1.3** Crear `Backend/app/ai/recommender.py`:
  - Función `calcular_similitud_coseno(usuario_a, usuario_b)`
  - Función `encontrar_usuarios_similares(user_id, top_n=10)`
  - Función `generar_recomendaciones(user_id, limit=5)`
  - Clase `HabitRecommender` con métodos fit() y predict()
- [ ] **1.4** Crear endpoint `GET /api/ai/usuario/{user_id}/recomendaciones` en `main.py`
- [ ] **1.5** Documentar modelo matemático (similitud coseno) en comentarios

### Días 3-4: Predictor de Completado
- [ ] **1.6** Crear `Backend/app/ai/predictor.py`:
  - Función `preparar_datos_entrenamiento()` - construye dataset
  - Función `entrenar_modelo()` - entrena Random Forest
  - Función `predecir_completado(user_id, habito_usuario_id)` - predicción
  - Clase `HabitPredictor` con métodos fit(), predict(), save(), load()
- [ ] **1.7** Crear endpoint `GET /api/ai/usuario/{user_id}/predicciones/hoy`
- [ ] **1.8** Documentar modelo matemático (Gini Impurity) en comentarios

### Día 5: Analizador de Horarios
- [ ] **1.9** Crear `Backend/app/ai/time_analyzer.py`:
  - Función `obtener_historial_completados(user_id)`
  - Función `clustering_horarios(datos, n_clusters=3)` - K-Means
  - Función `identificar_mejor_horario(user_id, habito_id)`
  - Función `analizar_patrones_semanales(user_id)`
- [ ] **1.10** Crear endpoint `GET /api/ai/usuario/{user_id}/patrones`
- [ ] **1.11** Documentar modelo matemático (K-Means) en comentarios

### Días 5-6: Analizador de Sentimientos
- [ ] **1.12** Crear `Backend/app/ai/sentiment_analyzer.py`:
  - Función `preprocesar_texto(texto)` - limpieza de texto
  - Función `entrenar_clasificador()` - Naive Bayes
  - Función `clasificar_sentimiento(texto)` - retorna clase y probabilidad
  - Función `analizar_reflexiones_usuario(user_id)`
- [ ] **1.13** Crear endpoint `GET /api/ai/usuario/{user_id}/insights/reflexiones`
- [ ] **1.14** Documentar modelo matemático (Naive Bayes) en comentarios

### Día 7: Integración
- [ ] **1.15** Crear `Backend/app/model/aiConnection.py` con queries específicas para IA
- [ ] **1.16** Crear carpeta `Backend/app/ai/models/` para guardar modelos .pkl
- [ ] **1.17** Crear script `Backend/scripts/train_models.py` para entrenamiento inicial
- [ ] **1.18** Probar todos los endpoints de IA con datos reales
- [ ] **1.19** Agregar manejo de errores cuando no hay suficientes datos

---

## Fase 2: Módulo 3 - Sistema Distribuido (5-7 días)

### Día 1: Configurar Redis
- [ ] **2.1** Crear `Backend/app/distributed/__init__.py`
- [ ] **2.2** Crear `Backend/app/distributed/redis_client.py`:
  - Función `get_redis_client()` - singleton de conexión
  - Función `cache_set(key, value, ttl)`
  - Función `cache_get(key)`
  - Función `publish(channel, message)`
  - Función `subscribe(channel)`
- [ ] **2.3** Agregar configuración de Redis en `config.py`:
  - `REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")`

### Días 2-3: WebSocket Manager
- [ ] **2.4** Crear `Backend/app/websocket/__init__.py`
- [ ] **2.5** Crear `Backend/app/websocket/manager.py`:
  - Clase `ConnectionManager`:
    - `active_connections: Dict[int, List[WebSocket]]` (user_id → conexiones)
    - `async connect(websocket, user_id)`
    - `disconnect(websocket, user_id)`
    - `async broadcast_to_user(user_id, message)`
    - `async broadcast_to_all(message)`
- [ ] **2.6** Crear `Backend/app/websocket/handlers.py`:
  - Función `handle_subscribe(websocket, data)`
  - Función `handle_ping(websocket)`
  - Función `handle_message(websocket, message_type, data)`
- [ ] **2.7** Crear `Backend/app/websocket/protocol.py`:
  - Constantes de tipos de mensaje
  - Funciones para crear mensajes estándar
- [ ] **2.8** Agregar ruta WebSocket en `main.py`:
  ```python
  @app.websocket("/ws/{user_id}")
  async def websocket_endpoint(websocket: WebSocket, user_id: int):
      ...
  ```

### Días 3-4: Pub/Sub entre Instancias
- [ ] **2.9** Crear `Backend/app/distributed/pubsub.py`:
  - Función `publicar_evento_habito(user_id, habito_data)`
  - Función `publicar_evento_plan(user_id, plan_data)`
  - Función `iniciar_listener_redis()` - escucha eventos y los envía por WebSocket
- [ ] **2.10** Modificar `toggle_habit_completion` en `main.py`:
  - Después de guardar en DB, publicar evento en Redis
- [ ] **2.11** Modificar `marcar_tarea_completada` en `main.py`:
  - Después de guardar en DB, publicar evento en Redis

### Días 4-5: Celery Workers
- [ ] **2.12** Crear `Backend/celery_app.py`:
  - Configuración de Celery con Redis como broker
  - `app = Celery('taskpin', broker=REDIS_URL)`
- [ ] **2.13** Crear `Backend/workers/__init__.py`
- [ ] **2.14** Crear `Backend/workers/ai_worker.py`:
  - Tarea `@celery.task reentrenar_modelos()`
  - Tarea `@celery.task calcular_recomendaciones_batch(user_ids)`
  - Tarea `@celery.task generar_insights_diarios(user_id)`
- [ ] **2.15** Crear `Backend/workers/notification_worker.py`:
  - Tarea `@celery.task enviar_recordatorio_inteligente(user_id, habito_id)`
  - Tarea `@celery.task programar_notificaciones_dia()`

### Día 5: Integrar IA con Sistema Distribuido
- [ ] **2.16** Cuando se completa un hábito:
  1. Guardar en DB (ya existe)
  2. Publicar en Redis para otros dispositivos
  3. Encolar tarea de actualización de predicciones
- [ ] **2.17** Crear tarea programada para recalcular modelos de IA cada noche

### Día 6: Documentación
- [ ] **2.18** Crear `docs/PROTOCOLO_WEBSOCKET.md` con documentación completa del protocolo
- [ ] **2.19** Documentar justificación de WebSocket vs polling (criterio 3.4)
- [ ] **2.20** Documentar arquitectura distribuida

### Día 7: Pruebas
- [ ] **2.21** Probar sincronización entre 2 dispositivos (móvil + web)
- [ ] **2.22** Probar que workers procesan tareas correctamente
- [ ] **2.23** Probar reconexión automática de WebSocket
- [ ] **2.24** Probar que múltiples instancias del backend se sincronizan via Redis

---

## Fase 3: Deployment (2-3 días)

### Día 1: Dockerizar
- [ ] **3.1** Crear `Backend/Dockerfile`:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- [ ] **3.2** Crear `Backend/Dockerfile.worker`:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info"]
  ```
- [ ] **3.3** Crear `docker-compose.yml` con servicios:
  - `api` (2 instancias)
  - `worker` (2 instancias)
  - `redis`
  - `postgres`
  - `nginx` (load balancer)

### Día 2: Configurar Hosting
- [ ] **3.4** Crear cuenta en Railway/Render
- [ ] **3.5** Configurar variables de entorno:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET_KEY`
- [ ] **3.6** Deployar servicios:
  - 2 instancias de API
  - 2 workers de Celery
  - 1 Redis
  - 1 PostgreSQL
- [ ] **3.7** Configurar dominio personalizado
- [ ] **3.8** Habilitar HTTPS/WSS

### Día 3: Pruebas en Producción
- [ ] **3.9** Verificar WebSocket funciona con `wss://`
- [ ] **3.10** Verificar sincronización entre dispositivos en producción
- [ ] **3.11** Verificar que workers están procesando
- [ ] **3.12** Configurar monitoreo de logs

---

# DEPENDENCIAS A AGREGAR

```txt
# Agregar a requirements.txt

# IA / Machine Learning
scikit-learn==1.4.0
numpy==1.26.3
pandas==2.1.4
joblib==1.3.2

# Sistema Distribuido
redis==5.0.1
celery==5.3.6
websockets==12.0

# Utilidades
httpx==0.26.0
```

---

# COMANDOS DE DESARROLLO

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: FastAPI Backend
cd Backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Celery Worker
cd Backend
source .venv/bin/activate
celery -A celery_app worker --loglevel=info

# Terminal 4: Frontend
cd Frontend/MATH.M1M
npx expo start
```

---

# CRITERIOS CUBIERTOS

## Módulo 2 ✅
| Criterio | Cómo se cubre |
|----------|---------------|
| 2.1.2 Machine Learning | Random Forest, K-Means, Naive Bayes |
| 2.1.9 Árboles de decisión | Random Forest (ensemble de árboles) |
| 2.2 Modelo matemático | Similitud coseno, Gini Impurity, K-Means, Naive Bayes |
| 2.3 Justificación | Cada algoritmo tiene justificación documentada |

## Módulo 3 ✅
| Criterio | Cómo se cubre |
|----------|---------------|
| 3.1.1 Concurrencia | Celery workers procesando en paralelo |
| 3.1.4 Procesamiento distribuido | Workers de IA distribuidos |
| 3.1.6 Tiempo real con sockets | WebSocket para sincronización |
| 3.2 Algoritmo cliente-servidor | Protocolo WebSocket propio diseñado |
| 3.3 Comunicación entre dispositivos | Móvil ↔ Backend ↔ Web sincronizados |
| 3.4 Justificación protocolos | Documento de protocolo WebSocket |

---

# NOTAS PARA EL AGENTE DE IA

1. **Antes de implementar**: Leer los archivos existentes del proyecto para entender la estructura actual
2. **Base de datos**: Las tablas ya existen (`habitos_usuario`, `seguimiento_habitos`, `reflexiones_diarias`, etc.)
3. **Autenticación**: Ya existe sistema JWT, usar `verify_token` como dependencia en endpoints protegidos
4. **Estilo de código**: Seguir el patrón existente en `main.py` y archivos de conexión
5. **Orden de implementación**: Fase 0 → Fase 1 → Fase 2 → Fase 3 (secuencial)
6. **Probar frecuentemente**: Después de cada componente, verificar que funciona antes de continuar
