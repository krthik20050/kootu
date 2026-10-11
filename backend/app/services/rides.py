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
from app.services.locations import clear_location
from app.services.matching import Candidate, VehicleLimits, build_candidate, departure_for, utc


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


def locked_members(session: Session, group_id: str) -> list[RideRequest]:
    return list(
        session.scalars(
            select(RideRequest)
            .join(RideMember)
            .where(RideMember.group_id == group_id)
            .order_by(RideRequest.id)
            .with_for_update(of=RideRequest)
            .execution_options(populate_existing=True)
        )
    )


def locked_fleet(session: Session, driver_id: str, vehicle_id: str) -> tuple[Driver, Vehicle]:
    driver = session.get(Driver, driver_id, with_for_update=True, populate_existing=True)
    vehicle = session.get(Vehicle, vehicle_id, with_for_update=True, populate_existing=True)
    if driver is None or vehicle is None or vehicle.driver_id != driver.id:
        raise HTTPException(409, "Driver or vehicle assignment changed; retry")
    return driver, vehicle


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


def vehicle_limits(vehicle: Vehicle, driver: Driver) -> VehicleLimits:
    return VehicleLimits(
        seats=vehicle.seats,
        luggage=vehicle.luggage_capacity,
        wheelchair_spaces=vehicle.wheelchair_spaces,
        child_seats=vehicle.child_seats,
        pet_friendly=vehicle.pet_friendly,
        women_only_eligible=driver.women_only_eligible,
        driver_profile_id=driver.profile_id,
    )


def vehicle_fits(vehicle: Vehicle, driver: Driver, members: list[RideRequest | Candidate]) -> bool:
    return (
        driver.verification_status == "APPROVED"
        and driver.available
        and vehicle.approved
        and vehicle.available
        and vehicle_limits(vehicle, driver).fits(
            [snapshot(item) if isinstance(item, RideRequest) else item for item in members]
        )
    )


def road_verified_group(
    seed: Candidate,
    others: list[Candidate],
    limits: VehicleLimits,
    settings: Settings,
    routing: RoutingProvider,
) -> list[Candidate]:
    # One attempt-local cache: no durable provider data or unbounded alternative searches.
    distances: dict[tuple[str, str], bool] = {}
    budget = max(12, settings.max_group_seats * (settings.max_group_seats - 1))

    def fits(members: list[Candidate]) -> bool:
        if not limits.fits(members):
            return False
        for a in members[:-1]:
            for origin, destination in ((a, members[-1]), (members[-1], a)):
                key = (origin.id, destination.id)
                if key not in distances:
                    if len(distances) >= budget:
                        return False
                    estimate = routing.estimate(
                        Coordinates(latitude=origin.latitude, longitude=origin.longitude),
                        Coordinates(latitude=destination.latitude, longitude=destination.longitude),
                    )
                    distances[key] = estimate.distance_metres <= settings.cluster_radius_metres
                if not distances[key]:
                    return False
        return True

    return build_candidate(
        seed,
        others,
        now(),
        settings.cluster_radius_metres,
        min(limits.seats, settings.max_group_seats),
        min(limits.luggage, settings.max_group_luggage),
        fits=fits,
    )


def available_fleet(session: Session, members: list[Candidate | RideRequest]) -> list:
    """Filter actual equipment before the fleet limit, and fetch drivers in one query."""
    return list(
        session.execute(
            select(Vehicle, Driver)
            .join(Driver)
            .where(
                Vehicle.approved,
                Vehicle.available,
                Driver.available,
                Driver.verification_status == "APPROVED",
                Driver.profile_id.not_in([item.profile_id for item in members]),
                Vehicle.seats >= sum(item.passengers for item in members),
                Vehicle.luggage_capacity >= sum(item.luggage for item in members),
                Vehicle.wheelchair_spaces >= sum(item.wheelchair_spaces for item in members),
                Vehicle.child_seats >= sum(item.child_seats for item in members),
                Vehicle.pet_friendly if any(item.pet_friendly for item in members) else True,
                Driver.women_only_eligible if any(item.women_only for item in members) else True,
            )
            .order_by(Vehicle.seats.desc(), Vehicle.id)
            .limit(30)
        )
    )


