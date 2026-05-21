# Guía de exposición — Taskpin mapeado a los 3 módulos

**Taskpin** es una aplicación de seguimiento de hábitos, planes de vida, gamificación (puntos, rachas, niveles) e **inteligencia artificial** (recomendaciones y predicciones). Esta guía conecta cada criterio académico con lo que está implementado en el código, en lenguaje claro para el equipo y para la audiencia.

---

## Vista general del proyecto (para abrir la exposición)

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND — App móvil/web (React Native + Expo)             │
│  Pantallas: Inicio · Hábitos · Planes · IA · Perfil          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS (REST) + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND — API (Python + FastAPI)                           │
│  Auth JWT · CRUD · IA · Tiempo real                         │
└──────┬────────────────────┬────────────────────┬────────────┘
       ▼                    ▼                    ▼
  PostgreSQL            Redis (caché)      Celery + Redis
  (datos permanentes)   (respuestas IA)   (IA en segundo plano)
```

### Secciones funcionales del producto

| Sección | Qué hace | Archivos clave |
|--------|----------|----------------|
| **Autenticación** | Registro, login, sesión JWT | `Frontend/MATH.M1M/app/login.tsx`, `contexts/AuthContext.tsx` |
| **Inicio (Home)** | Hábitos del día, marcar completados, notificaciones en vivo | `app/(tabs)/home.tsx`, `hooks/useWebSocket.ts` |
| **Hábitos** | Catálogo, hábitos personalizados, calendario | `app/(tabs)/habitos.tsx`, `Backend/app/model/habitConnection.py` |
| **Planes** | Planes predeterminados y personalizados, tareas, fases | `app/(tabs)/planes.tsx`, `Backend/app/model/planesConnection.py` |
| **IA** | Recomendaciones y probabilidad de completar hoy | `app/(tabs)/ai.tsx`, `Backend/app/ai/recommender.py`, `predictor.py` |
| **Perfil / estadísticas** | Puntos, nivel, rachas | `app/(tabs)/perfil.tsx`, `Backend/app/model/estadisticasConnection.py` |
| **Reflexiones** | Diario con estado de ánimo | `Backend/app/model/reflexionesConnection.py` |

---

# MÓDULO 1 — Arquitectura y Programación de Sistemas

## ☐ 1.1 Decidir el uso de los lenguajes de programación

**Qué cubre en Taskpin:** la elección de **Python** en backend y **TypeScript/JavaScript** en frontend, cada uno por razones técnicas concretas.

| Lenguaje | Dónde | Por qué lo eligieron |
|----------|-------|----------------------|
| **Python 3.11** | `Backend/` | Ecosistema ML (`scikit-learn`, `numpy`), API async con FastAPI, despliegue en Docker/Render |
| **TypeScript** | `Frontend/MATH.M1M/` | Tipado en pantallas complejas, menos errores en la app |
| **SQL** | `taskpin.sql`, `Backend/migrations/` | PostgreSQL como fuente de verdad relacional |
| **JSON** | REST, WebSocket, Celery | Formato universal cliente–servidor |

**Cómo explicarlo en 30 segundos:**

> *"Usamos Python en el servidor porque ahí vive el machine learning y la API. Usamos TypeScript en la app porque Expo/React Native nos da una sola base de código para iOS, Android y web. SQL modela los datos de forma estructurada."*

**Evidencia:** `README.md`, `Backend/requirements.txt`, `Frontend/MATH.M1M/package.json`

---

## ☐ 1.2 Emplear Bases de Datos y/o Estructuras de Datos

**Qué cubre en Taskpin:** PostgreSQL + Redis + estructuras en memoria para IA.

### Base de datos relacional (PostgreSQL)

Tablas principales en `taskpin.sql`:

- **Usuarios:** `usuarios`, `registros`
- **Hábitos:** `habitos_usuario`, `seguimiento_habitos` (un registro por día: completado sí/no)
- **Planes:** `planes_usuario`, `tareas_usuario`, `progreso_planes`
- **Gamificación:** `estadisticas_usuario` (migración `001`)
- **Reflexiones:** `reflexiones_diarias` (migración `008`)

**Pool de conexiones:** 2–10 conexiones compartidas en `Backend/app/database.py`.

### Redis (estructura clave-valor + TTL)

- Caché de predicciones (30 min)
- Caché de recomendaciones (60 min)
- Broker de Celery (cola de tareas, Redis `db=2`)

### Estructuras de datos en código

| Estructura | Uso |
|------------|-----|
| **Matriz NumPy** `usuarios × hábitos` | Filtrado colaborativo (0/1 si tiene el hábito) |
| **Vectores** | Similitud coseno entre usuarios |
| **Dict `user_id → [WebSocket]`** | Conexiones activas por usuario |
| **Árboles de decisión** (ensemble) | Random Forest internamente |

**Cómo explicarlo:**

> *"PostgreSQL guarda todo lo permanente: quién completó qué hábito cada día. Redis guarda respuestas de IA que ya calculamos, para no repetir el trabajo. Para recomendar, construimos una matriz donde cada fila es un usuario y cada columna un hábito."*

---

## ☐ 1.3 Decidir la metodología de programación a seguir

**Qué cubre en Taskpin:** arquitectura en capas + REST + programación asíncrona (no MVC clásico).

| Patrón | Implementación |
|--------|----------------|
| **Capas** | Rutas (`main.py`) → lógica de negocio → `*Connection` (acceso a datos) → PostgreSQL |
| **REST** | Recursos por URL: `/api/usuario/{id}/habitos/...` |
| **Schemas (contratos)** | Pydantic valida entrada/salida (`habitSchema.py`, `aiSchema.py`) |
| **Repository/DAO** | Clases `habitConnection`, `planesConnection`, etc. |
| **Async/await** | Endpoints con WebSocket y operaciones I/O |
| **Separación frontend/backend** | Cliente Expo solo consume API; no toca la BD directamente |
| **Migraciones incrementales** | `Backend/migrations/001` … `012` |

**Cómo explicarlo:**

> *"Seguimos una metodología por capas: la app solo habla con la API; la API valida con Pydantic, ejecuta reglas de negocio y las clases Connection ejecutan SQL. Así cada capa tiene una responsabilidad clara."*

---

## ☐ 1.4 Argumentar con elementos de Ingeniería de Software

| Elemento | En el proyecto |
|----------|----------------|
| **Configuración por entorno** | `.env`, `config.py`, `EXPO_PUBLIC_API_URL` |
| **Seguridad** | JWT + bcrypt; `verify_user_access` |
| **CORS** | Orígenes permitidos (Netlify, localhost Expo) |
| **Degradación elegante** | Si Redis o Celery fallan, la API sigue |
| **Health checks** | `/api/system/health`, `/redis/status`, `/celery/status` |
| **Documentación modular** | `documentacion_modular/FASE_0` … `FASE_7` |
| **Evaluación offline de ML** | `evaluate_predictor.py`, `evaluate_recommender.py` |
| **Contenedorización** | `Backend/Dockerfile`, `render.yaml` |
| **Deploy** | Netlify (frontend), Render (backend) |

**Nota honesta:** no hay suite grande de tests automatizados (`pytest`); hay scripts de benchmark y resiliencia. Pueden decir: *"Tenemos evaluación de modelos y pruebas de carga manuales; los tests unitarios automatizados quedan como mejora futura."*

---

## ☐ 1.5 Estructurar el modelado del sistema

### Modelo entidad-relación (simplificado)

```
USUARIOS ──< HABITOS_USUARIO ──< SEGUIMIENTO_HABITOS
USUARIOS ──< PLANES_USUARIO ──< TAREAS_USUARIO
USUARIOS ─── ESTADISTICAS_USUARIO (gamificación)
```

### Modelo de arquitectura (4 capas)

Documentado en `documentacion_modular/FASE_0_inventario.md` y `FASE_5_arquitectura.md`:

1. **Presentación** — Expo (tabs, modales, hooks)
2. **Aplicación** — FastAPI (`main.py`)
3. **Dominio/IA** — `app/ai/`, `app/websocket/`
4. **Datos** — PostgreSQL + Redis

### Gamificación (modelo matemático no-ML)

Puntos para subir de nivel:

```
puntos_necesarios(n) = 100 · n² + 100
```

Implementado en `Backend/app/main.py` → `puntos_para_subir_nivel()`.

---

# MÓDULO 2 — Sistemas Inteligentes

## ☐ 2.1 Ramas de IA que cubre el proyecto

El criterio pide **al menos una** de la lista. Taskpin cubre varias de forma real (código ejecutable):

| Rama del criterio | ¿Taskpin? | Dónde |
|-------------------|-----------|-------|
| **2.1.2 Aprendizaje automático (ML)** | ✅ **Principal** | Random Forest en `Backend/app/ai/predictor.py` |
| **2.1.9 Árboles de decisión** | ✅ (parte del RF) | 100 árboles en el bosque aleatorio |
| **Filtrado colaborativo** | ✅ | `Backend/app/ai/recommender.py` + similitud coseno |
| 2.1.1 Redes neuronales | ❌ | Solo en documentación futura |
| 2.1.3 Visión artificial | ❌ | — |
| 2.1.6 Asistentes virtuales (ChatGPT) | ❌ | La pestaña "IA" es ML, no chatbot |
| 2.1.7 Sistemas expertos | ⚠️ Parcial | Reglas de gamificación/rachas |

**Cómo explicarlo:**

> *"Nuestro sistema inteligente usa Machine Learning clásico: un Random Forest para predecir si completarás un hábito hoy, y filtrado colaborativo para recomendar hábitos que usuarios parecidos a ti ya usan. No usamos redes neuronales ni servicios cognitivos en la nube."*

### Sección IA en la app

- **Recomendaciones:** `GET /api/ai/usuario/{id}/recomendaciones`
- **Predicciones:** `GET /api/ai/usuario/{id}/predicciones/hoy`
- **UI:** `Frontend/MATH.M1M/app/(tabs)/ai.tsx`, `RecommendationCard`, `PredictionBar`

---

## ☐ 2.2 Formular el modelo matemático correspondiente

### A) Recomendador — Similitud coseno + filtrado colaborativo

**Vector de hábitos** del usuario u: `u = [0,1,1,0,...]` (1 = tiene el hábito).

**Similitud entre usuarios A y B:**

```
                    Σᵢ (Aᵢ × Bᵢ)
