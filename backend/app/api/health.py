from importlib.metadata import version
from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: Literal["kootu-api"] = "kootu-api"
    version: str
    environment: Literal["development", "test", "production"]


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    """Process liveness only; does not claim database or provider readiness."""
    return HealthResponse(
        version=version("kootu-api"),
        environment=request.app.state.settings.app_env,
    )


@router.get("/ready")
def ready(request: Request) -> JSONResponse:
    settings = request.app.state.settings
    checks = {
        "database": False,
        "authentication": bool(settings.clerk_issuer),
        "routing": bool(
            settings.google_maps_api_key and settings.google_maps_api_key.get_secret_value()
        ),
        "ticket_extraction": bool(
            settings.groq_api_key
            and settings.groq_api_key.get_secret_value()
            and settings.groq_model
        ),
        "transcription": bool(
            settings.sarvam_api_key and settings.sarvam_api_key.get_secret_value()
        ),
        "flight_updates": bool(
            settings.aviationstack_api_key and settings.aviationstack_api_key.get_secret_value()
        ),
    }
    if request.app.state.engine is not None:
        try:
            with request.app.state.engine.connect() as connection:
                checks["database"] = (
                    connection.scalar(
                        text(
                            "SELECT bool_and(to_regclass(name) IS NOT NULL) "
                            "FROM unnest(ARRAY['public.profiles','public.passenger_requests',"
                            "'public.drivers','public.vehicles','public.ride_groups',"
                            "'public.ride_members','public.driver_offers','public.trip_events',"
                            "'public.provider_usage']) AS name"
                        )
                    )
                    is True
                )
        except Exception:
            pass
    configured = all(checks.values())
    return JSONResponse(
        status_code=200 if configured else 503,
        content={
            "configured": configured,
            "checks": checks,
            "provider_credentials_verified": False,
        },
    )
