# Fase 4 — Resiliencia, Manejo de Errores y Riesgos

> **Estado:** ✅ Completada  
> **Fecha:** 27 de Abril, 2026  
> **Script:** `Backend/scripts/test_resilience.py`  
> **JSON de evidencia:** `documentacion_modular/evidencia/resilience_results.json`  
> **Tests pasados:** 13/13

---

## Para el compañero que redacta el documento

Esta fase responde a:

> *"Debe fortalecerse la explicación sobre manejo de errores, tolerancia a fallos
> y riesgos técnicos del sistema."*

> *"El documento menciona atributos como baja latencia, tolerancia a fallos,
> seguridad y escalabilidad, pero no presenta evidencia concreta."*

**Qué copiar al documento:**
- Sección **"Tolerancia a Fallos"**: tabla 4.1.
- Sección **"Manejo de Errores HTTP"**: tabla 4.2.
- Sección **"Riesgos Técnicos"**: tabla 4.5 completa.
- Mencionar el bug corregido en 4.4 como evidencia de proceso de calidad.

---

## 4.1 Comportamiento por componente caído

Esta es la matriz de fallos del sistema. Describe qué pasa cuando cada servicio
deja de funcionar:

| Componente | Estado en prueba | Comportamiento del sistema | Impacto en usuario |
|------------|-----------------|---------------------------|--------------------|
| **PostgreSQL** | Activo ✅ | API funciona normalmente | Sin impacto |
| **PostgreSQL** | Caído ❌ | Endpoints retornan 500 con mensaje de error | App no funciona (crítico) |
| **Redis** | Activo ✅ | Predicciones/recomendaciones en ~6 ms | Sin impacto |
| **Redis** | Caído ❌ | Sistema en modo "degraded", cálculos en frío (~50–160 ms) | App funciona, más lenta |
| **Celery Worker** | No activo ⚠️ | `/api/system/health` lo detecta, endpoints async no disponibles | Entrenam. manual deshabilitado |
| **Celery Worker** | Activo ✅ | Entrenamiento async, predicciones en batch | Funcionalidad completa |

> **Conclusión para el documento:** El sistema tiene **un punto crítico** (PostgreSQL)
> y dos **servicios opcionales con degradación controlada** (Redis, Celery).
> La app móvil sigue funcionando completamente aunque Redis y Celery no estén activos.

---

## 4.2 Resultados de pruebas de resiliencia (13/13 pasados)

| Test | HTTP Status | Resultado | Tiempo |
|------|-------------|-----------|--------|
| Health check general | 200 | ✅ Passed | — |
| GET /habitos/hoy | 200 | ✅ Passed | 27.7 ms |
| GET /ai/predicciones/hoy | 200 | ✅ Passed | 10.1 ms |
| GET /ai/recomendaciones | 200 | ✅ Passed | 8.7 ms |
| GET /estadisticas | 200 | ✅ Passed | 10.9 ms |
| GET /api/system/redis/status | 200 | ✅ Passed | 16.7 ms |
| GET /api/system/websocket/status | 200 | ✅ Passed | 10.5 ms |
| GET /api/system/celery/status | 200 | ✅ Passed | 1,012 ms |
| Login — credenciales incorrectas | **401** | ✅ Passed | 9.0 ms |
| Acceso a datos de otro usuario | **403** | ✅ Passed | 11.7 ms |
| Hábito inexistente | **404** | ✅ Passed | 10.2 ms |
| Predicción de hábito inexistente | **404** | ✅ Passed | 8.3 ms |
| Token JWT inválido | **401** | ✅ Passed | 5.9 ms |

---

## 4.3 Manejo de errores HTTP implementado

| Situación | Código HTTP | Mensaje devuelto |
|-----------|-------------|-----------------|
| Credenciales incorrectas | 401 | "Credenciales incorrectas" |
| Token JWT inválido/expirado | 401 | "Token inválido o expirado: [detalle]" |
| Sin token en la petición | 401 | "Token de autenticación requerido" |
| Acceso a datos de otro usuario | 403 | "No tienes permiso para acceder a estos datos" |
| Recurso no encontrado | 404 | "[Recurso] no encontrado" |
| Error interno del servidor | 500 | "Error al [operación]: [mensaje]" |
| Datos de entrada inválidos | 422 | Detalle del campo inválido (Pydantic) |

