import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress
from importlib.metadata import version

import httpx2 as httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from jwt import PyJWKClient
from starlette.middleware.cors import CORSMiddleware

from app.api import admin, drivers, integrations, passengers, rides
from app.api.health import router as health_router
from app.core.config import Settings
from app.core.database import build_engine
from app.services.flight_updates import polling_loop

logger = logging.getLogger("kootu.api")


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    logger.info("kootu API started environment=%s", application.state.settings.app_env)
    task = (
        asyncio.create_task(polling_loop(application))
        if application.state.engine is not None and application.state.settings.app_env != "test"
        else None
    )
    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
    if application.state.engine is not None:
        application.state.engine.dispose()
    logger.info("kootu API stopped")


async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    # Deliberately exclude rejected input and Pydantic context: future inputs may contain PII.
    errors = [{"location": list(item["loc"]), "type": item["type"]} for item in error.errors()]
    return JSONResponse(status_code=422, content={"detail": "Invalid request", "errors": errors})


async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
    # Do not log the exception message, request body, token, or query string.
    logger.error("Unhandled application error type=%s", type(error).__name__)
    response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
    # ServerErrorMiddleware sits outside CORSMiddleware. Preserve the same exact
    # origin policy so the browser can read unexpected failures instead of hiding them.
    origin = request.headers.get("origin")
    if origin == request.app.state.settings.frontend_url:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    return response


async def provider_error_handler(request: Request, error: httpx.RequestError) -> JSONResponse:
    return JSONResponse(
        status_code=502, content={"detail": "External service is unavailable; retry later"}
    )


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    application = FastAPI(
        title="kootu API",
        version=version("kootu-api"),
        description=(
            "Airport shared-cab coordination with verified sessions and persistent ride state."
        ),
        lifespan=lifespan,
    )
    application.state.settings = settings
    application.state.engine = build_engine(settings)
    application.state.jwks_client = (
        PyJWKClient(settings.clerk_issuer + "/.well-known/jwks.json", timeout=8)
        if settings.clerk_issuer
        else None
    )
    logging.getLogger("httpx2").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.add_exception_handler(Exception, unexpected_error_handler)
    application.add_exception_handler(httpx.RequestError, provider_error_handler)
    application.include_router(health_router)
    for router in (
        passengers.router,
        rides.router,
        drivers.router,
        admin.router,
        integrations.router,
    ):
        application.include_router(router)
    return application


app = create_app()
