from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.integrations import Coordinates, ExtractedFlight


class ProfileResponse(BaseModel):
    id: str
    role: Literal["PASSENGER", "DRIVER", "ADMIN"]
    display_name: str
    women_only_eligible: bool


class RequestResponse(BaseModel):
    id: str
    airport: str
    flight_number: str
    flight_date: date
    ready_at: datetime
    max_wait_minutes: int
    destination_name: str
    destination: Coordinates
    passengers: int
    luggage: int
    women_only: bool
    wheelchair_spaces: int
    child_seats: int
    pet_friendly: bool
    notes: str
    status: Literal[
        "WAITING",
        "MATCHED",
        "ASSIGNED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "FLIGHT_CANCELLED",
    ]
    flight_status: str
    group_id: str | None


class ManifestResponse(RequestResponse):
    display_name: str


class VehicleResponse(BaseModel):
    id: str
    registration: str
    seats: int
    luggage_capacity: int
    wheelchair_spaces: int
    child_seats: int
    pet_friendly: bool
    approved: bool
    available: bool


class DriverResponse(BaseModel):
    id: str
    verification_status: Literal["PENDING", "APPROVED", "REJECTED"]
    available: bool
    women_only_eligible: bool


class EventResponse(BaseModel):
    kind: str
    created_at: datetime


class GroupResponse(BaseModel):
    id: str
    airport: str
    departure_at: datetime
    status: Literal["PROPOSED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    passengers: int
    luggage: int
    destination_cluster: str | None
    destination_area: Coordinates | None = None
    women_only: bool
    vehicle: VehicleResponse | None
    events: list[EventResponse]


class MatchResponse(BaseModel):
    matched: bool
    group: GroupResponse | None
    message: str | None = None


class OfferResponse(BaseModel):
    id: str
    group_id: str
    vehicle_id: str
    status: Literal["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"]
    expires_at: datetime
    airport: str
    departure_at: datetime
    passengers: int
    luggage: int
    wheelchair_spaces: int
    child_seats: int
    pet_friendly: bool
    destination_cluster: str | None
    destination_area: Coordinates | None = None


class AdminDriverResponse(DriverResponse):
    licence_reference: str
    profile_id: str


class AdminVehicleResponse(VehicleResponse):
    driver_id: str


class LocationResponse(BaseModel):
    name: str
    place_id: str
    coordinates: Coordinates


class TicketResponse(BaseModel):
    details: ExtractedFlight
    confirmation_required: Literal[True]


class TranscriptResponse(BaseModel):
    transcript: str
    language_code: str | None
    confirmation_required: Literal[True]
