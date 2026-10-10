import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app


def test_health_and_openapi_contract() -> None:
    with TestClient(create_app(Settings(app_env="test", _env_file=None))) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {
            "status": "ok",
            "service": "kootu-api",
            "version": "0.1.0",
            "environment": "test",
        }
        schema = client.get("/openapi.json").json()
        assert {"/health", "/ride-requests", "/tickets/extract", "/audio/transcribe"} <= set(
            schema["paths"]
        )
        assert schema["paths"]["/health"]["get"]["responses"]["200"]


def test_cors_allows_only_configured_origin() -> None:
    with TestClient(create_app(Settings(_env_file=None))) as client:
        headers = {"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"}
        allowed = client.options("/health", headers=headers)
        assert allowed.status_code == 200
        assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
        headers["Origin"] = "https://untrusted.example"
        denied = client.options("/health", headers=headers)
        assert denied.status_code == 400
        assert "access-control-allow-origin" not in denied.headers


@pytest.mark.parametrize(
    "origin", ["*", "https://user:password@example.com", "https://example.com/path"]
)
def test_invalid_cors_configuration_rejected(origin: str) -> None:
    with pytest.raises(ValidationError):
        Settings(frontend_url=origin, _env_file=None)


def test_production_requires_https_frontend() -> None:
    with pytest.raises(ValidationError):
        Settings(app_env="production", _env_file=None)
    settings = Settings(app_env="production", frontend_url="https://kootu.example", _env_file=None)
    assert settings.frontend_url == "https://kootu.example"
