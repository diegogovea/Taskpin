# Fase 0 — Inventario del Sistema Taskpin

> **Estado:** ✅ Completada  
> **Fecha:** 27 de Abril, 2026  
> **Responsable técnico:** Diego  
> **Responsable documento:** [nombre compañero]

---

## Para el compañero que redacta el documento

Esta fase es el **punto de partida** del documento técnico. Los datos de esta sección
van en las siguientes partes del informe universitario:

| Sección del documento | Qué tomar de aquí |
|-----------------------|-------------------|
| Introducción / Descripción del sistema | Tabla de módulos y resumen de endpoints |
| Marco tecnológico / Stack | Tabla de tecnologías |
| Descripción de la IA | Tabla de datos de entrenamiento |
| Justificación del sistema | Números reales de registros y usuarios |

> ⚠️ **Todos los números en este documento son reales** — obtenidos directamente
> de la base de datos y del código en ejecución el 27/04/2026.

---

## 1. Arquitectura general

Taskpin es una aplicación móvil de seguimiento de hábitos y metas personales
compuesta por **4 capas principales** que se comunican entre sí:

```
[App Móvil (React Native / Expo)]
        │  HTTP REST + WebSocket
        ▼
[Backend API (FastAPI / Python)]
        │                    │
        ▼                    ▼
[PostgreSQL 14]         [Redis 7]
(datos persistentes)    (caché + broker)
        │
        ▼
[Celery Worker]
(tareas IA en background)
```

---

## 2. Módulos del backend

| Módulo | Archivo(s) | Responsabilidad |
|--------|-----------|-----------------|
| API principal | `app/main.py` | 50+ endpoints REST + WebSocket |
| Predictor IA | `app/ai/predictor.py` | Random Forest — probabilidad de completar hábito |
| Recomendador IA | `app/ai/recommender.py` | Filtrado colaborativo — hábitos sugeridos |
| Extractor de features | `app/ai/feature_extractor.py` | Prepara datos de DB para los modelos |
| Conexión hábitos | `app/model/habitConnection.py` | CRUD hábitos + seguimiento diario |
| Conexión planes | `app/model/planesConnection.py` | CRUD planes y tareas |
| Conexión usuarios | `app/model/userConnection.py` | Auth, CRUD usuarios |
| Conexión estadísticas | `app/model/estadisticasConnection.py` | Métricas de progreso del usuario |
| Conexión reflexiones | `app/model/reflexionesConnection.py` | Diario personal |
| Redis client | `app/core/redis_client.py` | Caché de predicciones y recomendaciones |
| WebSocket manager | `app/websocket/manager.py` | Conexiones en tiempo real |
| WebSocket events | `app/websocket/events.py` | Tipos de eventos WS |
| Tareas Celery | `app/tasks/ai_tasks.py` | Entrenamiento y predicciones en background |
| Configuración | `app/config.py` | Variables de entorno centralizadas |
| Pool de conexiones | `app/database.py` | Pool psycopg compartido (min 2, max 10) |

---

## 3. Endpoints disponibles (agrupados)

| Grupo | Cantidad | Ejemplos clave |
|-------|----------|----------------|
| Autenticación | 3 | `POST /register`, `POST /login`, `GET /api/current-user` |
| Usuarios | 3 | `GET/PUT/DELETE /api/usuario/{id}` |
| Hábitos | 14 | `GET /api/usuario/{id}/habitos/hoy`, `POST /toggle` |
| Planes | 12 | `GET /api/planes/mis-planes/{id}`, `POST /marcar-tarea` |
| Estadísticas | 2 | `GET /api/usuario/{id}/estadisticas` |
| Reflexiones | 3 | `POST/GET /api/usuario/{id}/reflexion` |
| IA | 7 | `GET /predicciones/hoy`, `GET /recomendaciones`, `POST /entrenar` |
| Sistema | 5 | `GET /api/system/health`, `/redis/status`, `/celery/status` |
| WebSocket | 1 | `WS /ws/{user_id}` |
| **Total** | **50+** | |

---

## 4. Stack tecnológico

