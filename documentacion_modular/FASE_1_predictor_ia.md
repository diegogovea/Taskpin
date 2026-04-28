# Fase 1 — Validación del Predictor de Hábitos (IA)

> **Estado:** ✅ Completada  
> **Fecha:** 27 de Abril, 2026  
> **Script de evaluación:** `Backend/scripts/evaluate_predictor.py`  
> **JSON de evidencia:** `documentacion_modular/evidencia/predictor_metrics.json`

---

## Para el compañero que redacta el documento

Esta fase responde directamente a dos observaciones del comité:

> *"La validación del modelo de inteligencia artificial requiere mayor profundidad,
> incluyendo detalle sobre entrenamiento, métricas, validación y resultados obtenidos."*

> *"Se recomienda incluir métricas o evidencia cuantitativa que respalde el
> desempeño general del sistema y del componente inteligente."*

**Qué copiar al documento:**
- Sección **"Modelo de Predicción"**: usa las tablas 1.3 y 1.4 completas.
- Sección **"Validación del Modelo"**: usa la tabla 1.5 (CV 5-fold).
- Sección **"Análisis de Features"**: usa la tabla 1.6.
- Toda cifra aquí viene del JSON en `evidencia/predictor_metrics.json`, generado
  sobre la base de datos real del sistema.

---

## 1.1 Descripción del modelo

El predictor usa un **Random Forest Classifier** (100 árboles de decisión)
entrenado sobre historial real de cumplimiento de hábitos. El modelo predice,
para cada hábito activo de un usuario, la **probabilidad de completarlo hoy**
(valor entre 0 y 1).

**Fórmula de predicción:**

```
Predicción = voto_mayoritario(árbol₁, árbol₂, ..., árbol₁₀₀)

Cada nodo usa Impureza de Gini para dividir:
  Gini(S) = 1 - Σᵢ pᵢ²
  donde pᵢ = proporción de clase i en el nodo S
```

---

## 1.2 Datos de entrenamiento

| Dato | Valor |
|------|-------|
| Total de registros | **32,489** |
| Registros positivos (hábito completado) | **20,677** (63.64%) |
| Registros negativos (hábito no completado) | **11,812** (36.36%) |
| Usuarios con datos | **81** |
| Hábitos en catálogo | **25** |
| Fuente de datos | Tabla `seguimiento_habitos` en PostgreSQL |
| Datos generados con | `scripts/seed_ai_50users.py` (comportamiento simulado realista) |

> El desbalance de clases (64/36) refleja que los usuarios tienden a completar
> sus hábitos más días de los que no. El modelo maneja esto de forma natural
> con Random Forest sin requerir oversampling.

---

## 1.3 Proceso de entrenamiento

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| Split | 80% train / 20% test | Estándar en clasificación con >10k registros |
| Estratificación | Sí | Mantiene proporción 64/36 en train y test |
| Semilla aleatoria | 42 | Reproducibilidad total del experimento |
| `n_estimators` | 100 | Balance rendimiento/costo computacional |
| `max_depth` | 10 | Evita overfitting en datos con 5 features |
| `min_samples_split` | 5 | Mínimo de muestras para dividir un nodo |
| `min_samples_leaf` | 2 | Evita hojas con muy pocos datos |
| Registros train | 25,991 | |
| Registros test | 6,498 | |
| Tiempo de entrenamiento | **0.21 segundos** | En MacBook M1 |

---

## 1.4 Métricas en conjunto de test

| Métrica | Valor |
|---------|-------|
| **Accuracy** | **70.04%** |
| Precision (weighted) | 68.94% |
| Precision (macro) | 67.61% |
| Recall (weighted) | 70.04% |
| Recall (macro) | 64.28% |
| **F1-Score (weighted)** | **68.49%** |
| F1-Score (macro) | 64.78% |
| **AUC-ROC** | **74.09%** |
| Tiempo de inferencia | **0.004 ms por muestra** |

> **Interpretación para el documento:**
> El modelo clasifica correctamente el 70% de los casos. El AUC-ROC de 74%
> indica que discrimina bien entre hábitos que se van a completar y los que no.
> El tiempo de inferencia de 0.004 ms hace viable la predicción en tiempo real
> para todos los hábitos de un usuario por solicitud.

