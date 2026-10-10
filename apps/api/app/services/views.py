from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import (
    Driver,
    DriverOffer,
    Profile,
    RideGroup,
    RideMember,
    RideRequest,
    TripEvent,
    Vehicle,
)


def request_view(item: RideRequest, session: Session) -> dict:
    member = session.get(RideMember, item.id)
    return {
        "id": item.id,
        "airport": item.airport,
        "flight_number": item.flight_number,
        "flight_date": item.flight_date,
        "ready_at": item.ready_at,
        "max_wait_minutes": item.max_wait_minutes,
        "destination_name": item.destination_name,
        "destination": {"latitude": item.latitude, "longitude": item.longitude},
        "passengers": item.passengers,
        "luggage": item.luggage,
        "women_only": item.women_only,
        "wheelchair_spaces": item.wheelchair_spaces,
        "child_seats": item.child_seats,
        "pet_friendly": item.pet_friendly,
        "notes": item.notes,
        "status": item.status,
        "flight_status": item.flight_status,
        "group_id": member.group_id if member else None,
    }


def vehicle_view(item: Vehicle) -> dict:
    return {
        name: getattr(item, name)
        for name in (
            "id",
            "registration",
            "seats",
            "luggage_capacity",
            "wheelchair_spaces",
            "child_seats",
            "pet_friendly",
            "approved",
            "available",
        )
    }


def driver_view(item: Driver) -> dict:
    return {
        "id": item.id,
        "verification_status": item.verification_status,
        "available": item.available,
        "women_only_eligible": item.women_only_eligible,
    }


def group_members(session: Session, group_id: str) -> list[RideRequest]:
    return list(
        session.scalars(
            select(RideRequest)
            .join(RideMember)
            .where(RideMember.group_id == group_id)
            .order_by(RideRequest.id)
        )
    )


def destination_area(members: list[RideRequest]) -> dict | None:
    if not members:
        return None
    return {
        "latitude": round(sum(row.latitude for row in members) / len(members), 2),
        "longitude": round(sum(row.longitude for row in members) / len(members), 2),
    }


def group_view(item: RideGroup, session: Session, viewer: Profile) -> dict:
    members = group_members(session, item.id)
    vehicle = session.get(Vehicle, item.vehicle_id) if item.vehicle_id else None
    events = list(
        session.scalars(
            select(TripEvent)
            .where(TripEvent.group_id == item.id)
            .order_by(TripEvent.created_at)
            .limit(100)
        )
    )
    # Other passengers receive counts and a destination cluster, not other people's PII.
    return {
        "id": item.id,
        "airport": item.airport,
        "departure_at": item.departure_at,
        "status": item.status,
        "passengers": sum(row.passengers for row in members),
        "luggage": sum(row.luggage for row in members),
        "destination_cluster": f"{len(members)} nearby drop-offs" if members else None,
        "destination_area": destination_area(members),
        "women_only": bool(members and members[0].women_only),
        "vehicle": vehicle_view(vehicle) if vehicle else None,
        "events": [{"kind": event.kind, "created_at": event.created_at} for event in events],
    }


def offer_view(offer: DriverOffer, session: Session) -> dict:
    members = group_members(session, offer.group_id)
    group = session.get(RideGroup, offer.group_id)
    return {
        "id": offer.id,
        "group_id": offer.group_id,
        "vehicle_id": offer.vehicle_id,
        "status": offer.status,
        "expires_at": offer.expires_at,
        "airport": group.airport,
        "departure_at": group.departure_at,
        "passengers": sum(row.passengers for row in members),
        "luggage": sum(row.luggage for row in members),
        "wheelchair_spaces": sum(row.wheelchair_spaces for row in members),
        "child_seats": sum(row.child_seats for row in members),
        "pet_friendly": any(row.pet_friendly for row in members),
        "destination_cluster": f"{len(members)} nearby drop-offs" if members else None,
        "destination_area": destination_area(members),
    }
