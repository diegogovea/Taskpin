# Fase 6 — Comparativa con Alternativas y Decisiones Técnicas

> **Estado:** ✅ Completada  
> **Fecha:** 27 de Abril, 2026

---

## Para el compañero que redacta el documento

Esta fase responde directamente a:

> *"Hace falta comparar la solución propuesta frente a otras alternativas para
> reforzar la justificación de las decisiones técnicas adoptadas."*

**Qué copiar al documento:**
- Sección **"Análisis de Alternativas"**: tabla 6.1 completa.
- Sección **"Justificación Técnica"**: tablas 6.2 a 6.6.
- Cada tabla incluye el razonamiento listo para redactar.

---

## 6.1 Taskpin vs Aplicaciones Existentes

Comparativa con las apps de seguimiento de hábitos más conocidas:

| Criterio | **Taskpin** | Habitica | Streaks | Loop Habits | Fabulous |
|----------|-------------|----------|---------|-------------|----------|
| **IA Predictiva** | ✅ Random Forest | ❌ | ❌ | ❌ | ❌ |
| **Recomendaciones IA** | ✅ Filtrado colaborativo | ❌ | ❌ | ❌ | ❌ |
| **Tiempo real (WebSocket)** | ✅ | ✅ (limitado) | ❌ | ❌ | ❌ |
| **API REST propia** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Caché distribuido** | ✅ Redis | ❌ | ❌ | ❌ | ❌ |
| **Tareas asíncronas** | ✅ Celery | ❌ | ❌ | ❌ | ❌ |
| **Planes con tareas** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Reflexiones diarias** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Multiplataforma móvil** | ✅ iOS + Android | ✅ | ❌ (iOS only) | ❌ (Android only) | ✅ |
| **Open source** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Código de acceso libre** | ✅ | ❌ (SaaS) | ❌ | ✅ | ❌ |
| **Predicción de cumplimiento** | ✅ probabilidad 0-1 | ❌ | ❌ | ❌ | ❌ |

> **Para el documento:** Taskpin es la única solución de las comparadas que combina
> seguimiento de hábitos con **inteligencia artificial predictiva** y
> **recomendaciones personalizadas** en tiempo real. Las apps comerciales existentes
> se limitan a estadísticas reactivas (qué pasó), mientras Taskpin añade
> una capa proactiva (qué probablemente pasará).

---

## 6.2 Justificación: Random Forest vs Alternativas para Predicción

| Alternativa | Por qué NO se eligió | Ventaja de Random Forest |
|-------------|---------------------|--------------------------|
| **Regresión Logística** | Asume relación lineal entre features y target; el comportamiento humano no es lineal | RF captura relaciones no lineales (ej. la racha importa más después de 7 días) |
| **Red Neuronal (MLP)** | Requiere muchos más datos y tiempo de entrenamiento; caja negra difícil de explicar | RF con 32K registros es suficiente; importancia de features interpretable |
| **SVM** | Costoso computacionalmente con muchos registros; difícil de calibrar para probabilidades | RF da probabilidades directas con `predict_proba()` |
| **KNN** | Lento en inferencia (compara con todos los registros en tiempo real) | RF inferencia en < 1 ms por muestra (medido en Fase 3) |
| **Árbol de decisión simple** | Alta varianza, overfitting con pocos datos | RF promedia 100 árboles → reduce varianza (CV std = 0.0012) |
| **XGBoost / LightGBM** | Mayor complejidad de implementación y dependencias; pequeña mejora en este dataset | RF alcanza 70% accuracy con 5 features simples; suficiente para el caso de uso |

> **Decisión tomada:** Random Forest con 100 árboles, max_depth=10, random_state=42.
> Accuracy de 70.04% con AUC-ROC de 74.09% sobre 32,489 registros reales.

---

## 6.3 Justificación: Filtrado Colaborativo vs Alternativas para Recomendaciones

| Alternativa | Por qué NO se eligió | Ventaja del Filtrado Colaborativo |
|-------------|---------------------|-----------------------------------|
| **Basado en contenido** | Necesita descripción semántica rica de cada hábito; catálogo de 25 hábitos es demasiado pequeño para TF-IDF o embeddings | CF usa comportamiento real de usuarios, no metadatos de ítems |
| **Popularidad pura** | No personaliza; todos reciben las mismas recomendaciones | CF encuentra usuarios similares → recomendaciones personalizadas |
| **Sistemas híbridos (CF + contenido)** | Complejidad innecesaria con 25 hábitos; el catálogo pequeño no justifica la infraestructura | CF simple con coseno da cobertura del 100% y Hit Rate @10 de 48% |
| **Factorización matricial (SVD)** | Requiere más usuarios y más hábitos para encontrar factores latentes estables; con 81×25 la matriz es demasiado pequeña | Similitud coseno directa en matriz binaria es más estable con datos pequeños |
| **Reglas de asociación (Apriori)** | Necesita soporte mínimo alto → pierde hábitos poco comunes | CF da score continuo para todos los hábitos candidatos |

> **Decisión tomada:** Filtrado colaborativo con similitud coseno, implementado
> íntegramente en NumPy sin dependencias de frameworks ML adicionales.
> Cobertura del 100% del catálogo y MRR de 0.1469 (posición promedio ~7 de 25).

