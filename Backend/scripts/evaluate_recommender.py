"""
Evaluación del Sistema de Recomendación de Hábitos — Taskpin
=============================================================
Protocolo: Leave-One-Out (LOO)
  - Para cada usuario, se oculta temporalmente 1 hábito que ya tiene.
  - Se pide al recomendador sus top-K sugerencias (sin usar la DB real, 
    operando sobre la matriz en memoria con ese hábito oculto).
  - Se mide si el hábito ocultado aparece en los top-K resultados.

Métricas calculadas:
  - Hit Rate @ K     : % de usuarios donde el hábito oculto aparece en top-K
  - Precision @ K    : proporción de recomendaciones top-K que son relevantes
  - Recall @ K       : proporción de hábitos relevantes recuperados en top-K
  - MRR              : Mean Reciprocal Rank (posición promedio del hábito oculto)
  - Cobertura        : % de hábitos del catálogo que el sistema recomienda alguna vez
  - Similitud coseno : estadísticas de similitud entre usuarios

Salida: documentacion_modular/evidencia/recommender_metrics.json
"""

import sys
import json
import time
from datetime import datetime
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np

from app.ai.feature_extractor import FeatureExtractor

OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "documentacion_modular" / "evidencia" / "recommender_metrics.json"
)

K_VALUES = [1, 3, 5, 10]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def get_recommendations_from_matrix(
    matrix: np.ndarray,
    user_ids: list,
    habit_ids: list,
    target_user_idx: int,
    top_n: int = 15,
    limit: int = 10,
) -> list:
    """
    Genera recomendaciones usando la matriz en memoria (no toca la DB).
    Permite pasar matrices modificadas (leave-one-out).
    """
    user_vec = matrix[target_user_idx]

    # Calcular similitud coseno con todos los demás usuarios
    sims = []
    for i in range(len(user_ids)):
        if i == target_user_idx:
            continue
        sim = cosine_similarity(user_vec, matrix[i])
        if sim > 0:
            sims.append((i, sim))

    sims.sort(key=lambda x: x[1], reverse=True)
    similar = sims[:top_n]

    if not similar:
        # Fallback: popularidad global
        habit_counts = matrix.sum(axis=0)
        has_habit = user_vec == 1
        candidates = [(j, float(habit_counts[j])) for j in range(len(habit_ids)) if not has_habit[j]]
        candidates.sort(key=lambda x: x[1], reverse=True)
        return [habit_ids[j] for j, _ in candidates[:limit]]

    # Hábitos que el usuario NO tiene en la versión modificada
    not_have = [j for j in range(len(habit_ids)) if user_vec[j] == 0]

    total_sim = len(similar)
    scores = {}
    for j in not_have:
        weighted = sum(sim for ui2, sim in similar if matrix[ui2, j] == 1)
        count    = sum(1   for ui2, _   in similar if matrix[ui2, j] == 1)
        if count > 0:
            scores[j] = weighted / total_sim

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [habit_ids[j] for j, _ in ranked[:limit]]


