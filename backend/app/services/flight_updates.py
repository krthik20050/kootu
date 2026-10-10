"""Flight polling and offer expiry, coordinated across API processes by PostgreSQL."""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.domain import DriverOffer, RideGroup, RideMember, RideRequest, now
from app.services.matching import departure_for, utc
from app.services.providers import GoogleRouting, flight_status
from app.services.rides import (
    dissolve_group,
    locked_group,
    locked_members,
    propose_match,
    record,
    snapshot,
)
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
    initial = session.get(RideMember, request_id)
    group = locked_group(session, initial.group_id) if initial else None
    # A provider response may arrive after boarding. Never reschedule a started trip.
    if group and group.status in {"IN_PROGRESS", "COMPLETED"}:
        return
    if group:
        locked_members(session, group.id)
    row = session.scalar(
        select(RideRequest)
        .where(RideRequest.id == request_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if row is None or row.status not in {"WAITING", "MATCHED", "ASSIGNED"}:
        return
    status = data.get("flight_status")
    if status not in {"scheduled", "active", "landed", "cancelled", "incident", "diverted"}:
        raise ValueError("Unsupported provider flight status")
    arrival = data.get("arrival") or {}
    revised = (
        utc(row.baseline_ready_at) + arrival_delay(data)
        if arrival.get("scheduled") and (arrival.get("actual") or arrival.get("estimated"))
        else utc(row.ready_at)
    )
    changed = revised != utc(row.ready_at) or status != row.flight_status
    row.flight_status = status
    row.ready_at = revised
    row.updated_at = now()
    if changed:
        row.version += 1
    member = session.get(RideMember, row.id, populate_existing=True)
    if member and (group is None or member.group_id != group.id):
        raise ValueError("Group changed during flight refresh; retry next poll")
    if member is None:
        # Cancellation may have removed membership while we waited for the lock.
        # The old group's driver may already be serving another ride.
        group = None
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
                        .order_by(
                            RideRequest.flight_attempted_at.asc().nulls_first(),
                            RideRequest.created_at,
                            RideRequest.id,
                        )
                        .limit(30)
                    )
                )
            if settings.aviationstack_api_key:
                for request_id in ids:
                    try:
                        with Session(engine) as session, session.begin():
                            row = session.get(RideRequest, request_id, with_for_update=True)
                            if row is None or row.status not in {"WAITING", "MATCHED", "ASSIGNED"}:
                                continue
                            # Persist attempts even if the provider fails or has no flight data.
                            row.flight_attempted_at = now()
                            number, date, airport = row.flight_number, row.flight_date, row.airport
                        data = flight_status(settings, number, date, airport)
                        if data:
                            with Session(engine) as session, session.begin():
                                apply_flight_update(session, request_id, data)
                    except Exception as error:
                        logger.warning("Flight refresh failed type=%s", type(error).__name__)
            with Session(engine) as session, session.begin():
                session.execute(
                    text(
                        "DELETE FROM provider_usage "
                        "WHERE window_at < CURRENT_TIMESTAMP - interval '2 days'"
                    )
                )
                groups = list(
                    session.scalars(
                        select(RideGroup)
                        .where(
                            RideGroup.status == "PROPOSED",
                            or_(
                                ~select(DriverOffer.id)
                                .where(
                                    DriverOffer.group_id == RideGroup.id,
                                    DriverOffer.status == "PENDING",
                                )
                                .exists(),
                                select(DriverOffer.id)
                                .where(
                                    DriverOffer.group_id == RideGroup.id,
                                    DriverOffer.status == "PENDING",
                                    DriverOffer.expires_at <= now(),
                                )
                                .exists(),
                            ),
                        )
                        .order_by(RideGroup.created_at, RideGroup.id)
                        .limit(100)
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
            # Assigned trips can miss pickup without ever starting. Release their
            # fleet reservation; an expired passenger must explicitly book again.
            # Filter before the batch limit so healthy trips cannot starve expiry.
            with Session(engine) as session:
                missed_ids = list(
                    session.scalars(
                        select(RideGroup.id)
                        .where(
                            RideGroup.status == "ASSIGNED",
                            select(RideRequest.id)
                            .join(RideMember)
                            .where(
                                RideMember.group_id == RideGroup.id,
                                text(
                                    "passenger_requests.ready_at + "
                                    "passenger_requests.max_wait_minutes * interval '1 minute' "
                                    "< CURRENT_TIMESTAMP"
                                ),
                            )
                            .exists(),
                        )
                        .order_by(RideGroup.departure_at, RideGroup.id)
                        .limit(100)
                    )
                )
            for group_id in missed_ids:
                with Session(engine) as session, session.begin():
                    group = locked_group(session, group_id)
                    if (
                        group.status == "ASSIGNED"
                        and departure_for(
                            [snapshot(row) for row in group_members(session, group.id)], now()
                        )
                        is None
                    ):
                        dissolve_group(session, group, "PICKUP_WINDOW_EXPIRED")
            with Session(engine) as session, session.begin():
                expired = session.scalars(
                    select(RideRequest)
                    .where(
                        RideRequest.status == "WAITING",
                        text(
                            "ready_at + max_wait_minutes * interval '1 minute' < CURRENT_TIMESTAMP"
                        ),
                    )
                    .order_by(RideRequest.ready_at, RideRequest.id)
                    .limit(100)
                    .with_for_update(skip_locked=True)
                )
                for row in expired:
                    row.status = "CANCELLED"
                    row.version += 1
                    row.updated_at = now()
            if settings.google_maps_api_key:
                with Session(engine) as session:
                    waiting = list(
                        session.scalars(
                            select(RideRequest.id)
                            .where(
                                RideRequest.status == "WAITING",
                                RideRequest.ready_at
                                <= now() + timedelta(minutes=settings.dispatch_horizon_minutes),
                                text(
                                    "ready_at + max_wait_minutes * interval '1 minute' "
                                    ">= CURRENT_TIMESTAMP"
                                ),
                            )
                            .order_by(
                                RideRequest.match_attempted_at.asc().nulls_first(),
                                RideRequest.created_at,
                                RideRequest.id,
                            )
                            .limit(5)
                        )
                    )
                for request_id in waiting:
                    try:
                        with Session(engine) as session, session.begin():
                            row = session.get(RideRequest, request_id, with_for_update=True)
                            if row is None or row.status != "WAITING":
                                continue
                            row.match_attempted_at = now()
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
        try:
            await asyncio.to_thread(
                maintain_rides, application.state.engine, application.state.settings
            )
        except Exception as error:
            logger.warning("Ride maintenance failed type=%s", type(error).__name__)
