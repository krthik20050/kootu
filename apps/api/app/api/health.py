from importlib.metadata import version
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: Literal["cootu-api"] = "cootu-api"
    version: str
    environment: Literal["development", "test", "production"]


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    """Process liveness only; does not claim database or provider readiness."""
    return HealthResponse(
        version=version("cootu-api"),
        environment=request.app.state.settings.app_env,
    )
