from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import admin
from app.core.database import get_session
from app.models.domain import Driver, DriverOffer, Profile, Vehicle, now
from app.schemas.requests import ApprovalInput, OfferInput
from app.schemas.responses import (
    AdminDriverResponse,
    AdminVehicleResponse,
    DriverResponse,
    OfferResponse,
    VehicleResponse,
)
from app.services.rides import locked_group, vehicle_fits
from app.services.views import driver_view, group_members, offer_view, vehicle_view

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/drivers", response_model=list[AdminDriverResponse])
def pending_drivers(
    profile: Profile = Depends(admin), session: Session = Depends(get_session, scope="function")
) -> list[dict]:
    return [
        {
            **driver_view(row),
            "licence_reference": row.licence_reference,
            "profile_id": row.profile_id,
        }
        for row in session.scalars(select(Driver).order_by(Driver.id).limit(100))
    ]


@router.post("/drivers/{driver_id}/verification", response_model=DriverResponse)
def verify_driver(
    driver_id: str,
    body: ApprovalInput,
    profile: Profile = Depends(admin),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    driver = session.scalar(select(Driver).where(Driver.id == driver_id).with_for_update())
    if not driver:
        raise HTTPException(404, "Driver not found")
    if driver.profile_id == profile.id:
        raise HTTPException(403, "A different administrator must review your verification")
    from app.models.domain import RideGroup

    if session.scalar(
        select(RideGroup.id).where(
            RideGroup.driver_id == driver.id, RideGroup.status.in_(["ASSIGNED", "IN_PROGRESS"])
        )
    ):
        raise HTTPException(409, "Resolve the active ride before changing driver approval")
    driver.verification_status = "APPROVED" if body.approved else "REJECTED"
    if not body.approved:
        driver.available = False
    return driver_view(driver)


@router.get("/vehicles", response_model=list[AdminVehicleResponse])
def vehicles(
    profile: Profile = Depends(admin), session: Session = Depends(get_session, scope="function")
) -> list[dict]:
    return [
        {**vehicle_view(row), "driver_id": row.driver_id}
        for row in session.scalars(select(Vehicle).order_by(Vehicle.id).limit(100))
    ]


@router.post("/vehicles/{vehicle_id}/verification", response_model=VehicleResponse)
def verify_vehicle(
    vehicle_id: str,
    body: ApprovalInput,
    profile: Profile = Depends(admin),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    vehicle = session.scalar(select(Vehicle).where(Vehicle.id == vehicle_id).with_for_update())
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    driver = session.get(Driver, vehicle.driver_id)
    if driver.profile_id == profile.id:
        raise HTTPException(403, "A different administrator must review your vehicle")
    from app.models.domain import RideGroup

    if session.scalar(
        select(RideGroup.id).where(
            RideGroup.vehicle_id == vehicle.id, RideGroup.status.in_(["ASSIGNED", "IN_PROGRESS"])
        )
    ):
        raise HTTPException(409, "Resolve the active ride before changing vehicle approval")
    vehicle.approved = body.approved
    if not body.approved:
        vehicle.available = False
    return vehicle_view(vehicle)


@router.post("/ride-groups/{group_id}/offers", status_code=201, response_model=OfferResponse)
def send_offer(
    group_id: str,
    body: OfferInput,
    request: Request,
    profile: Profile = Depends(admin),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    group = locked_group(session, group_id)
    if group.status != "PROPOSED":
        raise HTTPException(409, "Only a proposed group can receive offers")
    vehicle = session.get(Vehicle, body.vehicle_id)
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    driver = session.get(Driver, vehicle.driver_id)
    if not vehicle_fits(vehicle, driver, group_members(session, group_id)):
        raise HTTPException(409, "This driver/vehicle does not meet the group's requirements")
    existing = session.scalar(
        select(DriverOffer).where(
            DriverOffer.group_id == group_id,
            DriverOffer.vehicle_id == vehicle.id,
            DriverOffer.status == "PENDING",
            DriverOffer.expires_at > now(),
        )
    )
    if existing:
        return offer_view(existing, session)
    offer = DriverOffer(
        group_id=group_id,
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        expires_at=now() + timedelta(seconds=request.app.state.settings.offer_ttl_seconds),
    )
    session.add(offer)
    session.flush()
    return offer_view(offer, session)