def main():
    print("=" * 60)
    print("Evaluación del Recomendador Taskpin — Leave-One-Out")
    print("=" * 60)

    # ── Cargar matriz real desde DB ──────────────────────────────
    print("\n[1/4] Cargando matriz usuario × hábito...")
    fe = FeatureExtractor()
    matrix, user_ids, habit_ids = fe.get_user_habit_matrix()
    n_users, n_habits = matrix.shape

    habits_per_user = matrix.sum(axis=1)
    print(f"   Usuarios: {n_users}  |  Hábitos en catálogo: {n_habits}")
    print(f"   Promedio hábitos por usuario: {habits_per_user.mean():.1f}")
    print(f"   Mínimo / Máximo hábitos por usuario: {int(habits_per_user.min())} / {int(habits_per_user.max())}")

    # ── Leave-One-Out ────────────────────────────────────────────
    print("\n[2/4] Ejecutando Leave-One-Out sobre usuarios elegibles...")

    # Solo usuarios con ≥2 hábitos (necesitan tener al menos 1 para ocultar y 1 para calcular similitudes)
    eligible = [i for i in range(n_users) if habits_per_user[i] >= 2]
    print(f"   Usuarios elegibles (≥2 hábitos): {len(eligible)}")

    # Por usuario y por K: registrar si el hábito oculto apareció y en qué posición
    hits = defaultdict(list)          # k -> [0|1, ...]
    reciprocal_ranks = []
    all_recommended_habits = set()
    t0 = time.perf_counter()

    for ui in eligible:
        # Hábitos que este usuario tiene
        user_habits = [j for j in range(n_habits) if matrix[ui, j] == 1]

        # Ocultar el último hábito (reproducible, sin aleatoriedad)
        hidden_habit_idx = user_habits[-1]
        hidden_habit_id  = habit_ids[hidden_habit_idx]

        # Crear copia de la matriz con ese hábito oculto para este usuario
        modified_matrix = matrix.copy()
        modified_matrix[ui, hidden_habit_idx] = 0

        # Pedir recomendaciones (top-10 para evaluar distintos K)
        recs = get_recommendations_from_matrix(
            modified_matrix, user_ids, habit_ids, ui, top_n=15, limit=10
        )

        # Registrar hábitos recomendados para cobertura
        all_recommended_habits.update(recs)

        # Calcular MRR: posición del hábito oculto en la lista
        rr = 0.0
        if hidden_habit_id in recs:
            pos = recs.index(hidden_habit_id) + 1  # 1-indexed
            rr = 1.0 / pos
        reciprocal_ranks.append(rr)

        # Hit @ K y Precision @ K
        for k in K_VALUES:
            top_k = recs[:k]
            hit = 1 if hidden_habit_id in top_k else 0
            hits[k].append(hit)

    elapsed = time.perf_counter() - t0

    # ── Calcular métricas ────────────────────────────────────────
    print("\n[3/4] Calculando métricas...")

    hit_rates   = {k: round(sum(hits[k]) / len(hits[k]), 4) for k in K_VALUES}
    precision_k = {k: round(sum(hits[k]) / (len(hits[k]) * k), 4) for k in K_VALUES}
    recall_k    = {k: round(sum(hits[k]) / len(hits[k]), 4) for k in K_VALUES}  # 1 item relevante
    mrr         = round(float(np.mean(reciprocal_ranks)), 4)
    coverage    = round(len(all_recommended_habits) / n_habits, 4)

    print(f"\n   Hit Rate @ K:")
    for k in K_VALUES:
        bar = "█" * int(hit_rates[k] * 30)
        print(f"     K={k:2d}: {hit_rates[k]:.4f}  {bar}")

    print(f"\n   Precision @ K:")
    for k in K_VALUES:
        print(f"     K={k:2d}: {precision_k[k]:.4f}")

    print(f"\n   MRR (Mean Reciprocal Rank): {mrr:.4f}")
    print(f"   Cobertura del catálogo    : {coverage:.4f}  ({len(all_recommended_habits)}/{n_habits} hábitos)")
    print(f"   Tiempo total evaluación   : {elapsed:.2f}s  ({elapsed/len(eligible)*1000:.1f} ms/usuario)")

    # ── Estadísticas de similitud ────────────────────────────────
    print("\n[4/4] Estadísticas de similitud entre usuarios...")
    all_sims = []
    for i in range(n_users):
        for j in range(i + 1, n_users):
            s = cosine_similarity(matrix[i], matrix[j])
            if s > 0:
                all_sims.append(s)

    sim_mean   = round(float(np.mean(all_sims)), 4)   if all_sims else 0
    sim_median = round(float(np.median(all_sims)), 4) if all_sims else 0
    sim_std    = round(float(np.std(all_sims)), 4)    if all_sims else 0
    sim_max    = round(float(np.max(all_sims)), 4)    if all_sims else 0
    pairs_with_sim = len(all_sims)
    total_pairs    = n_users * (n_users - 1) // 2

    print(f"   Pares con similitud > 0   : {pairs_with_sim}/{total_pairs}")
    print(f"   Similitud media           : {sim_mean}")
    print(f"   Similitud mediana         : {sim_median}")
    print(f"   Similitud máxima          : {sim_max}")
    print(f"   Desviación estándar       : {sim_std}")

    # ── Guardar JSON ─────────────────────────────────────────────
    resultado = {
        "metadata": {
            "generado_en": datetime.now().isoformat(),
            "script": "Backend/scripts/evaluate_recommender.py",
            "modelo": "Filtrado Colaborativo — Similitud Coseno",
            "protocolo_evaluacion": "Leave-One-Out (LOO)",
            "descripcion": "Se oculta 1 hábito por usuario y se mide si el sistema lo recomienda"
        },
        "datos": {
            "usuarios_totales": n_users,
            "habitos_en_catalogo": n_habits,
            "usuarios_elegibles_loo": len(eligible),
            "promedio_habitos_por_usuario": round(float(habits_per_user.mean()), 2),
            "min_habitos_por_usuario": int(habits_per_user.min()),
            "max_habitos_por_usuario": int(habits_per_user.max())
        },
        "metricas": {
            "hit_rate": {f"@{k}": hit_rates[k] for k in K_VALUES},
            "precision": {f"@{k}": precision_k[k] for k in K_VALUES},
            "recall": {f"@{k}": recall_k[k] for k in K_VALUES},
            "mrr": mrr,
            "cobertura_catalogo": coverage,
            "habitos_recomendados_distintos": len(all_recommended_habits),
            "habitos_totales_catalogo": n_habits
        },
        "similitud_coseno": {
            "pares_con_similitud_positiva": pairs_with_sim,
            "total_pares_posibles": total_pairs,
            "media": sim_mean,
            "mediana": sim_median,
            "maxima": sim_max,
            "desviacion_std": sim_std
        },
        "tiempos": {
            "evaluacion_total_segundos": round(elapsed, 3),
            "ms_por_usuario": round(elapsed / len(eligible) * 1000, 2)
        }
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Métricas guardadas en:\n   {OUTPUT_PATH}")
    print("=" * 60)

    return resultado


if __name__ == "__main__":
    main()
