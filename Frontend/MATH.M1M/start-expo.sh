#!/usr/bin/env bash
# Usa Node reciente (Homebrew) aunque tu PATH tenga nvm en Node 12.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
for candidate in \
  "/opt/homebrew/opt/node/bin/node" \
  "/usr/local/opt/node/bin/node"; do
  if [[ -x "$candidate" ]]; then
    export PATH="$(dirname "$candidate"):$PATH"
    break
  fi
done
NODE_MAJOR="$(node -p "parseInt(process.versions.node,10)")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "Se necesita Node >= 20. Ahora: $(node -v)"
  echo "Instala: brew install node@20   o   nvm install 20 && nvm use 20"
  exit 1
fi
cd "$ROOT"
if [[ ! -d node_modules ]]; then
  echo "Instalando dependencias (npm ci)..."
  npm ci
fi
exec npx expo start "$@"
