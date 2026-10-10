"""Apply reviewed SQL migrations using a migration-owner DATABASE_URL."""

import hashlib
from pathlib import Path

from sqlalchemy import text

from app.core.config import Settings
from app.core.database import build_engine


def main() -> None:
    engine = build_engine(Settings())
    if engine is None:
        raise SystemExit("Configure the migration-owner DATABASE_URL first")
    with engine.begin() as connection:
        connection.execute(text("SELECT pg_advisory_xact_lock(610110002)"))
        connection.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS public.kootu_migrations "
            "(name text PRIMARY KEY, sha256 text NOT NULL)"
        )
        for path in sorted(
            (Path(__file__).resolve().parents[2] / "supabase/migrations").glob("*.sql")
        ):
            sql = path.read_text(encoding="utf-8")
            digest = hashlib.sha256(sql.encode()).hexdigest()
            previous = connection.scalar(
                text("SELECT sha256 FROM public.kootu_migrations WHERE name=:name"),
                {"name": path.name},
            )
            if previous:
                if previous != digest:
                    raise SystemExit(f"Applied migration was edited: {path.name}")
                continue
            connection.exec_driver_sql(sql)
            connection.execute(
                text("INSERT INTO public.kootu_migrations(name,sha256) VALUES (:name,:hash)"),
                {"name": path.name, "hash": digest},
            )
            print(f"Applied {path.name}")
    engine.dispose()


if __name__ == "__main__":
    main()