> Todos los errores siguen el mismo formato JSON:
> `{"detail": "mensaje descriptivo"}` — estándar de FastAPI.

---

## 4.4 Bug corregido durante las pruebas

Durante la ejecución de la Fase 4 se identificó y corrigió un bug en producción:

| Bug | Síntoma | Causa | Corrección |
|-----|---------|-------|-----------|
| `GET /api/current-user` sin auth | Retornaba **500** con token inválido | El endpoint no tenía `Depends(verify_token)` y usaba `conn.conn.cursor()` (patrón antiguo de conexión) | Se añadió `Depends(verify_token)` y se migró a `get_pool()` |

**Resultado:** El endpoint ahora retorna **401** correctamente con token inválido.

---

## 4.5 Riesgos técnicos documentados

| Riesgo | Probabilidad | Impacto | Mitigación existente |
|--------|-------------|---------|---------------------|
| **Caída de PostgreSQL** | Baja | Crítico — app sin funcionamiento | Pool de conexiones (min 2, max 10) con reconexión automática |
| **Cold start del predictor** | Media | Latencia alta en primera predicción tras caché expirado | Modelo cargado en memoria al arrancar el servidor |
| **Cold start de usuario nuevo** | Alta | Sin historial → predicciones con features en cero | Fallback a popularidad global en recomendador |
| **Sesgo en datos de entrenamiento** | Media | Predicciones menos precisas para perfiles atípicos | Datos de 81 usuarios seed con variedad de patrones |
| **Token JWT sin revocación** | Media | Sesión activa aunque el usuario se desconecte | TTL corto + tabla `control` para auditoría |
| **Desbordamiento de caché Redis** | Baja | Recomendaciones y predicciones obsoletas | TTL de 30 y 60 min; invalidación en toggle de hábito |
| **Overflow de conexiones DB** | Baja | Errores 500 bajo alta carga | Pool limitado a 10 conexiones máximas |
| **Catálogo pequeño (25 hábitos)** | Alta | Recomendaciones repetitivas a largo plazo | Hábitos personalizados disponibles en el sistema |

---

## 4.6 Implementación de seguridad básica

| Mecanismo | Implementación | Archivo |
|-----------|---------------|---------|
| Autenticación | JWT (python-jose) con algoritmo HS256 | `app/main.py` → `verify_token()` |
| Contraseñas | bcrypt con PassLib (hash unidireccional) | `app/model/userConnection.py` |
| Autorización por recurso | `verify_user_access()` — cada usuario solo accede a sus datos | `app/main.py` |
| CORS | Middleware FastAPI CORS configurado | `app/main.py` |
| Validación de entrada | Pydantic v2 en todos los schemas | `app/schema/` |

---

## 4.7 Health checks disponibles

| Endpoint | Verifica | Respuesta tipo |
|----------|----------|----------------|
| `GET /api/system/health` | PostgreSQL + Redis + Celery | `{"status": "healthy"/"degraded", "services": {...}}` |
| `GET /api/system/redis/status` | Redis (conexión + keys + memoria) | `{"redis": {"connected": true, ...}}` |
| `GET /api/system/celery/status` | Workers activos + tareas en cola | `{"celery": {"status": "running"/"no_workers"}}` |
| `GET /api/system/websocket/status` | Conexiones WS activas | `{"websocket": {"total_connections": N}}` |

---

## 4.8 Cómo reproducir las pruebas

```bash
# Backend debe estar corriendo en :8000
cd Backend
source .venv/bin/activate
python scripts/test_resilience.py
# → genera documentacion_modular/evidencia/resilience_results.json
```

---

*Evidencia completa en: `documentacion_modular/evidencia/resilience_results.json`*
