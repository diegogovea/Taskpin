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
- **Node.js**: recommended **Node 20 LTS** (Expo generally targets Node LTS).
- **PostgreSQL**: **14+**

### macOS (Homebrew) quick install

```bash
brew update
brew install python@3.11 node postgresql@14
brew services start postgresql@14
```

---

## 1) Database setup (PostgreSQL)

The backend currently connects with hard-coded credentials in `Backend/app/model/userConnection.py`:

- database: `taskpin`
- user: `postgres`
- password: `123456`
- host: `localhost`
- port: `5432`

Create the database and load the schema/seed:

```bash
psql postgres -c "ALTER USER postgres WITH PASSWORD '123456';"
psql postgres -c "CREATE DATABASE taskpin;"
psql -U postgres -d taskpin -f taskpin.sql
```

Notes:

- `taskpin.sql` includes `CREATE DATABASE taskpin;` so you may see `database "taskpin" already exists`. That’s fine.
- If your Postgres user/password differs, update the connection string in `Backend/app/model/userConnection.py`.

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

```bash
cd Frontend/MATH.M1M
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

- Ensure Postgres is running and listening on `localhost:5432`
- Ensure DB `taskpin` exists and `taskpin.sql` was imported
- Ensure credentials match `Backend/app/model/userConnection.py`
