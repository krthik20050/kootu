"""Flight polling and offer expiry, coordinated across API processes by PostgreSQL."""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.domain import DriverOffer, RideGroup, RideMember, RideRequest, now
from app.services.matching import departure_for, utc
from app.services.providers import GoogleRouting, flight_status
from app.services.rides import dissolve_group, locked_group, propose_match, record, snapshot
from app.services.views import group_members

logger = logging.getLogger("kootu.flights")


def arrival_delay(data: dict) -> timedelta:
    arrival = data.get("arrival") or {}
    scheduled = arrival.get("scheduled")
    revised = arrival.get("actual") or arrival.get("estimated") or scheduled
    if not scheduled or not revised:
        return timedelta()
    try:
        initial = datetime.fromisoformat(scheduled.replace("Z", "+00:00"))
        updated = datetime.fromisoformat(revised.replace("Z", "+00:00"))
        if initial.tzinfo is None or updated.tzinfo is None:
            raise ValueError("Provider arrival times must include a timezone")
        delay = max(timedelta(), updated - initial)
        if delay > timedelta(days=1):
            raise ValueError("Arrival adjustment exceeds one day")
        return delay
    except (TypeError, AttributeError, ValueError) as error:
        raise ValueError("Invalid arrival timing") from error


def apply_flight_update(session: Session, request_id: str, data: dict) -> None:
    row = session.scalar(select(RideRequest).where(RideRequest.id == request_id).with_for_update())
    if row is None or row.status not in {"WAITING", "MATCHED", "ASSIGNED"}:
        return
    status = data.get("flight_status")
    if status not in {"scheduled", "active", "landed", "cancelled", "incident", "diverted"}:
        raise ValueError("Unsupported provider flight status")
    revised = utc(row.baseline_ready_at) + arrival_delay(data)
    changed = revised != utc(row.ready_at) or status != row.flight_status
    row.flight_status = status
    row.ready_at = revised
    row.updated_at = now()
    if changed:
        row.version += 1
    member = session.get(RideMember, row.id)
    group = locked_group(session, member.group_id) if member else None
    if status in {"cancelled", "diverted", "incident"}:
        row.status = "FLIGHT_CANCELLED"
        if group:
            dissolve_group(session, group, "FLIGHT_UNAVAILABLE")
        return
    if group and changed:
        departure = departure_for(
            [snapshot(item) for item in group_members(session, group.id)], now()
        )
        if departure is None:
            dissolve_group(session, group, "FLIGHT_DELAY_REMATCH")
        else:
            group.departure_at = departure
            record(session, group.id, "FLIGHT_UPDATED")


def maintain_rides(engine, settings: Settings) -> None:
    # The lock belongs to this connection, so provider I/O does not hold ride row locks.
    with engine.connect() as coordinator:
        acquired = coordinator.scalar(text("SELECT pg_try_advisory_lock(610110001)"))
        if not acquired:
            return
        try:
            with Session(engine) as session:
                ids = list(
                    session.scalars(
                        select(RideRequest.id)
                        .where(
                            RideRequest.status.in_(["WAITING", "MATCHED", "ASSIGNED"]),
                            RideRequest.flight_date >= (now() - timedelta(days=1)).date(),
                            RideRequest.flight_date <= (now() + timedelta(days=1)).date(),
                        )
                        .order_by(RideRequest.updated_at)
                        .limit(30)
                    )
                )
            if settings.aviationstack_api_key:
                for request_id in ids:
                    try:
                        with Session(engine) as session:
                            row = session.get(RideRequest, request_id)
                            number, date, airport = row.flight_number, row.flight_date, row.airport
                        data = flight_status(settings, number, date, airport)
                        if data:
                            with Session(engine) as session, session.begin():
                                apply_flight_update(session, request_id, data)
                    except Exception as error:
                        logger.warning("Flight refresh failed type=%s", type(error).__name__)
            with Session(engine) as session, session.begin():
                groups = list(
                    session.scalars(
                        select(RideGroup)
                        .where(RideGroup.status == "PROPOSED")
                        .with_for_update(skip_locked=True)
                    )
                )
                for group in groups:
                    offers = list(
                        session.scalars(select(DriverOffer).where(DriverOffer.group_id == group.id))
                    )
                    for offer in offers:
                        if offer.status == "PENDING" and utc(offer.expires_at) <= now():
                            offer.status = "EXPIRED"
                    if not any(item.status == "PENDING" for item in offers):
                        dissolve_group(session, group, "OFFER_EXPIRED_REMATCH")
            if settings.google_maps_api_key:
                with Session(engine) as session:
                    waiting = list(
                        session.scalars(
                            select(RideRequest.id)
                            .where(RideRequest.status == "WAITING")
                            .order_by(RideRequest.created_at)
                            .limit(5)
                        )
                    )
                for request_id in waiting:
                    try:
                        with Session(engine) as session:
                            propose_match(session, request_id, settings, GoogleRouting(settings))
                            session.commit()
                    except Exception as error:
                        logger.warning("Automatic match failed type=%s", type(error).__name__)
        finally:
            coordinator.execute(text("SELECT pg_advisory_unlock(610110001)"))


async def polling_loop(application) -> None:
    while True:
        await asyncio.sleep(application.state.settings.flight_poll_seconds)
        await asyncio.to_thread(
            maintain_rides, application.state.engine, application.state.settings
        )
