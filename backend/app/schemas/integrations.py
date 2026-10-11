from datetime import date

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class RouteEstimate(BaseModel):
    distance_metres: float = Field(ge=0, allow_inf_nan=False)
    duration_seconds: float = Field(ge=0, allow_inf_nan=False)


class ExtractedFlight(BaseModel):
    """Unconfirmed ticket details, returned for review without storing the document."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    flight_number: str | None = Field(default=None, pattern=r"^[A-Z0-9]{2,3}[0-9]{1,4}$")
    flight_date: date | None = None
    arrival_airport: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    passengers: int | None = Field(default=None, ge=1, le=8, strict=True)
    arrival_at: AwareDatetime | None = None
    luggage: int | None = Field(default=None, ge=0, le=12, strict=True)
    destination_name: str | None = Field(default=None, min_length=3, max_length=160)
    airline: str | None = Field(default=None, min_length=1, max_length=80)
    departure_airport: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    departure_at: AwareDatetime | None = None
    boarding_at: AwareDatetime | None = None
    seat: str | None = Field(default=None, min_length=1, max_length=20)
    gate: str | None = Field(default=None, min_length=1, max_length=20)
    departure_terminal: str | None = Field(default=None, min_length=1, max_length=40)
    arrival_terminal: str | None = Field(default=None, min_length=1, max_length=40)
    cabin: str | None = Field(default=None, min_length=1, max_length=40)
    baggage_allowance: str | None = Field(default=None, min_length=1, max_length=80)
    booking_reference: str | None = Field(default=None, min_length=1, max_length=30)
    ticket_number: str | None = Field(default=None, min_length=1, max_length=40)
