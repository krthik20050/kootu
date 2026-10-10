import os
from pathlib import Path

import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.core.auth import Identity, verify_token
from app.core.config import Settings
from app.main import create_app


@pytest.fixture(scope="session")
def database_url():
    value = os.getenv("TEST_DATABASE_URL")
    if not value and Path(".env.test").exists():
        from dotenv import dotenv_values

        value = dotenv_values(".env.test").get("TEST_DATABASE_URL")
    if not value:
        pytest.skip("Set TEST_DATABASE_URL to a disposable PostgreSQL/PostGIS test database")
    if "test" not in (make_url(value).database or "").lower():
        pytest.fail("Refusing destructive tests against a database whose name lacks 'test'")
    engine = create_engine(value)
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        for path in sorted(Path("../../supabase/migrations").glob("*.sql")):
            connection.exec_driver_sql(path.read_text())
    engine.dispose()
    return value


@pytest.fixture
def client(database_url):
    application = create_app(
        Settings(
            app_env="test",
            database_url=SecretStr(database_url),
            bootstrap_admin_subject="operator",
            _env_file=None,
        )
    )

    def identity(request: Request):
        return Identity(request.headers.get("X-Test-Subject", "alice"))

    application.dependency_overrides[verify_token] = identity
    with application.state.engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE profiles, drivers, vehicles, passenger_requests, "
                "ride_groups, ride_members, driver_offers, trip_events, provider_usage CASCADE"
            )
        )
    with TestClient(application) as test_client:
        yield test_client