---

## 6.4 Justificación: FastAPI vs Alternativas de Backend

| Framework | Por qué NO se eligió |
|-----------|---------------------|
| **Django REST Framework** | Más pesado, mayor overhead para una API pura; ORM de Django no era necesario (ya se usa psycopg directamente) |
| **Flask** | Sin soporte nativo de async/await; WebSockets requieren extensiones (Flask-SocketIO); sin validación automática de tipos |
| **Node.js (Express)** | El stack de ML en Python (scikit-learn, NumPy) no es portable a Node; habría requerido un microservicio Python separado |
| **Spring Boot (Java)** | Verbosidad excesiva para un equipo pequeño; integración con scikit-learn sería a través de subprocess |
| **Go (Gin/Fiber)** | Excelente rendimiento pero sin ecosistema de ML nativo; mismo problema que Node |

> **Decisión tomada:** FastAPI v0.115.
> - Soporte nativo de `async/await` → WebSockets sin librerías externas.
> - Pydantic v2 → validación automática de todos los esquemas de entrada/salida.
> - Documentación automática en `/docs` (Swagger UI).
> - Mismo ecosistema que scikit-learn, NumPy, joblib → sin fricción.

---

## 6.5 Justificación: React Native / Expo vs Alternativas de Frontend

| Framework | Por qué NO se eligió |
|-----------|---------------------|
| **Flutter** | Curva de aprendizaje de Dart; el equipo tenía experiencia previa en React |
| **Ionic / Capacitor** | Rendimiento inferior en animaciones; basado en WebView, no en componentes nativos |
| **Swift / Kotlin nativos** | Requiere dos codebases separadas (iOS y Android); duplicación de esfuerzo |
| **PWA (Progressive Web App)** | Sin acceso a notificaciones nativas; experiencia de usuario inferior en móvil |

> **Decisión tomada:** React Native con Expo SDK 53.
> - Un solo codebase para iOS y Android.
> - Expo Router para navegación basada en archivos (similar a Next.js).
> - Expo Go para pruebas rápidas sin compilar.
> - Ecosistema rico: AsyncStorage, gesture handler, reanimated.

---

## 6.6 Justificación: Redis vs Alternativas de Caché

| Alternativa | Por qué NO se eligió |
|-------------|---------------------|
| **Caché en memoria (dict Python)** | Se pierde al reiniciar el servidor; no comparte caché entre múltiples workers de uvicorn |
| **Memcached** | Sin soporte nativo de estructuras de datos complejas (JSON, listas); Celery no lo soporta como broker |
| **Base de datos (PostgreSQL como caché)** | Mayor latencia que Redis en memoria; no tiene TTL nativo por registro |
| **Sin caché** | Cada predicción tomaría 50–160 ms en lugar de 6 ms; 16× más lento (medido en Fase 3) |

> **Decisión tomada:** Redis v7.
> - db=1 para caché de IA (TTL: predicciones 30 min, recomendaciones 60 min).
> - db=2 como broker de Celery para entrenamiento asíncrono.
> - Fallback graceful: el sistema funciona sin Redis, solo más lento.
> - Invalidación activa: al completar un hábito, se elimina el caché de predicciones.

---

## 6.7 Justificación: PostgreSQL vs Alternativas de Base de Datos

| Alternativa | Por qué NO se eligió |
|-------------|---------------------|
| **MySQL / MariaDB** | Menor soporte de tipos avanzados; sin `psycopg-pool` nativo |
| **SQLite** | Sin concurrencia real; no apto para producción con múltiples usuarios simultáneos |
| **MongoDB (NoSQL)** | El modelo de datos de Taskpin es relacional (usuarios → hábitos → seguimientos → estadísticas); SQL es más natural y eficiente |
| **Supabase (PostgreSQL SaaS)** | Mayor latencia por red; dependencia de terceros; costo en producción |

> **Decisión tomada:** PostgreSQL 14 con psycopg 3 y psycopg-pool.
> - Pool de conexiones (min 2, max 10) → sin overhead de conexión por request.
> - Soporte completo de JOINs complejos para features del predictor.
> - CURRENT_DATE, CURRENT_TIME nativos para el tracking diario.

---

## 6.8 Resumen de decisiones

| Componente | Elegido | Razón principal |
|------------|---------|-----------------|
| Predictor IA | Random Forest | Interpretable, robusto con 32K registros, inferencia < 1 ms |
| Recomendador IA | Similitud Coseno CF | Sin entrenamiento previo, cobertura 100%, escalable a más hábitos |
| Backend | FastAPI | Async nativo + Pydantic + ecosistema Python ML |
| Frontend | React Native Expo | Un codebase, iOS + Android, equipo con experiencia JS/TS |
| Caché | Redis | In-memory, TTL por clave, broker Celery, fallback graceful |
| Base de datos | PostgreSQL | Modelo relacional, concurrencia, pool de conexiones |
| Autenticación | JWT (HS256) | Stateless, fácil de validar en cada endpoint |
| Tiempo real | WebSocket nativo FastAPI | Sin dependencias extra, integrado en el mismo servidor |

---

*Este documento no requiere evidencia JSON — las tablas son la justificación.*
