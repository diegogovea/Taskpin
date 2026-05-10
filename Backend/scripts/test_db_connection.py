#!/usr/bin/env python3
"""
Prueba rápida de conexión a PostgreSQL usando las mismas variables que el API.
Uso (desde la carpeta Backend):
  source .venv/bin/activate && python scripts/test_db_connection.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import DATABASE_HOST, DATABASE_NAME, DATABASE_SSLMODE, DATABASE_URL
import psycopg


def main() -> int:
    print(f"Host:     {DATABASE_HOST}")
    print(f"Database: {DATABASE_NAME}")
    print(f"SSL mode: {DATABASE_SSLMODE or '(ninguno — típico en local)'}")
    try:
        with psycopg.connect(DATABASE_URL, connect_timeout=20) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version()")
                version = cur.fetchone()[0]
                cur.execute(
                    "SELECT COUNT(*) FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
                )
                n_tables = cur.fetchone()[0]
                cur.execute(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name = 'usuarios')"
                )
                has_usuarios = cur.fetchone()[0]
        print("OK: conexión exitosa.")
        print(f"    PostgreSQL: {version.split(',')[0]}")
        print(f"    Tablas en public: {n_tables}")
        print(f"    Tabla 'usuarios': {'sí' if has_usuarios else 'no (revisa taskpin.sql en Neon)'}")
        return 0
    except Exception as e:
        print(f"ERROR: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
