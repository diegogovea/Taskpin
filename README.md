## Taskpin — Setup & Run (Backend + Frontend + PostgreSQL)

This repo contains:

- **Backend**: FastAPI + PostgreSQL (`Backend/`)
- **Frontend**: Expo / React Native (`Frontend/MATH.M1M/`)
- **Database schema/seed**: `taskpin.sql`

---

## Prerequisites

### System requirements

- **Python**: **3.10+** (recommended **3.11**)  
  - Reason: the backend dependencies include packages that require Python >= 3.10.
- **Node.js**: **>= 20** (Expo 53). En `Frontend/MATH.M1M` hay `.nvmrc` con `20` → `nvm use`.
- **PostgreSQL**: **14+**
- **Redis** (recomendado): caché de IA, Celery y mejor rendimiento; el backend puede arrancar sin Redis con funcionalidad degradada.

### macOS (Homebrew) quick install

```bash
brew update
brew install python@3.11 node@20 postgresql@14 redis
brew services start postgresql@14
```

---

## Arranque rápido (un solo comando)

Desde la raíz del repo (después de crear la DB y `Backend/.env`):

```bash
./scripts/dev.sh
```

Detener API + Metro/Expo en los puertos habituales:

```bash
./scripts/stop-dev.sh
```

Para apagar también Redis: `STOP_REDIS=1 ./scripts/stop-dev.sh`

Si tu `nvm` deja Node 12 por defecto, fuerza el binario de Homebrew:

```bash
export NODE_BINARY=/opt/homebrew/opt/node/bin/node
./scripts/dev.sh
```

Si el puerto 8081 está ocupado: `EXPO_PORT=8082 ./scripts/dev.sh`

---

## 1) Database setup (PostgreSQL)

La conexión sale de `Backend/.env` (ver `Backend/.env.example`) y `Backend/app/config.py`:

- database: `taskpin` (por defecto)
- user: `postgres` (por defecto)
- password: según `.env`
- host: `localhost`
- port: `5432` por defecto en código; **tu `.env` puede usar otro** (ej. `5433`)

Create the database and load the schema/seed:

```bash
psql postgres -c "ALTER USER postgres WITH PASSWORD '123456';"
psql postgres -c "CREATE DATABASE taskpin;"
psql -U postgres -d taskpin -f taskpin.sql
```

Notes:

- `taskpin.sql` includes `CREATE DATABASE taskpin;` so you may see `database "taskpin" already exists`. That’s fine.
- If your Postgres user/password or port differs, update `Backend/.env`.

---

## 2) Backend (FastAPI)

From the repo root:

```bash
cd Backend

# Create a virtualenv (recommended)
/opt/homebrew/bin/python3.11 -m venv .venv
source .venv/bin/activate

# Install deps
pip install -r requirements.txt

# Run API
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should be available at:

- `http://127.0.0.1:8000`

Quick checks:

```bash
curl http://127.0.0.1:8000/test
curl http://127.0.0.1:8000/test-habitos
```

---

## 3) Frontend (Expo)

**Node >= 20** (obligatorio para Expo 53). Comprueba con `node -v`.

```bash
cd Frontend/MATH.M1M
nvm use   # si usas nvm, respeta .nvmrc
npm ci
npx expo start
```

Then run on:

- **Expo Go (phone)**: scan the QR shown by Expo
- **iOS Simulator**: press `i` in the Expo terminal (requires Xcode)
- **Android emulator**: press `a` (requires Android Studio)
- **Web**: press `w`

If Expo warns about mismatched package versions, run:

```bash
npx expo install --fix
```

---

## Creating a user for login (optional)

If your `usuarios` table is empty, register a user:

```bash
curl -X POST http://127.0.0.1:8000/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Demo","correo":"demo@example.com","contraseña":"Demo12345"}'
```

Then login:

```bash
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"demo@example.com","contraseña":"Demo12345"}'
```

---

## FAQ / Common issues

### “Why do I see thousands of changed files?”

- `Backend/.venv/` and `Frontend/MATH.M1M/node_modules/` are **generated** dependency folders and can contain **many files**.
- They are required to run locally but **should not be committed**.

### Backend install fails on Python 3.9

- Use Python **3.10+** (recommended **3.11**) and recreate the venv.

### Postgres connection errors

- Ensure Postgres is running and the port matches `DATABASE_PORT` in `Backend/.env`
- Ensure DB `taskpin` exists and `taskpin.sql` was imported
- Ensure credentials in `Backend/.env` match your cluster

### Expo / `SyntaxError: Unexpected token '?'` al correr `npx expo`

- Estás usando **Node demasiado viejo** (p. ej. 12). Usa Node 20+ o `./scripts/dev.sh` con `NODE_BINARY` apuntando a un Node reciente.

### Puerto 8081 en uso

- Usa `EXPO_PORT=8082 npx expo start` o `./scripts/stop-dev.sh` y vuelve a intentar.
