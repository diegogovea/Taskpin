#!/usr/bin/env bash
# Detiene API Taskpin, Metro/Expo y procesos típicos de desarrollo.
# No apaga Redis por defecto (otros proyectos pueden usarlo). Opcional: STOP_REDIS=1

set -euo pipefail

for port in 8000 8081 8082 19000 19001; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "${pids:-}" ]]; then
    echo "Puerto $port: kill $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

pkill -f 'uvicorn app.main:app' 2>/dev/null || true
pkill -f '[e]xpo start' 2>/dev/null || true
pkill -f '@expo/cli' 2>/dev/null || true

if [[ "${STOP_REDIS:-0}" == "1" ]]; then
  redis-cli shutdown 2>/dev/null || true
  echo "Redis: shutdown solicitado."
fi

echo "Listo."
