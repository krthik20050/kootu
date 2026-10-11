from datetime import UTC, date, datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def new_id() -> str:
    return str(uuid4())


def now() -> datetime:
    return datetime.now(UTC)


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    clerk_subject: Mapped[str] = mapped_column(String(255), unique=True)
    role: Mapped[str] = mapped_column(String(20), default="UNASSIGNED")
    display_name: Mapped[str] = mapped_column(String(80), default="")
    women_only_eligible: Mapped[bool] = mapped_column(Boolean, default=False)


class RideRequest(Base):
    __tablename__ = "passenger_requests"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    airport: Mapped[str] = mapped_column(String(3), index=True)
    flight_number: Mapped[str] = mapped_column(String(10))
    flight_date: Mapped[date] = mapped_column(Date)
    ready_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    baseline_ready_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    max_wait_minutes: Mapped[int] = mapped_column(Integer)
    destination_name: Mapped[str] = mapped_column(String(160))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    passengers: Mapped[int] = mapped_column(Integer)
    luggage: Mapped[int] = mapped_column(Integer)
    women_only: Mapped[bool] = mapped_column(Boolean, default=False)
    wheelchair_spaces: Mapped[int] = mapped_column(Integer, default=0)
    child_seats: Mapped[int] = mapped_column(Integer, default=0)
    pet_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="WAITING", index=True)
    flight_status: Mapped[str] = mapped_column(String(20), default="unverified")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    version: Mapped[int] = mapped_column(Integer, default=1)
    match_attempted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    flight_attempted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Driver(Base):
    __tablename__ = "drivers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), unique=True)
    licence_reference: Mapped[str] = mapped_column(String(120))
    verification_status: Mapped[str] = mapped_column(String(20), default="PENDING")
    available: Mapped[bool] = mapped_column(Boolean, default=False)
    women_only_eligible: Mapped[bool] = mapped_column(Boolean, default=False)


class Vehicle(Base):
    __tablename__ = "vehicles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    driver_id: Mapped[str] = mapped_column(ForeignKey("drivers.id"), index=True)
    registration: Mapped[str] = mapped_column(String(24), unique=True)
    seats: Mapped[int] = mapped_column(Integer)
    luggage_capacity: Mapped[int] = mapped_column(Integer)
    wheelchair_spaces: Mapped[int] = mapped_column(Integer, default=0)
    child_seats: Mapped[int] = mapped_column(Integer, default=0)
    pet_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    available: Mapped[bool] = mapped_column(Boolean, default=False)


class RideGroup(Base):
    __tablename__ = "ride_groups"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    airport: Mapped[str] = mapped_column(String(3))
    departure_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="PROPOSED")
    driver_id: Mapped[str | None] = mapped_column(ForeignKey("drivers.id"))
    vehicle_id: Mapped[str | None] = mapped_column(ForeignKey("vehicles.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    driver_latitude: Mapped[float | None] = mapped_column(Float)
    driver_longitude: Mapped[float | None] = mapped_column(Float)
    driver_accuracy_metres: Mapped[float | None] = mapped_column(Float)
    driver_location_captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    driver_location_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RideMember(Base):
    __tablename__ = "ride_members"
    request_id: Mapped[str] = mapped_column(ForeignKey("passenger_requests.id"), primary_key=True)
    group_id: Mapped[str] = mapped_column(ForeignKey("ride_groups.id"), index=True)


class DriverOffer(Base):
    __tablename__ = "driver_offers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    group_id: Mapped[str] = mapped_column(ForeignKey("ride_groups.id"), index=True)
    driver_id: Mapped[str] = mapped_column(ForeignKey("drivers.id"), index=True)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"))
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class TripEvent(Base):
    __tablename__ = "trip_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    group_id: Mapped[str] = mapped_column(ForeignKey("ride_groups.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
