from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from math import asin, cos, radians, sin, sqrt


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def distance_metres(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1, lat2, lon2 = map(radians, (*a, *b))
    square = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371008.8 * asin(min(1, sqrt(square)))


@dataclass(frozen=True)
class Candidate:
    id: str
    airport: str
    flight_number: str
    flight_date: str
    ready_at: datetime
    max_wait_minutes: int
    latitude: float
    longitude: float
    passengers: int
    luggage: int
    women_only: bool
    wheelchair_spaces: int
    child_seats: int
    pet_friendly: bool
    version: int


def departure_for(members: list[Candidate], now: datetime) -> datetime | None:
    departure = max(utc(now), *(utc(item.ready_at) for item in members))
    deadline = min(
        utc(item.ready_at) + timedelta(minutes=item.max_wait_minutes) for item in members
    )
    return departure if departure <= deadline else None


def compatible(
    members: list[Candidate],
    candidate: Candidate,
    now: datetime,
    radius: int,
    seats: int,
    luggage: int,
) -> bool:
    combined = [*members, candidate]
    return (
        all(
            item.airport == candidate.airport and item.women_only == candidate.women_only
            for item in members
        )
        and sum(item.passengers for item in combined) <= seats
        and sum(item.luggage for item in combined) <= luggage
        and departure_for(combined, now) is not None
        and all(
            distance_metres(
                (item.latitude, item.longitude), (candidate.latitude, candidate.longitude)
            )
            <= radius
            for item in members
        )
    )


def build_candidate(
    seed: Candidate,
    others: list[Candidate],
    now: datetime,
    radius: int,
    seats: int,
    luggage: int,
    fits: Callable[[list[Candidate]], bool] = lambda members: True,
) -> list[Candidate]:
    members = [seed]
    if (
        seed.passengers > seats
        or seed.luggage > luggage
        or departure_for(members, now) is None
        or not fits(members)
    ):
        return []
    ordered = sorted(
        others,
        key=lambda item: (
            (item.flight_number, item.flight_date) != (seed.flight_number, seed.flight_date),
            abs((utc(item.ready_at) - utc(seed.ready_at)).total_seconds()),
            distance_metres((seed.latitude, seed.longitude), (item.latitude, item.longitude)),
            item.id,
        ),
    )
    for item in ordered:
        if compatible(members, item, now, radius, seats, luggage) and fits([*members, item]):
            members.append(item)
    return members if len(members) >= 2 else []
