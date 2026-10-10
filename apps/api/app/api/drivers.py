from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import current_profile
from app.core.database import get_session
from app.models.domain import Driver, DriverOffer, Profile, Vehicle
from app.schemas.requests import AvailabilityInput, DriverInput, VehicleInput
from app.schemas.responses import DriverResponse, GroupResponse, OfferResponse, VehicleResponse
from app.services.rides import accept_offer
from app.services.views import driver_view, group_view, offer_view, vehicle_view

router = APIRouter(tags=["drivers"])


def owned_driver(session: Session, profile: Profile) -> Driver:
    driver = session.scalar(select(Driver).where(Driver.profile_id == profile.id))
    if not driver:
        raise HTTPException(404, "Complete driver onboarding first")
    return driver


@router.post("/drivers", status_code=201, response_model=DriverResponse)
def onboard(
    body: DriverInput,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    existing = session.scalar(select(Driver).where(Driver.profile_id == profile.id))
    if existing:
        return driver_view(existing)
    driver = Driver(profile_id=profile.id, **body.model_dump())
    session.add(driver)
    if profile.role != "ADMIN":
        profile.role = "DRIVER"
    session.flush()
    return driver_view(driver)


@router.get("/drivers/me", response_model=DriverResponse)
def my_driver(
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    return driver_view(owned_driver(session, profile))


@router.patch("/drivers/me/availability", response_model=DriverResponse)
def availability(
    body: AvailabilityInput,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    driver = owned_driver(session, profile)
    driver = session.scalar(select(Driver).where(Driver.id == driver.id).with_for_update())
    if driver.verification_status != "APPROVED":
        raise HTTPException(403, "Driver approval is required")
    from app.models.domain import RideGroup

    if session.scalar(
        select(RideGroup.id).where(
            RideGroup.driver_id == driver.id, RideGroup.status.in_(["ASSIGNED", "IN_PROGRESS"])
        )
    ):
        raise HTTPException(409, "Finish the assigned trip before changing availability")
    driver.available = body.available
    return driver_view(driver)


@router.post("/vehicles", status_code=201, response_model=VehicleResponse)
def create_vehicle(
    body: VehicleInput,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    driver = owned_driver(session, profile)
    vehicle = Vehicle(driver_id=driver.id, **body.model_dump())
    session.add(vehicle)
    session.flush()
    return vehicle_view(vehicle)


@router.get("/vehicles", response_model=list[VehicleResponse])
def list_vehicles(
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> list[dict]:
    driver = owned_driver(session, profile)
    return [
        vehicle_view(row)
        for row in session.scalars(select(Vehicle).where(Vehicle.driver_id == driver.id).limit(20))
    ]


@router.patch("/vehicles/{vehicle_id}/availability", response_model=VehicleResponse)
def vehicle_availability(
    vehicle_id: str,
    body: AvailabilityInput,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    driver = owned_driver(session, profile)
    vehicle = session.scalar(select(Vehicle).where(Vehicle.id == vehicle_id).with_for_update())
    if not vehicle or vehicle.driver_id != driver.id:
        raise HTTPException(404, "Vehicle not found")
    if not vehicle.approved or driver.verification_status != "APPROVED":
        raise HTTPException(403, "Driver and vehicle approval are required")
    from app.models.domain import RideGroup

    if session.scalar(
        select(RideGroup.id).where(
            RideGroup.vehicle_id == vehicle.id, RideGroup.status.in_(["ASSIGNED", "IN_PROGRESS"])
        )
    ):
        raise HTTPException(409, "Finish the assigned trip before changing availability")
    vehicle.available = body.available
    return vehicle_view(vehicle)


@router.get("/driver-offers", response_model=list[OfferResponse])
def offers(
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> list[dict]:
    driver = owned_driver(session, profile)
    rows = session.scalars(
        select(DriverOffer)
        .where(DriverOffer.driver_id == driver.id)
        .order_by(DriverOffer.expires_at.desc())
        .limit(50)
    )
    return [offer_view(row, session) for row in rows]


@router.post("/driver-offers/{offer_id}/accept", response_model=GroupResponse)
def accept(
    offer_id: str,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    return group_view(accept_offer(session, offer_id, profile), session, profile)


@router.post("/driver-offers/{offer_id}/reject", response_model=OfferResponse)
def reject(
    offer_id: str,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    driver = owned_driver(session, profile)
    offer = session.scalar(select(DriverOffer).where(DriverOffer.id == offer_id).with_for_update())
    if not offer or offer.driver_id != driver.id:
        raise HTTPException(404, "Offer not found")
    if offer.status == "REJECTED":
        return offer_view(offer, session)
    if offer.status != "PENDING":
        raise HTTPException(409, "Offer is no longer pending")
    offer.status = "REJECTED"
    return offer_view(offer, session)
