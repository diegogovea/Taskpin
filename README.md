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

## Deploy backend (Render)

Si en los logs del build ves **`python3.14`** y falla **`pydantic_core` / Rust**, estás en el runtime **Python nativo** con una versión demasiado nueva. Hay que **bajar a Python 3.11** o usar **Docker**.

### Cómo saber qué estás usando

- **Nativo (malo con 3.14):** el log muestra `Running build command 'pip install -r requirements.txt'` y rutas como `.venv/bin/python3.14`.
- **Docker (recomendado):** el log muestra pasos tipo `docker build`, `FROM python:3.11`, etc.

### Opción A — Sin Docker (rápido)

1. Render → tu servicio → **Environment** (variables).
2. Añade **`PYTHON_VERSION`** = **`3.11.9`** (exactamente eso).
3. Confirma que el tipo de servicio sigue siendo **Web Service** con lenguaje **Python** (no hace falta Docker).
4. **Manual Deploy** → **Clear build cache & deploy**.

En el repo hay **`.python-version`** y **`runtime.txt`** en la raíz como refuerzo; lo que más suele funcionar es **`PYTHON_VERSION` en el panel**.

### Opción B — Docker (más fiable)

1. **Settings** → **Build & Deploy** → runtime **Docker** (no “Python 3”).
2. **Dockerfile path:** `Backend/Dockerfile`
3. **Docker build context:** `Backend`
4. Quita el **Start Command** de uvicorn del modo Python (el `Dockerfile` ya define el comando).
5. Deploy.

### Opción C — Blueprint desde cero

En la raíz está **`render.yaml`**: en Render puedes crear un **Blueprint** conectando el repo; creará el servicio ya en modo **Docker**. Si ya tienes otro servicio duplicado, borra el viejo o no uses el Blueprint y aplica la opción B a mano.

Mismas **Environment Variables** que en `Backend/.env` (Neon, JWT, etc.) en cualquier opción.

---

## Deploy frontend (web, sin depender de tu PC)

1. En **`Frontend/MATH.M1M/.env`** define **`EXPO_PUBLIC_API_URL`** con la URL **HTTPS** de tu API en Render (ej. `https://taskpin.onrender.com`). No pongas ahí credenciales de Postgres; solo lo público del API.
2. Desde `Frontend/MATH.M1M` (Node 20+):

```bash
npx expo export --platform web
```

3. Sube la carpeta de salida del export (suele ser **`dist/`**; revisa la salida de Expo) a **Netlify**, **Cloudflare Pages** o **Vercel** como sitio estático.
4. Abre la URL del hosting en el celular: la app cargará y llamará a Render.

### Sobre rangos IP tipo `74.220.48.0/24`

Eso lo suelen dar los hostings para **DNS** (registros **A** o **ANAME** de tu dominio), **no** van en `.env` ni en el código del front. Render/Neon no necesitan esas IPs para que Expo hable con tu API; solo las usarías si configuras un **dominio propio** apuntando al proveedor del front estático.

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
