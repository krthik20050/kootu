from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    frontend_url: str = "http://localhost:3000"
    database_url: SecretStr | None = None
    clerk_issuer: str = ""
    clerk_audience: str = ""
    bootstrap_admin_subject: str = ""
    google_maps_api_key: SecretStr | None = None
    geoapify_api_key: SecretStr | None = None
    groq_api_key: SecretStr | None = None
    groq_model: str = "qwen/qwen3.8-27b"
    sarvam_api_key: SecretStr | None = None
    sarvam_model: str = "saaras:v3"
    aviationstack_api_key: SecretStr | None = None
    flight_poll_seconds: int = Field(default=900, ge=60, le=86400)
    cluster_radius_metres: int = Field(default=3000, ge=100, le=10000)
    max_group_seats: int = Field(default=6, ge=2, le=8)
    max_group_luggage: int = Field(default=6, ge=0, le=12)
    offer_ttl_seconds: int = Field(default=300, ge=30, le=1800)
    dispatch_horizon_minutes: int = Field(default=30, ge=5, le=120)

    @field_validator("frontend_url")
    @classmethod
    def validate_origin(cls, value: str) -> str:
        origin = urlsplit(value)
        if (
            origin.scheme not in {"http", "https"}
            or not origin.hostname
            or origin.username
            or origin.password
            or origin.path not in {"", "/"}
            or origin.query
            or origin.fragment
        ):
            raise ValueError("FRONTEND_URL must be a single HTTP(S) origin without credentials")
        return value.rstrip("/")

    @model_validator(mode="after")
    def validate_production_origin(self) -> "Settings":
        if self.app_env == "production" and urlsplit(self.frontend_url).scheme != "https":
            raise ValueError("Production requires an explicit HTTPS FRONTEND_URL")
        return self

    @field_validator("clerk_issuer")
    @classmethod
    def validate_issuer(cls, value: str) -> str:
        if not value:
            return value
        origin = urlsplit(value)
        if origin.scheme != "https" or not origin.hostname or origin.path not in {"", "/"}:
            raise ValueError("CLERK_ISSUER must be the trusted HTTPS Clerk instance origin")
        if origin.username or origin.password or origin.query or origin.fragment:
            raise ValueError("Invalid CLERK_ISSUER")
        return value.rstrip("/")
