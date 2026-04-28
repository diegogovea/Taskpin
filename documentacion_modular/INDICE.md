# Índice — Documentación Modular Taskpin

> Generado: 27 de Abril, 2026  
> Responsable técnico: Diego  
> Responsable redacción: [nombre compañero]

---

## Estado general

| Fase | Archivo | Estado | Evidencia JSON |
|------|---------|--------|----------------|
| Fase 0 | `FASE_0_inventario.md` | ✅ Lista | — |
| Fase 1 | `FASE_1_predictor_ia.md` | ✅ Lista | `evidencia/predictor_metrics.json` |
| Fase 2 | `FASE_2_recomendador_ia.md` | ✅ Lista | `evidencia/recommender_metrics.json` |
| Fase 3 | `FASE_3_rendimiento.md` | ✅ Lista | `evidencia/benchmark_results.json` |
| Fase 4 | `FASE_4_resiliencia.md` | ✅ Lista | `evidencia/resilience_results.json` |
| Fase 5 | `FASE_5_arquitectura.md` | ✅ Lista | — (diagramas) |
| Fase 6 | `FASE_6_comparativa.md` | ✅ Lista | — (tablas) |
| Fase 7 | `FASE_7_evaluacion_usuarios.md` | ⏳ Pendiente aplicar | — (formulario) |

---

## Mapa de observaciones → fases

| Observación del comité | Fase(s) que la responde |
|------------------------|------------------------|
| Métricas o evidencia cuantitativa del sistema e IA | Fase 1, Fase 2, Fase 3 |
| Validación del modelo IA (entrenamiento, métricas, CV) | **Fase 1** |
| Comparar con alternativas | **Fase 6** |
| Detalle de implementación e interacción de componentes | **Fase 5** |
| Evidencia concreta de latencia, fallos, seguridad | Fase 3, Fase 4 |
| Manejo de errores, tolerancia a fallos y riesgos | **Fase 4** |
| Evaluación con usuarios reales | **Fase 7** |
| Respaldo cuantitativo de recomendaciones y predicciones | Fase 1, Fase 2, Fase 3 |

---

## Números clave (para mencionar en introducción del documento)

| Dato | Valor |
|------|-------|
| Líneas de código total | ~29,500 |
| Registros de entrenamiento | 32,489 |
| Usuarios seed en DB | 81 |
| Endpoints REST | 50+ |
| Accuracy predictor (test set) | 70.04% |
| F1-Score predictor (weighted) | 68.49% |
| AUC-ROC predictor | 74.09% |
| CV 5-fold accuracy | 70.21% ± 0.12% |
| Hit Rate recomendador @10 | 48.05% |
| Cobertura catálogo recomendador | 100% |
| Latencia endpoints datos (p50) | 5–8 ms |
| RPS máximo bajo carga | 945 RPS |
| Errores bajo 20 usuarios concurrentes | 0 |
| Mejora por caché Redis | 5–16× |
| Tests de resiliencia pasados | 13/13 |
| Bugs encontrados y corregidos | 1 (500→401 en /api/current-user) |

---

## Cómo reproducir todos los experimentos

```bash
cd /Users/dgovea/Documents/Taskpin/Backend
source .venv/bin/activate

# Fase 1 — Métricas del predictor
python scripts/evaluate_predictor.py

# Fase 2 — Métricas del recomendador
python scripts/evaluate_recommender.py

# Fase 3 — Benchmark (backend debe estar corriendo en :8000)
python scripts/benchmark.py

# Fase 4 — Resiliencia (backend debe estar corriendo en :8000)
python scripts/test_resilience.py
```

Todos los resultados se guardan en `documentacion_modular/evidencia/`.

---

## Orden de lectura sugerido para el documento final

1. **Descripción del sistema** → Fase 0 (inventario, stack, datos)
2. **Arquitectura e implementación** → Fase 5 (diagramas, flujos)
3. **Componente IA — Predictor** → Fase 1 (entrenamiento, métricas)
4. **Componente IA — Recomendador** → Fase 2 (LOO, hit-rate)
5. **Evaluación de rendimiento** → Fase 3 (latencias, carga)
6. **Tolerancia a fallos y seguridad** → Fase 4 (resiliencia, riesgos)
7. **Comparativa con alternativas** → Fase 6 (tablas de decisión)
8. **Evaluación con usuarios** → Fase 7 (formulario + resultados)

---

## Estructura de archivos generados

```
documentacion_modular/
├── INDICE.md                        ← Este archivo
├── FASE_0_inventario.md
├── FASE_1_predictor_ia.md
├── FASE_2_recomendador_ia.md
├── FASE_3_rendimiento.md
├── FASE_4_resiliencia.md
├── FASE_5_arquitectura.md
├── FASE_6_comparativa.md
├── FASE_7_evaluacion_usuarios.md
└── evidencia/
    ├── predictor_metrics.json
    ├── recommender_metrics.json
    ├── benchmark_results.json
    └── resilience_results.json

Backend/scripts/  (scripts que generan la evidencia)
    ├── evaluate_predictor.py
    ├── evaluate_recommender.py
    ├── benchmark.py
    └── test_resilience.py
```