def propose_match(
    session: Session, seed_id: str, settings: Settings, routing: RoutingProvider
) -> RideGroup | None:
    seed_row = session.get(RideRequest, seed_id)
    if seed_row is None or seed_row.status != "WAITING":
        raise HTTPException(409, "Only a waiting request can be matched")
    seed = snapshot(seed_row)
    current = now()
    horizon = current + timedelta(minutes=settings.dispatch_horizon_minutes)
    if utc(seed.ready_at) > horizon or departure_for([seed], current) is None:
        return None
    # PostGIS retrieves a bounded candidate set. No destination-string comparisons.
    nearby_ids = list(
        session.scalars(
            text("""
        SELECT id FROM passenger_requests
        WHERE airport=:airport AND status='WAITING' AND id<>:id
          AND profile_id<>:profile_id AND women_only=:women_only
          AND ready_at <= :horizon
          AND ready_at <= :deadline
          AND ready_at + max_wait_minutes * interval '1 minute' >= :departure
          AND passengers + :passengers <= :seats
          AND luggage + :luggage <= :luggage_limit
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
                "profile_id": seed.profile_id,
                "women_only": seed.women_only,
                "horizon": horizon,
                "deadline": utc(seed.ready_at) + timedelta(minutes=seed.max_wait_minutes),
                "departure": max(current, utc(seed.ready_at)),
                "passengers": seed.passengers,
                "seats": settings.max_group_seats,
                "luggage": seed.luggage,
                "luggage_limit": settings.max_group_luggage,
            },
        )
    )
    others = [
        snapshot(row)
        for row in session.scalars(select(RideRequest).where(RideRequest.id.in_(nearby_ids)))
    ]
    vehicles = available_fleet(session, [seed])
    selected: list[Candidate] = []
    vehicle_id = None
    limits = None
    for vehicle, driver in vehicles:
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
        # Prefer serving more people in one feasible car, then minimize unused seats.
        score = (sum(item.passengers for item in members), len(members), -vehicle.seats)
        best_score = (
            sum(item.passengers for item in selected),
            len(selected),
            -limits.seats if limits else -settings.max_group_seats,
        )
        if members and score > best_score:
            selected, vehicle_id = members, vehicle.id
            limits = vehicle_limits(vehicle, driver)
    # Release reads before provider I/O. Locked rows are revalidated afterward.
    session.rollback()
    if not selected or not vehicle_id or limits is None:
        return None
    selected = road_verified_group(seed, others, limits, settings, routing)
    if not selected:
        return None
    locked = list(
        session.scalars(
            select(RideRequest)
            .where(RideRequest.id.in_([item.id for item in selected]))
            .order_by(RideRequest.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    )
    versions = {item.id: item.version for item in selected}
    if len(locked) != len(selected) or any(
        row.status != "WAITING" or row.version != versions[row.id] for row in locked
    ):
        raise HTTPException(409, "Requests changed during matching; retry")
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(409, "The eligible vehicle is no longer available")
    driver, vehicle = locked_fleet(session, vehicle.driver_id, vehicle.id)
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
    fleet = available_fleet(session, locked)
    for option, operator in fleet:
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
    if group.status == "CANCELLED":
        return
    if group.status in {"IN_PROGRESS", "COMPLETED"}:
        raise HTTPException(409, "A started trip requires operator assistance")
    members = locked_members(session, group.id)
    driver = vehicle = None
    if group.driver_id and group.vehicle_id:
        driver, vehicle = locked_fleet(session, group.driver_id, group.vehicle_id)
    for row in members:
        if row.status not in {"CANCELLED", "FLIGHT_CANCELLED"}:
            row.status = "WAITING"
        row.version += 1
    session.execute(delete(RideMember).where(RideMember.group_id == group.id))
    for offer in session.scalars(select(DriverOffer).where(DriverOffer.group_id == group.id)):
        if offer.status in {"PENDING", "ACCEPTED"}:
            offer.status = "WITHDRAWN"
    if vehicle:
        vehicle.available = vehicle.approved
    if driver:
        driver.available = driver.verification_status == "APPROVED"
    group.status = "CANCELLED"
    clear_location(group)
    record(session, group.id, kind)


def accept_offer(session: Session, offer_id: str, profile: Profile) -> RideGroup:
    offer = session.get(DriverOffer, offer_id)
    if offer is None:
        raise HTTPException(404, "Offer not found")
    group = locked_group(session, offer.group_id)
    members = locked_members(session, group.id)
    offer = session.scalar(
        select(DriverOffer)
        .where(DriverOffer.id == offer_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    driver, vehicle = locked_fleet(session, offer.driver_id, offer.vehicle_id)
    if driver.profile_id != profile.id:
        raise HTTPException(403, "This offer belongs to another driver")
    if offer.status == "ACCEPTED" and group.driver_id == driver.id:
        return group
    if offer.status != "PENDING" or utc(offer.expires_at) <= now() or group.status != "PROPOSED":
        raise HTTPException(409, "This offer is no longer available")
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
