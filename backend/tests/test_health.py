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


@pytest.mark.parametrize("method", ["PUT", "DELETE"])
def test_driver_location_cors_preflight_supports_updates_and_stop(method):
    with TestClient(create_app(Settings(_env_file=None))) as client:
        response = client.options(
            "/drivers/me/location",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": method,
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


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


@pytest.mark.parametrize(
    "origin,allowed", [("https://kootu.example", True), ("https://untrusted.example", False)]
)
def test_unexpected_upload_error_remains_readable_only_to_trusted_origin(origin, allowed):
    from app.api import integrations
    from app.core.auth import Identity, verify_token
    from app.core.rate_limit import provider_budget

    application = create_app(
        Settings(app_env="test", frontend_url="https://kootu.example", _env_file=None)
    )
    application.dependency_overrides[verify_token] = lambda: Identity("synthetic-test")
    application.dependency_overrides[provider_budget] = lambda: None
    original = integrations.extract_ticket

    def fail(*args):
        raise RuntimeError("PRIVATE DOCUMENT DETAILS")

    integrations.extract_ticket = fail
    try:
        with TestClient(application, raise_server_exceptions=False) as client:
            response = client.post(
                "/tickets/extract",
                files={"file": ("ticket.pdf", b"%PDF-synthetic", "application/pdf")},
                headers={"Origin": origin},
            )
        assert response.status_code == 500
        assert response.json() == {"detail": "Internal server error"}
        assert (response.headers.get("access-control-allow-origin") == origin) is allowed
        assert "PRIVATE" not in response.text
    finally:
        integrations.extract_ticket = original
