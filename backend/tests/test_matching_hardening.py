"""Real PostgreSQL regressions for bounded retrieval and maintenance fairness."""

from datetime import timedelta
from uuid import uuid4

import pytest
from pydantic import SecretStr
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from test_rides import fleet, headers, make_group, submit

from app.models.domain import Driver, DriverOffer, Profile, RideGroup, RideRequest, now
from app.schemas.integrations import RouteEstimate
from app.services import flight_updates
from app.services.providers import GoogleRouting


def add_waiting(session, count, **changes):
    ids = []
    for index in range(count):
        profile = Profile(clerk_subject=str(uuid4()))
        session.add(profile)
        session.flush()
        ready = now() - timedelta(minutes=1)
        values = dict(
            profile_id=profile.id,
            airport="COK",
            flight_number=f"AI{index + 100}",
            flight_date=ready.date(),
            ready_at=ready,
            baseline_ready_at=ready,
            max_wait_minutes=30,
            destination_name="Aluva",
            latitude=10.108,
            longitude=76.351,
            passengers=1,
            luggage=1,
            created_at=now() - timedelta(hours=1),
        )
        row = RideRequest(**(values | changes))
        session.add(row)
        session.flush()
        ids.append(row.id)
    return ids


@pytest.mark.parametrize(
    "changes",
    [
        {"women_only": True},
        {"ready_at": now() + timedelta(hours=2)},
        {"passengers": 6},
        {"luggage": 6},
    ],
)
def test_incompatible_rows_do_not_fill_bounded_shortlist(client, monkeypatch, changes):
    fleet(client)
    first, _ = submit(client)
    with Session(client.app.state.engine) as session, session.begin():
        add_waiting(session, 100, **changes)
    submit(client, "bob")
    monkeypatch.setattr(
        GoogleRouting,
        "estimate",
        lambda *args: RouteEstimate(distance_metres=500, duration_seconds=120),
    )
    response = client.post(f"/ride-requests/{first['id']}/match")
    assert response.status_code == 200, response.text
    assert response.json()["matched"]


def test_duplicate_account_requests_do_not_form_shared_ride(client, monkeypatch):
    fleet(client)
    first, _ = submit(client)
    from test_rides import party

    assert client.post("/ride-requests", json=party()).status_code == 409
    monkeypatch.setattr(
        GoogleRouting, "estimate", lambda *args: pytest.fail("No real second party")
    )
    response = client.post(f"/ride-requests/{first['id']}/match")
    assert response.status_code == 200 and not response.json()["matched"]


def test_future_requests_do_not_reserve_current_fleet(client, monkeypatch):
    fleet(client)
    ready = now() + timedelta(days=7)
    first, _ = submit(client, ready_at=ready.isoformat(), flight_date=ready.date().isoformat())
    submit(client, "bob", ready_at=ready.isoformat(), flight_date=ready.date().isoformat())
    monkeypatch.setattr(
        GoogleRouting, "estimate", lambda *args: pytest.fail("Outside dispatch horizon")
    )
    response = client.post(f"/ride-requests/{first['id']}/match")
    assert response.status_code == 200 and not response.json()["matched"]
    assert client.get("/driver-offers", headers=headers("driver")).json() == []


def test_bad_road_candidate_does_not_hide_a_good_alternative(client, monkeypatch):
    fleet(client)
    client.app.state.settings.max_group_seats = 2
    first, _ = submit(client)
    bad, _ = submit(client, "bob", destination={"latitude": 10.109, "longitude": 76.351})
    good, _ = submit(
        client,
        "charlie",
        flight_number="AI456",
        destination={"latitude": 10.110, "longitude": 76.351},
    )
    calls = []

    def road(self, origin, destination):
        calls.append((origin, destination))
        blocked = origin.latitude == 10.109 or destination.latitude == 10.109
        return RouteEstimate(distance_metres=4000 if blocked else 500, duration_seconds=120)

    monkeypatch.setattr(GoogleRouting, "estimate", road)
    response = client.post(f"/ride-requests/{first['id']}/match")
    assert response.status_code == 200 and response.json()["matched"]
    assert len(calls) == 3
    with Session(client.app.state.engine) as session:
        assert session.get(RideRequest, bad["id"]).status == "WAITING"
        assert session.get(RideRequest, good["id"]).status == "MATCHED"


