from datetime import UTC, date, datetime, timedelta
from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

from app.schemas.integrations import Coordinates


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ProfileUpdate(InputModel):
    display_name: str = Field(min_length=1, max_length=80)
    women_only_eligible: bool = False


class RideRequestInput(InputModel):
    airport: str = Field(pattern=r"^[A-Z]{3}$")
    flight_number: str = Field(pattern=r"^[A-Z0-9]{2,3}[0-9]{1,4}$")
    flight_date: date
    ready_at: AwareDatetime
    max_wait_minutes: int = Field(ge=5, le=120)
    destination_name: str = Field(min_length=2, max_length=160)
    destination: Coordinates
    passengers: int = Field(ge=1, le=8)
    luggage: int = Field(ge=0, le=12)
    women_only: bool = False
    wheelchair_spaces: int = Field(default=0, ge=0, le=2)
    child_seats: int = Field(default=0, ge=0, le=4)
    pet_friendly: bool = False
    notes: str = Field(default="", max_length=2000)
    flight_details_confirmed: Literal[True]
    # One logical submission uses one client-generated UUID; retries are idempotent.
    client_request_id: str = Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    )

    @model_validator(mode="after")
    def validate_window(self) -> "RideRequestInput":
        now = datetime.now(UTC)
        if self.ready_at < now - timedelta(minutes=5) or self.ready_at > now + timedelta(days=30):
            raise ValueError("Ready time must be within the next 30 days")
        if abs((self.flight_date - self.ready_at.date()).days) > 1:
            raise ValueError("Flight date and ready time must describe the same arrival")
        if self.wheelchair_spaces > self.passengers or self.child_seats > self.passengers:
            raise ValueError("Required spaces cannot exceed party size")
        return self


class DriverInput(InputModel):
    licence_reference: str = Field(min_length=5, max_length=120)
    women_only_eligible: bool = False


class VehicleInput(InputModel):
    registration: str = Field(min_length=5, max_length=24, pattern=r"^[A-Z0-9 -]+$")
    seats: int = Field(ge=1, le=8)
    luggage_capacity: int = Field(ge=0, le=12)
    wheelchair_spaces: int = Field(default=0, ge=0, le=2)
    child_seats: int = Field(default=0, ge=0, le=4)
    pet_friendly: bool = False


class AvailabilityInput(InputModel):
    available: bool


class ApprovalInput(InputModel):
    approved: bool


class OfferInput(InputModel):
    vehicle_id: str


class TripStatusInput(InputModel):
    status: Literal["IN_PROGRESS", "COMPLETED"]
