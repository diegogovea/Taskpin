"""
Benchmark de Rendimiento — Taskpin API
=======================================
Mide latencia (p50, p95, p99, media) y throughput (RPS) de los
endpoints clave del sistema usando httpx con concurrencia.

Fases:
  1. Login + obtención de token
  2. Benchmark secuencial   (1 usuario, N repeticiones)
  3. Benchmark concurrente  (C usuarios simultáneos)

Salida: documentacion_modular/evidencia/benchmark_results.json
"""

import sys
import json
import time
import asyncio
import statistics
from datetime import datetime
from pathlib import Path
from typing import List, Dict

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    import httpx
except ImportError:
    print("Instala httpx: pip install httpx")
    sys.exit(1)

BASE_URL    = "http://127.0.0.1:8000"
TEST_USER   = {"correo": "demo@example.com", "contraseña": "Demo12345"}
TEST_USER_ID = 1
REPETITIONS  = 50      # muestras por endpoint (secuencial)
CONCURRENT   = 20      # usuarios simultáneos (carga)
OUTPUT_PATH  = (
    Path(__file__).resolve().parent.parent.parent
    / "documentacion_modular" / "evidencia" / "benchmark_results.json"
)


def percentile(data: list, p: float) -> float:
    if not data:
        return 0.0
    s = sorted(data)
    k = (p / 100) * (len(s) - 1)
    lo, hi = int(k), min(int(k) + 1, len(s) - 1)
    return round(s[lo] + (k - lo) * (s[hi] - s[lo]), 2)


def stats(ms_list: list) -> dict:
    if not ms_list:
        return {}
    return {
        "min_ms":    round(min(ms_list), 2),
        "max_ms":    round(max(ms_list), 2),
        "mean_ms":   round(statistics.mean(ms_list), 2),
        "median_ms": round(statistics.median(ms_list), 2),
        "p50_ms":    percentile(ms_list, 50),
        "p95_ms":    percentile(ms_list, 95),
        "p99_ms":    percentile(ms_list, 99),
        "samples":   len(ms_list),
    }


# ── 1. Login ──────────────────────────────────────────────────────
def get_token() -> str:
    t0 = time.perf_counter()
    r  = httpx.post(f"{BASE_URL}/login", json=TEST_USER, timeout=10)
    ms = (time.perf_counter() - t0) * 1000
    assert r.status_code == 200, f"Login falló: {r.text}"
    token = r.json()["access_token"]
    print(f"   Login OK  ({ms:.1f} ms)")
    return token


# ── 2. Benchmark secuencial ───────────────────────────────────────
def bench_sequential(token: str) -> Dict[str, dict]:
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        ("GET /test",                      "GET",  f"{BASE_URL}/test",                                           None),
        ("POST /login",                    "POST", f"{BASE_URL}/login",                                          TEST_USER),
        ("GET /api/current-user",          "GET",  f"{BASE_URL}/api/current-user",                               None),
        ("GET /habitos/hoy",               "GET",  f"{BASE_URL}/api/usuario/{TEST_USER_ID}/habitos/hoy",         None),
        ("GET /estadisticas",              "GET",  f"{BASE_URL}/api/usuario/{TEST_USER_ID}/estadisticas",        None),
        ("GET /ai/predicciones",           "GET",  f"{BASE_URL}/api/ai/usuario/{TEST_USER_ID}/predicciones/hoy", None),
        ("GET /ai/recomendaciones",        "GET",  f"{BASE_URL}/api/ai/usuario/{TEST_USER_ID}/recomendaciones",  None),
        ("GET /api/system/health",         "GET",  f"{BASE_URL}/api/system/health",                              None),
        ("GET /api/system/redis/status",   "GET",  f"{BASE_URL}/api/system/redis/status",                        None),
    ]

    results = {}
    print(f"\n   {'Endpoint':<35} {'p50':>7} {'p95':>7} {'p99':>7} {'mean':>7} ms")
    print("   " + "-" * 65)

    for label, method, url, body in endpoints:
        ms_list = []
        status_ok = 0
        for _ in range(REPETITIONS):
            t0 = time.perf_counter()
            try:
                if method == "POST":
                    r = httpx.post(url, json=body, timeout=15)
                else:
                    r = httpx.get(url, headers=headers, timeout=15)
                ms = (time.perf_counter() - t0) * 1000
                ms_list.append(ms)
                if r.status_code in (200, 201):
                    status_ok += 1
            except Exception:
                pass

        s = stats(ms_list)
        s["success_rate"] = round(status_ok / REPETITIONS * 100, 1)
        results[label] = s
        print(f"   {label:<35} {s['p50_ms']:>7} {s['p95_ms']:>7} {s['p99_ms']:>7} {s['mean_ms']:>7}")

    return results