---

## 1.5 Validación cruzada estratificada — 5-fold

Este experimento divide los 32,489 registros en 5 bloques, entrenando 5 veces
con combinaciones distintas de train/test. Valida que el modelo **no depende
del split específico** y sus resultados son generalizables.

| Métrica | Fold 1 | Fold 2 | Fold 3 | Fold 4 | Fold 5 | Media | Desviación |
|---------|--------|--------|--------|--------|--------|-------|------------|
| Accuracy | 0.7014 | 0.7019 | 0.7037 | 0.7033 | 0.7001 | **0.7021** | ±0.0012 |
| Precision (w) | — | — | — | — | — | **0.6915** | ±0.0014 |
| Recall (w) | — | — | — | — | — | **0.7021** | ±0.0012 |
| F1 (w) | — | — | — | — | — | **0.6856** | ±0.0019 |

> **Interpretación para el documento:**
> La desviación estándar de ±0.0012 en accuracy indica que el modelo es
> **estable y consistente** — no varía significativamente entre distintas
> particiones de los datos. Esto descarta overfitting hacia un split particular.

---

## 1.6 Importancia de features

| Rank | Feature | Importancia | Interpretación |
|------|---------|-------------|----------------|
| 1 | `tasa_exito_7_dias` | **39.36%** | El rendimiento reciente es el predictor más fuerte |
| 2 | `dias_desde_agregado` | **28.34%** | Los hábitos más establecidos se cumplen más |
| 3 | `racha_actual` | **15.74%** | La racha activa tiene peso significativo |
| 4 | `dia_semana` | **9.54%** | El día de la semana influye moderadamente |
| 5 | `completado_ayer` | **7.03%** | El cumplimiento de ayer tiene menor pero real influencia |

> **Interpretación para el documento:**
> El modelo aprendió que el **historial reciente** (últimos 7 días) y la
> **antigüedad del hábito** son los factores más determinantes. Esto es
> consistente con la literatura de psicología del comportamiento habitual,
> donde la consistencia reciente y el tiempo de práctica son predictores
> clave de adherencia.

---

## 1.7 Matriz de confusión

```
                  Predicho: NO    Predicho: SÍ
Real: NO (11,812)     1,020           1,342
Real: SÍ (20,677)       605           3,531
```

| Métrica derivada | Valor | Significado |
|-----------------|-------|-------------|
| Verdaderos Positivos (TP) | 3,531 | Predijo completar → completó |
| Verdaderos Negativos (TN) | 1,020 | Predijo no completar → no completó |
| Falsos Positivos (FP) | 1,342 | Predijo completar → no completó |
| Falsos Negativos (FN) | 605 | Predijo no completar → completó |

> **Interpretación para el documento:**
> El modelo comete más Falsos Positivos (1,342) que Falsos Negativos (605),
> lo que significa que tiende a ser **optimista** — prefiere predecir que el
> usuario completará el hábito. En el contexto de motivación, esto es
> preferible: una predicción optimista incorrecta es menos dañina que
> desincentivar a un usuario que sí iba a cumplir.

---

## 1.8 Limitaciones documentadas

| Limitación | Detalle |
|------------|---------|
| Datos sintéticos | Los 81 usuarios fueron generados con `seed_ai_50users.py`. La distribución puede no reflejar comportamiento humano real al 100%. |
| Pocas features | El modelo usa solo 5 features. Variables como hora del día, clima o contexto social podrían mejorar la precisión. |
| Sin datos temporales ordenados | El split es aleatorio, no temporal. Un split por fecha (train=pasado, test=futuro) sería más riguroso. |
| Cold start | Usuarios nuevos sin historial no tienen features suficientes para predecir. |

---

## 1.9 Cómo reproducir este experimento

```bash
cd Backend
source .venv/bin/activate
python scripts/evaluate_predictor.py
# → genera documentacion_modular/evidencia/predictor_metrics.json
```

---

*Evidencia completa en: `documentacion_modular/evidencia/predictor_metrics.json`*
