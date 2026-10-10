from typing import Literal
from urllib.parse import urlsplit

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    frontend_url: str = "http://localhost:3000"

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