sim(A, B) = ────────────────────────────
            √(Σᵢ Aᵢ²) × √(Σᵢ Bᵢ²)
```

**Score de recomendación:** suma de similitudes de vecinos que tienen el hábito h y tú no.

**Archivo:** `Backend/app/ai/recommender.py` (líneas 7–16 documentan la fórmula).

### B) Predictor — Random Forest (clasificación)

**Entrada:** vector de 5 features por hábito/día:

| Feature | Significado |
|---------|-------------|
| `dia_semana` | 0–6 (lunes–domingo) |
| `racha_actual` | Días seguidos completando |
| `tasa_exito_7_dias` | % éxito últimos 7 días |
| `completado_ayer` | 0 o 1 |
| `dias_desde_agregado` | Antigüedad del hábito |

**Salida:** probabilidad de clase "completado" con `predict_proba`.

**Impureza de Gini en cada árbol:**

```
Gini(S) = 1 - Σᵢ pᵢ²
```

**Predicción del bosque:**

```
ŷ = moda(árbol₁, árbol₂, ..., árbol₁₀₀)
```

**Archivo:** `Backend/app/ai/predictor.py`

### Datos reales del modelo

| Dato | Valor |
|------|-------|
| Registros históricos | **32,489** |
| Usuarios | **81** |
| Hábitos en catálogo | **25** |
| Accuracy | **~70.15%** |
| Split entrenamiento | 80% train / 20% test |
| Semilla | 42 |

Fuente: `documentacion_modular/FASE_0_inventario.md`

---

## ☐ 2.3 Justificar la selección de los algoritmos empleados

### Random Forest — ¿por qué y no una red neuronal?

| Razón | Explicación |
|-------|-------------|
| **Datos tabulares** | 5 variables numéricas; no hay imágenes ni texto largo |
| **Interpretabilidad** | Features con sentido (racha, día de la semana) |
| **Robustez** | Tolera hábitos marcados de forma irregular |
| **Sin GPU** | Entrena en CPU (`n_jobs=-1`) |
| **Control de overfitting** | `max_depth=10`, `min_samples_split=5` |
| **Reproducibilidad** | `random_state=42` |

### Filtrado colaborativo + coseno — ¿por qué?

| Razón | Explicación |
|-------|-------------|
| **Cold start parcial** | Fallback por popularidad si no hay vecinos similares |
| **Datos sparse** | Pocos usuarios tienen todos los hábitos |
| **Eficiencia** | NumPy calcula similitudes rápido |
| **Sin entrenamiento offline pesado** | Se recalcula con la matriz actual |

### ⚠️ No prometer en la exposición (solo planificado)

- K-Means, Naive Bayes, Azure Cognitive Services → `PLAN_MODULOS_2_Y_3.md` (futuro, no en código actual)

---

# MÓDULO 3 — Sistemas Distribuidos

## ☐ 3.1 Sistema descentralizado que comparte recursos

| Opción del criterio | ¿Cumple? | Evidencia |
|---------------------|----------|-----------|
| **3.1.1 Componentes concurrentes** | ✅ | FastAPI async, pool PostgreSQL, `n_jobs=-1`, workers Celery |
| **3.1.4 Distribuir procesamiento** | ✅ | Celery entrena y precalcula IA fuera del HTTP |
| **3.1.5 Tolerancia a fallos** | ✅ Parcial | Sin Redis → API recalcula (`FASE_4_resiliencia.md`) |
| **3.1.6 Tiempo real con sockets** | ✅ | WebSocket al marcar hábitos |
| **3.1.2 Dividir BD** | ⚠️ Parcial | PostgreSQL + Redis (roles distintos) |
| **3.1.7 Seguridad multi-arquitectura** | ✅ Parcial | JWT en app y API; HTTPS en producción |

### Concurrencia (3.1.1)

- Muchas peticiones HTTP simultáneas (ASGI).
- Endpoint `toggle` es `async` y dispara WebSocket.
- Celery en **proceso separado** del servidor uvicorn.

### Procesamiento distribuido (3.1.4)

**Archivo:** `Backend/app/tasks/celery_app.py`

Tareas: `train_model_task`, `generate_recommendations_task`, `generate_predictions_task`

Endpoints: `POST /api/ai/entrenar/async`, `GET /api/tasks/{task_id}/status`

### Tiempo real (3.1.6)

Flujo al completar hábito:

1. `POST /api/usuario/{id}/habito/{id}/toggle`
2. Actualiza PostgreSQL
3. Invalida caché Redis
4. `await ws_manager.send_to_user(user_id, event)`

**Varias conexiones por usuario** (móvil + web): `Backend/app/websocket/manager.py`

---

## ☐ 3.2 Algoritmo cliente-servidor o punto a punto (propio)

**Modelo:** **Cliente-servidor** (no P2P).

**Lógica propia (no solo "usamos FastAPI"):**

1. `ConnectionManager` — registro, envío, limpieza de conexiones muertas
2. Protocolo de eventos — `websocket/events.py` (`habit_completed`, `habit_uncompleted`, ping/pong)
3. Flujo toggle → invalidar Redis → push WS en `main.py`
4. Hook cliente `useWebSocket.ts` — reconexión automática
5. Celery + cola Redis — desacoplar trabajo pesado del request HTTP

---

## ☐ 3.3 Comunicación entre al menos dos dispositivos

**Escenario válido:** mismo usuario, dos dispositivos.

1. Login en **teléfono** y en **navegador** (o dos simuladores).
2. Ambos abren WebSocket: `WS /ws/{user_id}`.
3. En el teléfono se marca un hábito → `POST .../toggle`.
4. El **otro dispositivo** recibe `habit_completed` sin refrescar.

**Por qué cumple el criterio:** no es solo "dos pantallas que consultan el mismo API"; hay **push en tiempo real** entre dispositivos.

**Archivos:** `home.tsx`, `WSNotification.tsx`, `useWebSocket.ts`

### Demo sugerida

1. Abrir app en emulador + web con el mismo usuario.
2. Marcar hábito en uno → ver actualización en el otro.
3. Mostrar `GET /api/system/health` (stats WebSocket).

---

## ☐ 3.4 Justificar los protocolos de comunicación

| Protocolo | Rol | Justificación |
|-----------|-----|----------------|
| **HTTP/HTTPS** | CRUD, login, IA | Estándar, fácil de depurar, compatible con Netlify/Render |
| **WebSocket (ws/wss)** | Sync entre dispositivos | HTTP es request-response; WS permite que el servidor **empuje** eventos |
| **JSON** | REST y WS | Mismo formato en app, API y Celery |
| **JWT (HS256)** | Auth stateless | Token en cada request; servidor no guarda sesión en RAM |
| **TCP** (implícito) | PostgreSQL, Redis | Transporte de las bases de datos |

### Diagrama de flujo

```
App --[HTTPS JSON + JWT]--> API --[SQL]--> PostgreSQL
App --[WSS JSON]-----------> API --[push]--> Otro dispositivo (mismo user_id)
API --[Redis]-------------> Caché / cola Celery
Worker --[Celery/JSON]----> Redis (tareas IA)
```

**Cliente WS:** `Frontend/MATH.M1M/hooks/useWebSocket.ts` convierte `http`→`ws` y `https`→`wss` según `constants/api.ts`.

---

# Resumen por módulo (30 segundos cada uno)

| Módulo | Mensaje clave |
|--------|----------------|
| **Módulo 1** | Arquitectura en capas, Python+TS+PostgreSQL, migraciones, JWT, modelado ER y 4 capas |
| **Módulo 2** | ML con Random Forest (árboles + Gini) y recomendaciones por similitud coseno; 32k+ registros |
| **Módulo 3** | Cliente-servidor con WS propio para 2+ dispositivos, Celery, Redis, HTTP+WS+JWT |

---

# Archivos clave para la demo

| Tema | Archivo |
|------|---------|
| API general | `Backend/app/main.py` |
| ML predicción | `Backend/app/ai/predictor.py` |
| ML recomendación | `Backend/app/ai/recommender.py` |
| WebSocket servidor | `Backend/app/websocket/manager.py` |
| WebSocket cliente | `Frontend/MATH.M1M/hooks/useWebSocket.ts` |
| Pantalla IA | `Frontend/MATH.M1M/app/(tabs)/ai.tsx` |
| Dataset / métricas | `documentacion_modular/FASE_0_inventario.md` |
| Esquema BD | `taskpin.sql` |

---

# Preguntas frecuentes en exposiciones

**¿Por qué no ChatGPT / visión / robots?**  
El problema es predecir hábitos con datos tabulares históricos, no procesar lenguaje natural ni imágenes.

**¿Es realmente distribuido?**  
Hay varios procesos: app cliente, API, worker Celery, PostgreSQL, Redis, y múltiples clientes WS sincronizados. Escalado horizontal multi-servidor con Pub/Sub está planificado pero no es el foco actual.

**¿Cómo validan la IA?**  
Scripts `Backend/scripts/evaluate_predictor.py` y `evaluate_recommender.py` con accuracy, F1, etc., en `documentacion_modular/evidencia/`.

---

# Diagrama secuencia IA + tiempo real

```
App                    API                 PostgreSQL    Redis       WS Manager
 │                      │                      │           │            │
 │── GET predicciones ─►│                      │           │            │
 │                      │── cache? ────────────┼──────────►│            │
 │                      │ (miss) consulta BD ─►│           │            │
 │                      │ RandomForest         │           │            │
 │                      │── guarda cache ──────┼──────────►│            │
 │◄── JSON predicciones─│                      │           │            │
 │                      │                      │           │            │
 │── POST toggle ──────►│── UPDATE ───────────►│           │            │
 │                      │── invalidate ────────┼──────────►│            │
 │                      │── send habit_completed ──────────┼───────────►│
 │◄── WS event ─────────┼──────────────────────┼───────────┼────────────┤ (otro dispositivo)
```

---

*Documento generado para la exposición académica de Taskpin. Repositorio: `/Users/dgovea/Documents/Taskpin`*