def test_road_alternative_search_is_bounded(client, monkeypatch):
    fleet(client)
    first, _ = submit(client)
    with Session(client.app.state.engine) as session, session.begin():
        add_waiting(session, 40)
    calls = []

    def road(*args):
        calls.append(1)
        return RouteEstimate(distance_metres=4000, duration_seconds=120)

    monkeypatch.setattr(GoogleRouting, "estimate", road)
    response = client.post(f"/ride-requests/{first['id']}/match")
    assert response.status_code == 200 and not response.json()["matched"]
    assert len(calls) == 30


def test_failed_matching_rotates_and_skips_expired_and_future_requests(client, monkeypatch):
    with Session(client.app.state.engine) as session, session.begin():
        add_waiting(session, 6, ready_at=now() - timedelta(hours=3))
        add_waiting(session, 6, ready_at=now() + timedelta(days=1))
        eligible = add_waiting(session, 6)
    attempted = []

    def failed_match(session, request_id, *args):
        attempted.append(request_id)
        raise RuntimeError("synthetic outage")

    monkeypatch.setattr(flight_updates, "propose_match", failed_match)
    client.app.state.settings.google_maps_api_key = SecretStr("test-only")
    for _ in range(2):
        flight_updates.maintain_rides(client.app.state.engine, client.app.state.settings)
    assert len(attempted) == 10
    assert set(attempted) == set(eligible)


@pytest.mark.parametrize("raises", [False, True])
def test_empty_or_failed_flight_results_do_not_starve_later_requests(client, monkeypatch, raises):
    with Session(client.app.state.engine) as session, session.begin():
        add_waiting(session, 31)
    attempted = []

    def lookup(settings, number, *args):
        attempted.append(number)
        if raises:
            raise RuntimeError("synthetic outage")
        return None

    monkeypatch.setattr(flight_updates, "flight_status", lookup)
    client.app.state.settings.aviationstack_api_key = SecretStr("test-only")
    for _ in range(2):
        flight_updates.maintain_rides(client.app.state.engine, client.app.state.settings)
    assert len(attempted) == 60
    assert len(set(attempted)) == 31


@pytest.mark.parametrize(
    "statement",
    [
        "UPDATE passenger_requests SET status='INVALID'",
        "UPDATE passenger_requests SET version=0",
        "UPDATE ride_groups SET status='ASSIGNED'",
        "UPDATE ride_groups SET status='INVALID'",
        "UPDATE driver_offers SET status='INVALID'",
        "UPDATE drivers SET verification_status='REJECTED'",
        "UPDATE vehicles SET approved=false",
    ],
)
def test_database_rejects_invalid_lifecycle_state(client, monkeypatch, statement):
    make_group(client, monkeypatch)
    with pytest.raises(IntegrityError), client.app.state.engine.begin() as connection:
        connection.execute(text(statement))


def test_database_rejects_offer_for_another_drivers_vehicle(client, monkeypatch):
    make_group(client, monkeypatch)
    other, _ = fleet(client, "other-driver", "KL07CD1234")
    with pytest.raises(IntegrityError), client.app.state.engine.begin() as connection:
        connection.execute(
            text("UPDATE driver_offers SET driver_id=:driver"), {"driver": other["id"]}
        )


def test_availability_refreshes_approval_after_lock(client, monkeypatch):
    driver, _ = fleet(client)
    from app.api import drivers

    original = drivers.owned_driver

    def read_then_revoke(session, profile):
        loaded = original(session, profile)
        with Session(client.app.state.engine) as other, other.begin():
            row = other.scalar(select(Driver).where(Driver.id == driver["id"]))
            row.verification_status = "REJECTED"
            row.available = False
        return loaded

    monkeypatch.setattr(drivers, "owned_driver", read_then_revoke)
    response = client.patch(
        "/drivers/me/availability", headers=headers("driver"), json={"available": True}
    )
    assert response.status_code == 403


def test_live_offers_do_not_hide_expired_groups_behind_batch_limit(client, monkeypatch):
    _, _, group = make_group(client, monkeypatch)
    with Session(client.app.state.engine) as session, session.begin():
        offer = session.scalar(select(DriverOffer))
        offer.expires_at = now() - timedelta(seconds=1)
        for _ in range(100):
            earlier = RideGroup(
                airport="COK", departure_at=now(), created_at=now() - timedelta(hours=1)
            )
            session.add(earlier)
            session.flush()
            session.add(
                DriverOffer(
                    group_id=earlier.id,
                    driver_id=offer.driver_id,
                    vehicle_id=offer.vehicle_id,
                    expires_at=now() + timedelta(minutes=5),
                )
            )
    flight_updates.maintain_rides(client.app.state.engine, client.app.state.settings)
    with Session(client.app.state.engine) as session:
        assert session.get(RideGroup, group["id"]).status == "CANCELLED"
