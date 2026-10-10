import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib.metadata import version

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.core.config import Settings

logger = logging.getLogger("cootu.api")


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    logger.info("COOTU API started environment=%s", application.state.settings.app_env)
    yield
    logger.info("COOTU API stopped")


async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    # Deliberately exclude rejected input and Pydantic context: future inputs may contain PII.
    errors = [{"location": list(item["loc"]), "type": item["type"]} for item in error.errors()]
    return JSONResponse(status_code=422, content={"detail": "Invalid request", "errors": errors})


async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
    # Do not log the exception message, request body, token, or query string.
    logger.error("Unhandled application error type=%s", type(error).__name__)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    application = FastAPI(
        title="COOTU API",
        version=version("cootu-api"),
        description="Airport shared-cab coordination. Bootstrap exposes liveness only.",
        lifespan=lifespan,
    )
    application.state.settings = settings
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Authorization", "Content-Type"],
    )
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.add_exception_handler(Exception, unexpected_error_handler)
    application.include_router(health_router)
    return application


app = create_app()