# ── 3. Benchmark concurrente (carga) ─────────────────────────────
async def single_request(client: httpx.AsyncClient, url: str, headers: dict) -> float:
    t0 = time.perf_counter()
    try:
        r = await client.get(url, headers=headers, timeout=30)
        return (time.perf_counter() - t0) * 1000
    except Exception:
        return -1.0


async def bench_concurrent(token: str, endpoint_label: str, url: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # Warmup
        await client.get(url, headers=headers)

        # Ráfaga de CONCURRENT requests simultáneas
        t_start = time.perf_counter()
        tasks   = [single_request(client, url, headers) for _ in range(CONCURRENT)]
        results = await asyncio.gather(*tasks)
        elapsed = time.perf_counter() - t_start

    ms_list = [r for r in results if r >= 0]
    errors  = len(results) - len(ms_list)
    rps     = round(len(ms_list) / elapsed, 1)

    return {
        "endpoint":    endpoint_label,
        "concurrent":  CONCURRENT,
        "rps":         rps,
        "errors":      errors,
        "latency":     stats(ms_list),
        "total_time_s": round(elapsed, 3),
    }


# ── main ──────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("Benchmark de Rendimiento — Taskpin API")
    print(f"Repeticiones secuenciales: {REPETITIONS}")
    print(f"Usuarios concurrentes    : {CONCURRENT}")
    print("=" * 60)

    print("\n[1/3] Autenticación...")
    token = get_token()

    print(f"\n[2/3] Benchmark secuencial ({REPETITIONS} muestras por endpoint)...")
    seq = bench_sequential(token)

    print(f"\n[3/3] Benchmark concurrente ({CONCURRENT} usuarios simultáneos)...")
    endpoints_carga = [
        ("GET /test",             f"{BASE_URL}/test"),
        ("GET /habitos/hoy",      f"{BASE_URL}/api/usuario/{TEST_USER_ID}/habitos/hoy"),
        ("GET /ai/predicciones",  f"{BASE_URL}/api/ai/usuario/{TEST_USER_ID}/predicciones/hoy"),
        ("GET /ai/recomendaciones", f"{BASE_URL}/api/ai/usuario/{TEST_USER_ID}/recomendaciones"),
        ("GET /api/system/health", f"{BASE_URL}/api/system/health"),
    ]

    concurrent_results = []
    for label, url in endpoints_carga:
        res = asyncio.run(bench_concurrent(token, label, url))
        concurrent_results.append(res)
        lat = res["latency"]
        print(f"   {label:<35} {res['rps']:>6} RPS  p95={lat.get('p95_ms','?')} ms  err={res['errors']}")

    # ── Guardar ──────────────────────────────────────────────────
    output = {
        "metadata": {
            "generado_en":   datetime.now().isoformat(),
            "script":        "Backend/scripts/benchmark.py",
            "base_url":      BASE_URL,
            "repeticiones":  REPETITIONS,
            "concurrentes":  CONCURRENT,
        },
        "benchmark_secuencial": seq,
        "benchmark_concurrente": concurrent_results,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Resultados guardados en:\n   {OUTPUT_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
