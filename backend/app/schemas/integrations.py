from datetime import date

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class RouteEstimate(BaseModel):
    distance_metres: float = Field(ge=0, allow_inf_nan=False)
    duration_seconds: float = Field(ge=0, allow_inf_nan=False)


class ExtractedFlight(BaseModel):
    """Unconfirmed suggestions only. Excludes ticket numbers, names and document contents."""

    flight_number: str | None = Field(default=None, pattern=r"^[A-Z0-9]{2,3}[0-9]{1,4}$")
    flight_date: date | None = None
    arrival_airport: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