| Capa | Tecnología | Versión | Rol |
|------|-----------|---------|-----|
| Frontend | React Native + Expo | 0.79.5 / SDK 53 | App móvil iOS/Android |
| Backend | FastAPI + Python | 0.115 / 3.11 | API REST + WebSocket |
| Base de datos | PostgreSQL | 14+ | Persistencia principal |
| Caché | Redis | 7 | Caché IA, broker Celery |
| Tareas async | Celery | 5.4 | Entrenamiento en background |
| ML | scikit-learn | 1.8.0 | Random Forest, métricas |
| Álgebra | NumPy | 1.26.4 | Vectores de usuarios/hábitos |
| Auth | JWT (python-jose) | 3.3 | Tokens de sesión |
| ORM/DB driver | psycopg + psycopg-pool | 3.2.9 | Pool de conexiones |

---

## 5. Datos disponibles para IA (estado actual)

Estos números son **reales**, extraídos de la base de datos el 27/04/2026:

| Dato | Valor |
|------|-------|
| Registros de seguimiento histórico | **32,489** |
| Registros positivos (hábito completado) | **20,677** (63.6%) |
| Registros negativos (hábito no completado) | **11,812** (36.4%) |
| Usuarios registrados | **81** |
| Hábitos en catálogo | **25** |
| Dimensiones de matriz recomendador | **81 usuarios × 25 hábitos** |
| Accuracy actual del modelo (sin reentrenar) | **70.15%** |
| Split de entrenamiento | 80% train / 20% test |
| Semilla aleatoria | 42 (reproducible) |

> Para el documento: estos números respaldan que el sistema **no es un prototipo vacío** —
> tiene datos reales de usuarios seed con comportamiento simulado realista.

---

## 6. Features del modelo predictor

El modelo Random Forest usa **5 features** extraídas por hábito/usuario/día:

| Feature | Descripción | Rango |
|---------|-------------|-------|
| `dia_semana` | Día de la semana (0=Lunes, 6=Domingo) | 0–6 |
| `racha_actual` | Días consecutivos completando el hábito | ≥ 0 |
| `tasa_exito_7_dias` | % de completados en los últimos 7 días | 0.0–1.0 |
| `completado_ayer` | Si completó el hábito el día anterior | 0 o 1 |
| `dias_desde_agregado` | Antigüedad del hábito en días | ≥ 0 |

---

## 7. Hiperparámetros del modelo

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| `n_estimators` | 100 | Balance rendimiento/velocidad |
| `max_depth` | 10 | Evitar overfitting |
| `min_samples_split` | 5 | Nodos con al menos 5 muestras |
| `min_samples_leaf` | 2 | Hojas con al menos 2 muestras |
| `random_state` | 42 | Reproducibilidad |
| `n_jobs` | -1 | Usa todos los cores disponibles |

---

## 8. Caché — TTLs definidos

| Dato cacheado | TTL | Key Redis |
|---------------|-----|-----------|
| Predicciones por usuario | 30 min | `taskpin:predictions:user:{id}` |
| Recomendaciones por usuario | 60 min | `taskpin:recommendations:user:{id}:limit:{n}` |
| Invalidación | Al hacer toggle de hábito | Automática en el endpoint |

---

## 9. Scripts de datos disponibles

| Script | Descripción |
|--------|-------------|
| `seed_data.py` | Datos base: usuarios, hábitos, planes |
| `seed_ai_50users.py` | 50 usuarios con historial de seguimiento realista |
| `seed_ai_test.py` | Datos de prueba para validar IA |

---

## 10. Lo que NO existe todavía (pendiente de fases siguientes)

| Pendiente | Se crea en |
|-----------|-----------|
| Métricas completas del predictor (F1, CV, etc.) | Fase 1 |
| Métricas del recomendador (hit-rate, MRR) | Fase 2 |
| Benchmarks de latencia y carga | Fase 3 |
| Matriz de resiliencia (qué pasa si cae cada componente) | Fase 4 |
| Diagramas de arquitectura y flujos | Fase 5 |
| Comparativa vs alternativas | Fase 6 |
| Evaluación con usuarios | Fase 7 |

---

## Conclusión de la Fase 0

El sistema Taskpin **existe, corre y tiene datos reales**. El predictor tiene
accuracy de **70.15%** sobre 32,489 registros. Las siguientes fases van a
profundizar en validación, rendimiento y documentación comparativa —
exactamente lo que pide el comité evaluador.

---

*Generado automáticamente como parte del proceso de documentación modular.*
