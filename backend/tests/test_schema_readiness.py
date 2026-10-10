from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_session


def test_readiness_requires_arrival_integrity_index(client):
    assert client.get("/ready").json()["checks"]["database"]
    with client.app.state.engine.begin() as connection:
        connection.execute(text("ALTER INDEX one_active_arrival_booking RENAME TO hidden_index"))
    try:
        assert not client.get("/ready").json()["checks"]["database"]
    finally:
        with client.app.state.engine.begin() as connection:
            connection.execute(
                text("ALTER INDEX hidden_index RENAME TO one_active_arrival_booking")
            )


def test_database_lock_timeout_returns_retryable_conflict(client):
    @client.app.get("/test-lock-timeout")
    def lock(session: Session = Depends(get_session, scope="function")):
        session.execute(text("SET LOCAL lock_timeout='100ms'"))
        session.execute(text("SELECT pg_advisory_xact_lock(610110099)"))
        return {"ok": True}

    with client.app.state.engine.begin() as holder:
        holder.execute(text("SELECT pg_advisory_xact_lock(610110099)"))
        response = client.get("/test-lock-timeout")
    assert response.status_code == 409
    assert response.headers["Retry-After"] == "1"
    assert client.get("/test-lock-timeout").json() == {"ok": True}
