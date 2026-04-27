#!/usr/bin/env bash
# Arranca Redis (si hace falta), backend FastAPI y Expo con Node >= 20.
# Uso: ./scripts/dev.sh
# Opcional: NODE_BINARY=/ruta/a/node ./scripts/dev.sh
# Opcional: EXPO_PORT=8081 BACKEND_PORT=8000 ./scripts/dev.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
EXPO_PORT="${EXPO_PORT:-8081}"

resolve_node() {
  if [[ -n "${NODE_BINARY:-}" && -x "${NODE_BINARY}" ]]; then
    echo "$NODE_BINARY"
    return 0
  fi
  for candidate in \
    "/opt/homebrew/opt/node/bin/node" \
    "/usr/local/opt/node/bin/node"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  if command -v node &>/dev/null; then
    command -v node
    return 0
  fi
  return 1
}

NODE_BIN="$(resolve_node || true)"
if [[ -z "${NODE_BIN:-}" ]]; then
  echo "Error: no se encontró Node.js. Instala Node 20+ o define NODE_BINARY."
  exit 1
fi

NODE_MAJOR="$("$NODE_BIN" -p "parseInt(process.versions.node, 10)" 2>/dev/null || echo 0)"
if [[ "${NODE_MAJOR:-0}" -lt 20 ]]; then
  echo "Error: Expo 53 requiere Node >= 20. Actual: $($NODE_BIN -v)"
  echo "  nvm install 20 && nvm use 20   # en Frontend/MATH.M1M hay .nvmrc con 20"
  echo "  o: export NODE_BINARY=/opt/homebrew/opt/node/bin/node"
  exit 1
fi

NODE_DIR="$(dirname "$NODE_BIN")"
export PATH="$NODE_DIR:$PATH"

if command -v redis-cli &>/dev/null; then
  if ! redis-cli ping &>/dev/null; then
    if command -v redis-server &>/dev/null; then
      echo "Iniciando Redis en segundo plano..."
      redis-server --daemonize yes
      sleep 0.4
    else
      echo "Aviso: Redis no responde y redis-server no está en PATH. El backend funcionará sin caché."
    fi
  fi
else
  echo "Aviso: redis-cli no encontrado. Omite inicio de Redis."
fi

cd "$ROOT/Backend"
if [[ ! -d .venv ]]; then
  echo "Creando venv en Backend/.venv ..."
  python3 -m venv .venv
fi
# shellcheck source=/dev/null
source .venv/bin/activate
pip install -q -r requirements.txt

cleanup() {
  if [[ -n "${UVICORN_PID:-}" ]] && kill -0 "$UVICORN_PID" 2>/dev/null; then
    kill "$UVICORN_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Backend: http://127.0.0.1:${BACKEND_PORT} (uvicorn)"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT" &
UVICORN_PID=$!
sleep 1

cd "$ROOT/Frontend/MATH.M1M"
echo "Frontend: Expo (Metro), puerto ${EXPO_PORT} (si está ocupado: EXPO_PORT=8082 $0)"
set +e
npx expo start --port "$EXPO_PORT"
expo_exit=$?
cleanup
trap - EXIT INT TERM
exit "$expo_exit"
