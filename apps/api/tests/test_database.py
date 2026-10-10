from pathlib import Path

import pytest
from pydantic import SecretStr
from sqlalchemy import text

import migrate
from app.core.config import Settings


def test_rls_denies_browser_but_server_role_has_explicit_access(client):
    assert client.get("/me").status_code == 200
    with client.app.state.engine.begin() as connection:
        connection.exec_driver_sql("""
            DO $$ BEGIN
              IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kootu_test_browser') THEN
                CREATE ROLE kootu_test_browser NOLOGIN;
              END IF;
              IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kootu_test_server') THEN
                CREATE ROLE kootu_test_server NOLOGIN;
              END IF;
            END $$;
            GRANT USAGE ON SCHEMA public TO kootu_test_browser;
            GRANT SELECT ON profiles TO kootu_test_browser;
            SET LOCAL ROLE kootu_test_browser;
        """)
        assert connection.scalar(text("SELECT count(*) FROM profiles")) == 0
        connection.exec_driver_sql("RESET ROLE")
        guide = Path("../../docs/database.md").read_text(encoding="utf-8")
        sql = guide.split("```sql\n")[1].split("```")[0].replace("kootu_api", "kootu_test_server")
        connection.exec_driver_sql(sql, execution_options={"no_parameters": True})
        connection.exec_driver_sql("SET LOCAL ROLE kootu_test_server")
        assert connection.scalar(text("SELECT count(*) FROM profiles")) == 1


def test_migration_runner_is_idempotent_and_detects_changed_history(
    client, database_url, monkeypatch
):
    with client.app.state.engine.begin() as connection:
        connection.exec_driver_sql("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
    monkeypatch.setattr(
        migrate,
        "Settings",
        lambda: Settings(app_env="test", database_url=SecretStr(database_url), _env_file=None),
    )
    migrate.main()
    migrate.main()
    with client.app.state.engine.connect() as connection:
        assert connection.scalar(text("SELECT count(*) FROM kootu_migrations")) == 3
    monkeypatch.setattr(
        migrate.hashlib,
        "sha256",
        lambda data: type("Digest", (), {"hexdigest": lambda self: "changed"})(),
    )
    with pytest.raises(SystemExit, match="Applied migration was edited"):
        migrate.main()
    client.app.state.engine.dispose()
