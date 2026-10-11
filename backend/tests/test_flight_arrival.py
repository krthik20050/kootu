from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.api import integrations
from app.core.auth import Identity, verify_token
from app.core.config import Settings
from app.core.rate_limit import provider_budget
from app.main import create_app


def arrival_client(monkeypatch, data):
    def lookup(settings, number, flight_date, airport):
        assert (number, flight_date, airport) == ("AI123", date(2026, 10, 11), "COK")
        return data

    monkeypatch.setattr(integrations, "flight_status", lookup)
    app = create_app(Settings(app_env="test", _env_file=None))
    app.dependency_overrides[verify_token] = lambda: Identity("synthetic")
    app.dependency_overrides[provider_budget] = lambda: None
    return TestClient(app)


def test_lookup_uses_scheduled_baseline_to_avoid_double_applying_delay(monkeypatch):
    with arrival_client(
        monkeypatch,
        {
            "arrival": {
                "scheduled": "2026-10-11T10:00:00+05:30",
                "estimated": "2026-10-11T11:00:00+05:30",
            }
        },
    ) as client:
        response = client.get("/flights/arrival?number=AI123&flight_date=2026-10-11&airport=COK")
        assert response.status_code == 200
        assert response.json() == {"arrival_at": "2026-10-11T10:00:00+05:30"}


@pytest.mark.parametrize(
    "data,status",
    [
        (None, 404),
        ({"arrival": {}}, 502),
        ({"arrival": {"scheduled": "2026-10-11T10:00:00"}}, 502),
        ({"arrival": {"scheduled": "invalid"}}, 502),
        ({"flight_status": "cancelled"}, 409),
    ],
)
def test_unavailable_or_unsafe_arrival_never_becomes_a_guessed_time(monkeypatch, data, status):
    with arrival_client(monkeypatch, data) as client:
        response = client.get("/flights/arrival?number=AI123&flight_date=2026-10-11&airport=COK")
        assert response.status_code == status
        assert "arrival_at" not in response.json()


def test_flight_lookup_requires_authentication():
    with TestClient(create_app(Settings(app_env="test", _env_file=None))) as client:
        assert (
            client.get(
                "/flights/arrival?number=AI123&flight_date=2026-10-11&airport=COK"
            ).status_code
            == 401
        )
