from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.domain import (
    Driver,
    DriverOffer,
    Profile,
    RideGroup,
    RideMember,
    RideRequest,
    TripEvent,
    Vehicle,
    now,
)
from app.schemas.integrations import Coordinates
from app.services.integrations import RoutingProvider
from app.services.matching import Candidate, build_candidate, departure_for, utc
from app.services.views import group_members


def snapshot(row: RideRequest) -> Candidate:
    return Candidate(**{key: getattr(row, key) for key in Candidate.__dataclass_fields__})


def record(session: Session, group_id: str, kind: str) -> None:
    session.add(TripEvent(group_id=group_id, kind=kind))


def locked_group(session: Session, group_id: str) -> RideGroup:
    group = session.scalar(
        select(RideGroup)
        .where(RideGroup.id == group_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if group is None:
        raise HTTPException(404, "Ride group not found")
    return group


def can_view_group(session: Session, group: RideGroup, profile: Profile) -> bool:
    if profile.role == "ADMIN":
        return True
    if session.scalar(
        select(RideRequest.id)
        .join(RideMember)
        .where(RideMember.group_id == group.id, RideRequest.profile_id == profile.id)
    ):
        return True
    driver = session.get(Driver, group.driver_id) if group.driver_id else None
    return bool(driver and driver.profile_id == profile.id)


def vehicle_fits(vehicle: Vehicle, driver: Driver, members: list[RideRequest | Candidate]) -> bool:
    return (
        driver.verification_status == "APPROVED"
        and driver.available
        and vehicle.approved
        and vehicle.available
        and sum(item.passengers for item in members) <= vehicle.seats
        and sum(item.luggage for item in members) <= vehicle.luggage_capacity
        and sum(item.wheelchair_spaces for item in members) <= vehicle.wheelchair_spaces
        and sum(item.child_seats for item in members) <= vehicle.child_seats
        and (not any(item.pet_friendly for item in members) or vehicle.pet_friendly)
        and (not any(item.women_only for item in members) or driver.women_only_eligible)
    )


def propose_match(
    session: Session, seed_id: str, settings: Settings, routing: RoutingProvider
) -> RideGroup | None:
    seed_row = session.get(RideRequest, seed_id)
    if seed_row is None or seed_row.status != "WAITING":
        raise HTTPException(409, "Only a waiting request can be matched")
    seed = snapshot(seed_row)
    # PostGIS retrieves a bounded candidate set. No destination-string comparisons.
    nearby_ids = list(
        session.scalars(
            text("""
        SELECT id FROM passenger_requests
        WHERE airport=:airport AND status='WAITING' AND id<>:id
          AND ready_at + max_wait_minutes * interval '1 minute' >= CURRENT_TIMESTAMP
          AND ST_DWithin(destination_geo,
              ST_SetSRID(ST_MakePoint(:lon,:lat),4326)::geography,:radius)
        ORDER BY created_at,id LIMIT 100
    """),
            {
                "airport": seed.airport,
                "id": seed.id,
                "lat": seed.latitude,
                "lon": seed.longitude,
                "radius": settings.cluster_radius_metres,
            },
        )
    )
    others = [
        snapshot(row)
        for row in session.scalars(select(RideRequest).where(RideRequest.id.in_(nearby_ids)))
    ]
    vehicles = list(
        session.scalars(
            select(Vehicle)
            .join(Driver)
            .where(
                Vehicle.approved,
                Vehicle.available,
                Driver.available,
                Driver.verification_status == "APPROVED",
            )
            .order_by(Vehicle.seats, Vehicle.id)
            .limit(30)
        )
    )
    selected: list[Candidate] = []
    vehicle_id = None
    for vehicle in vehicles:
        driver = session.get(Driver, vehicle.driver_id)
        members = build_candidate(
            seed,
            others,
            now(),
            settings.cluster_radius_metres,
            min(vehicle.seats, settings.max_group_seats),
            min(vehicle.luggage_capacity, settings.max_group_luggage),
            fits=lambda items, selected_vehicle=vehicle, selected_driver=driver: vehicle_fits(
                selected_vehicle, selected_driver, items
            ),
        )
        if members and vehicle_fits(vehicle, session.get(Driver, vehicle.driver_id), members):
            selected, vehicle_id = members, vehicle.id
            break
    # Release reads before provider I/O. Locked rows are revalidated afterward.
    session.rollback()
    if not selected or not vehicle_id:
        return None
    for index, a in enumerate(selected):
        for b in selected[index + 1 :]:
            for origin, destination in ((a, b), (b, a)):
                estimate = routing.estimate(
                    Coordinates(latitude=origin.latitude, longitude=origin.longitude),
                    Coordinates(latitude=destination.latitude, longitude=destination.longitude),
                )
                if estimate.distance_metres > settings.cluster_radius_metres:
                    return None
    locked = list(
        session.scalars(
            select(RideRequest)
            .where(RideRequest.id.in_([item.id for item in selected]))
            .order_by(RideRequest.id)
            .with_for_update()
        )
    )
    versions = {item.id: item.version for item in selected}
    if len(locked) != len(selected) or any(
        row.status != "WAITING" or row.version != versions[row.id] for row in locked
    ):
        raise HTTPException(409, "Requests changed during matching; retry")
    vehicle = session.get(Vehicle, vehicle_id)
    driver = session.scalar(select(Driver).where(Driver.id == vehicle.driver_id).with_for_update())
    vehicle = session.scalar(
        select(Vehicle)
        .where(Vehicle.id == vehicle_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if not vehicle_fits(vehicle, driver, locked):
        raise HTTPException(409, "The eligible vehicle is no longer available")
    departure = departure_for([snapshot(row) for row in locked], now())
    if departure is None:
        return None
    group = RideGroup(airport=seed.airport, departure_at=departure)
    session.add(group)
    session.flush()
    for row in locked:
        row.status = "MATCHED"
        row.version += 1
        session.add(RideMember(request_id=row.id, group_id=group.id))
    # Offer to a bounded fleet, at most one fitting vehicle per driver.
    offered = set()
    expiry = now() + timedelta(seconds=settings.offer_ttl_seconds)
    fleet = session.scalars(
        select(Vehicle)
        .join(Driver)
        .where(
            Vehicle.approved,
            Vehicle.available,
            Driver.available,
            Driver.verification_status == "APPROVED",
        )
        .order_by(Vehicle.seats, Vehicle.id)
        .limit(30)
    )
    for option in fleet:
        operator = session.get(Driver, option.driver_id)
        if operator.id not in offered and vehicle_fits(option, operator, locked):
            offered.add(operator.id)
            session.add(
                DriverOffer(
                    group_id=group.id,
                    driver_id=operator.id,
                    vehicle_id=option.id,
                    expires_at=expiry,
                )
            )
    record(session, group.id, "MATCH_FOUND")
    return group


def dissolve_group(session: Session, group: RideGroup, kind: str) -> None:
    if group.status in {"IN_PROGRESS", "COMPLETED"}:
        raise HTTPException(409, "A started trip requires operator assistance")
    for row in group_members(session, group.id):
        if row.status not in {"CANCELLED", "FLIGHT_CANCELLED"}:
            row.status = "WAITING"
        row.version += 1
    session.execute(delete(RideMember).where(RideMember.group_id == group.id))
    for offer in session.scalars(select(DriverOffer).where(DriverOffer.group_id == group.id)):
        if offer.status in {"PENDING", "ACCEPTED"}:
            offer.status = "WITHDRAWN"
    if group.vehicle_id:
        session.get(Vehicle, group.vehicle_id).available = True
    if group.driver_id:
        session.get(Driver, group.driver_id).available = True
    group.status = "CANCELLED"
    record(session, group.id, kind)


def accept_offer(session: Session, offer_id: str, profile: Profile) -> RideGroup:
    offer = session.get(DriverOffer, offer_id)
    if offer is None:
        raise HTTPException(404, "Offer not found")
    group = locked_group(session, offer.group_id)
    offer = session.scalar(
        select(DriverOffer)
        .where(DriverOffer.id == offer_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    driver = session.scalar(select(Driver).where(Driver.id == offer.driver_id).with_for_update())
    if driver.profile_id != profile.id:
        raise HTTPException(403, "This offer belongs to another driver")
    if offer.status == "ACCEPTED" and group.driver_id == driver.id:
        return group
    if offer.status != "PENDING" or utc(offer.expires_at) <= now() or group.status != "PROPOSED":
        raise HTTPException(409, "This offer is no longer available")
    members = group_members(session, group.id)
    vehicle = session.scalar(
        select(Vehicle).where(Vehicle.id == offer.vehicle_id).with_for_update()
    )
    if (
        not vehicle_fits(vehicle, driver, members)
        or len(members) < 2
        or departure_for([snapshot(row) for row in members], now()) is None
    ):
        raise HTTPException(409, "Ride capacity, availability or timing has changed")
    group.status = "ASSIGNED"
    group.driver_id = driver.id
    group.vehicle_id = vehicle.id
    driver.available = False
    vehicle.available = False
    offer.status = "ACCEPTED"
    for other in session.scalars(
        select(DriverOffer).where(
            DriverOffer.group_id == group.id,
            DriverOffer.id != offer.id,
            DriverOffer.status == "PENDING",
        )
    ):
        other.status = "WITHDRAWN"
    for row in members:
        row.status = "ASSIGNED"
    record(session, group.id, "DRIVER_ACCEPTED")
    return group
