"""
Evaluación Completa del Predictor de Hábitos — Taskpin
=======================================================
Genera métricas exhaustivas del modelo Random Forest:
  - Accuracy, Precision, Recall, F1 (macro y weighted)
  - Matriz de confusión
  - Validación cruzada 5-fold (media ± desviación)
  - Importancia de features
  - Tiempo de inferencia

Salida: documentacion_modular/evidencia/predictor_metrics.json
"""

import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path

# Ajustar path para importar desde app/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)

from app.ai.feature_extractor import FeatureExtractor
from app.ai.predictor import HabitPredictor

OUTPUT_PATH = Path(__file__).resolve().parent.parent.parent \
    / "documentacion_modular" / "evidencia" / "predictor_metrics.json"

FEATURE_NAMES = ['dia_semana', 'racha_actual', 'tasa_exito_7_dias',
                 'completado_ayer', 'dias_desde_agregado']


def main():
    print("=" * 60)
    print("Evaluación del Predictor Taskpin — Random Forest")
    print("=" * 60)

    # ── 1. Cargar datos ──────────────────────────────────────────
    print("\n[1/5] Cargando datos de entrenamiento...")
    fe = FeatureExtractor()
    X, y = fe.get_training_data_for_predictor(min_records=50)
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    total     = len(X)
    positivos = int(y.sum())
    negativos = total - positivos
    balance   = round(positivos / total * 100, 2)

    print(f"   Total registros  : {total:,}")
    print(f"   Positivos        : {positivos:,}  ({balance}%)")
    print(f"   Negativos        : {negativos:,}  ({100 - balance}%)")

    # ── 2. Train / Test split ────────────────────────────────────
    print("\n[2/5] Dividiendo en train (80%) / test (20%) con estratificación...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train: {len(X_train):,}   Test: {len(X_test):,}")

    # ── 3. Entrenamiento ─────────────────────────────────────────
    print("\n[3/5] Entrenando modelo Random Forest...")
    model = RandomForestClassifier(
        n_estimators=100, max_depth=10,
        min_samples_split=5, min_samples_leaf=2,
        random_state=42, n_jobs=-1
    )
    t0 = time.perf_counter()
    model.fit(X_train, y_train)
    train_time = round(time.perf_counter() - t0, 3)
    print(f"   Tiempo de entrenamiento: {train_time}s")

    # ── 4. Métricas en test set ──────────────────────────────────
    print("\n[4/5] Calculando métricas en conjunto de test...")
    y_pred      = model.predict(X_test)
    y_proba     = model.predict_proba(X_test)[:, 1]

    accuracy    = round(float(accuracy_score(y_test, y_pred)), 4)
    precision_m = round(float(precision_score(y_test, y_pred, average='macro')), 4)
    recall_m    = round(float(recall_score(y_test, y_pred, average='macro')), 4)
    f1_m        = round(float(f1_score(y_test, y_pred, average='macro')), 4)
    precision_w = round(float(precision_score(y_test, y_pred, average='weighted')), 4)
    recall_w    = round(float(recall_score(y_test, y_pred, average='weighted')), 4)
    f1_w        = round(float(f1_score(y_test, y_pred, average='weighted')), 4)
    auc_roc     = round(float(roc_auc_score(y_test, y_proba)), 4)

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # Tiempo de inferencia (promedio por muestra)
    t0 = time.perf_counter()
    model.predict_proba(X_test)
    infer_ms = round((time.perf_counter() - t0) / len(X_test) * 1000, 4)

    print(f"   Accuracy  : {accuracy}")
    print(f"   Precision : {precision_w} (weighted) | {precision_m} (macro)")
    print(f"   Recall    : {recall_w} (weighted) | {recall_m} (macro)")
    print(f"   F1        : {f1_w} (weighted) | {f1_m} (macro)")
    print(f"   AUC-ROC   : {auc_roc}")
    print(f"   Inferencia: {infer_ms} ms/muestra")
    print(f"\n   Matriz de Confusión:")
    print(f"             Pred 0   Pred 1")
    print(f"   Real 0:    {tn:5}    {fp:5}   (TN, FP)")
    print(f"   Real 1:    {fn:5}    {tp:5}   (FN, TP)")

    # ── 5. Validación cruzada 5-fold ─────────────────────────────
    print("\n[5/5] Validación cruzada estratificada 5-fold (sobre datos completos)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = cross_validate(
        RandomForestClassifier(
            n_estimators=100, max_depth=10,
            min_samples_split=5, min_samples_leaf=2,
            random_state=42, n_jobs=-1
        ),
        X, y, cv=cv,
        scoring=['accuracy', 'precision_weighted', 'recall_weighted', 'f1_weighted'],
        return_train_score=False
    )

    cv_metrics = {}
    for metric in ['accuracy', 'precision_weighted', 'recall_weighted', 'f1_weighted']:
        key = f"test_{metric}"
        scores = cv_results[key]
        cv_metrics[metric] = {
            "scores_por_fold": [round(float(s), 4) for s in scores],
            "media":           round(float(scores.mean()), 4),
            "desviacion":      round(float(scores.std()), 4)
        }
        print(f"   {metric:22}: {scores.mean():.4f} ± {scores.std():.4f}")

    # Feature importance
    importances = dict(zip(FEATURE_NAMES, model.feature_importances_))
    importances_sorted = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    print("\n   Importancia de features (mayor → menor):")
    for name, imp in importances_sorted:
        bar = "█" * int(imp * 40)
        print(f"   {name:25}: {imp:.4f}  {bar}")

    # ── Guardar JSON ─────────────────────────────────────────────
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    resultado = {
        "metadata": {
            "generado_en": datetime.now().isoformat(),
            "script": "Backend/scripts/evaluate_predictor.py",
            "modelo": "Random Forest Classifier (scikit-learn)",
            "random_state": 42
        },
        "datos": {
            "total_registros": total,
            "positivos": positivos,
            "negativos": negativos,
            "balance_positivos_pct": balance,
            "usuarios": 81,
            "habitos_en_catalogo": 25
        },
        "split": {
            "metodo": "train_test_split estratificado",
            "train_pct": 80,
            "test_pct": 20,
            "train_registros": int(len(X_train)),
            "test_registros": int(len(X_test))
        },
        "metricas_test_set": {
            "accuracy": accuracy,
            "precision_weighted": precision_w,
            "precision_macro": precision_m,
            "recall_weighted": recall_w,
            "recall_macro": recall_m,
            "f1_weighted": f1_w,
            "f1_macro": f1_m,
            "auc_roc": auc_roc
        },
        "matriz_confusion": {
            "verdaderos_negativos": int(tn),
            "falsos_positivos": int(fp),
            "falsos_negativos": int(fn),
            "verdaderos_positivos": int(tp),
            "tabla": [[int(tn), int(fp)], [int(fn), int(tp)]]
        },
        "validacion_cruzada_5fold": cv_metrics,
        "feature_importance": {
            k: round(float(v), 4) for k, v in importances.items()
        },
        "tiempos": {
            "entrenamiento_segundos": train_time,
            "inferencia_ms_por_muestra": infer_ms
        }
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Métricas guardadas en:\n   {OUTPUT_PATH}")
    print("=" * 60)

    return resultado


if __name__ == "__main__":
    main()
