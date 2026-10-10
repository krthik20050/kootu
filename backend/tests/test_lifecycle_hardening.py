"""PostgreSQL lifecycle regressions: pickup expiry and competing commands."""

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session
from test_rides import headers, make_group, submit

from app.models.domain import Driver, RideGroup, RideMember, RideRequest, Vehicle, now
from app.services.flight_updates import apply_flight_update, maintain_rides
from app.services.rides import dissolve_group


def assign(client):
    offer = client.get("/driver-offers", headers=headers("driver")).json()[0]
    response = client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("driver"))
    assert response.status_code == 200, response.text
    return offer


def test_missed_pickup_releases_fleet_and_expires_only_overdue_passenger(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    assign(client)
    with Session(client.app.state.engine) as session, session.begin():
        row = session.get(RideRequest, first["id"])
        row.ready_at = now() - timedelta(hours=2)
    maintain_rides(client.app.state.engine, client.app.state.settings)
    with Session(client.app.state.engine) as session:
        assert session.get(RideGroup, group["id"]).status == "CANCELLED"
        assert session.get(RideRequest, first["id"]).status == "CANCELLED"
        assert session.get(RideRequest, second["id"]).status == "WAITING"
        assert session.get(RideMember, first["id"]) is None
        assert session.get(RideMember, second["id"]) is None
        assert session.scalar(select(Driver)).available
        assert session.scalar(select(Vehicle)).available


def test_started_trip_is_not_expired_or_changed_by_flight_callback(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    assign(client)
    response = client.post(
        f"/ride-groups/{group['id']}/status",
        headers=headers("driver"),
        json={"status": "IN_PROGRESS"},
    )
    assert response.status_code == 200, response.text
    with Session(client.app.state.engine) as session, session.begin():
        row = session.get(RideRequest, first["id"])
        row.ready_at = now() - timedelta(hours=2)
        apply_flight_update(session, first["id"], {"flight_status": "cancelled"})
    maintain_rides(client.app.state.engine, client.app.state.settings)
    with Session(client.app.state.engine) as session:
        assert session.get(RideGroup, group["id"]).status == "IN_PROGRESS"
        assert session.get(RideRequest, first["id"]).status == "IN_PROGRESS"
        assert not session.scalar(select(Driver)).available
        assert not session.scalar(select(Vehicle)).available


def test_waiting_deadline_cancels_request_without_fabricating_a_match(client):
    first, _ = submit(client)
    with Session(client.app.state.engine) as session, session.begin():
        session.get(RideRequest, first["id"]).ready_at = now() - timedelta(hours=2)
    maintain_rides(client.app.state.engine, client.app.state.settings)
    assert client.get("/ride-requests").json()[0]["status"] == "CANCELLED"


def test_flight_refresh_discards_membership_removed_before_group_lock(client, monkeypatch):
    from app.services import flight_updates

    first, second, group = make_group(client, monkeypatch)
    assign(client)
    original = flight_updates.locked_group

    def release_before_lock(session, group_id):
        with Session(client.app.state.engine) as other, other.begin():
            old_group = original(other, group_id)
            dissolve_group(other, old_group, "DRIVER_CANCELLED")
            other.scalar(select(Driver)).available = False
        return original(session, group_id)

    monkeypatch.setattr(flight_updates, "locked_group", release_before_lock)
    with Session(client.app.state.engine) as session, session.begin():
        apply_flight_update(session, first["id"], {"flight_status": "cancelled"})
    with Session(client.app.state.engine) as session:
        assert session.get(RideRequest, first["id"]).status == "FLIGHT_CANCELLED"
        assert session.get(RideRequest, second["id"]).status == "WAITING"
        assert not session.scalar(select(Driver)).available


@pytest.mark.parametrize("command", ["passenger_cancel", "flight_cancel"])
def test_accept_competes_safely_with_cancellation(client, monkeypatch, command):
    first, second, group = make_group(client, monkeypatch)
    offer = client.get("/driver-offers", headers=headers("driver")).json()[0]

    def cancel():
        if command == "passenger_cancel":
            response = client.post(f"/ride-requests/{first['id']}/cancel")
            assert response.status_code == 200, response.text
        else:
            with Session(client.app.state.engine) as session, session.begin():
                apply_flight_update(session, first["id"], {"flight_status": "cancelled"})

    with ThreadPoolExecutor(max_workers=2) as pool:
        cancellation = pool.submit(cancel)
        acceptance = pool.submit(
            client.post, f"/driver-offers/{offer['id']}/accept", headers=headers("driver")
        )
        cancellation.result(timeout=15)
        response = acceptance.result(timeout=15)
        assert response.status_code in {200, 409}, response.text
    with Session(client.app.state.engine) as session:
        assert session.get(RideGroup, group["id"]).status == "CANCELLED"
        assert session.get(RideRequest, second["id"]).status == "WAITING"
        assert session.scalar(select(Driver)).available
        assert session.scalar(select(Vehicle)).available


def test_start_competes_safely_with_passenger_cancellation(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    assign(client)
    with ThreadPoolExecutor(max_workers=2) as pool:
        cancellation = pool.submit(client.post, f"/ride-requests/{first['id']}/cancel")
        start = pool.submit(
            client.post,
            f"/ride-groups/{group['id']}/status",
            headers=headers("driver"),
            json={"status": "IN_PROGRESS"},
        )
        responses = [cancellation.result(timeout=15), start.result(timeout=15)]
    assert sorted(response.status_code for response in responses) == [200, 409]
    with Session(client.app.state.engine) as session:
        state = session.get(RideGroup, group["id"]).status
        if state == "IN_PROGRESS":
            assert session.get(RideRequest, first["id"]).status == "IN_PROGRESS"
            assert not session.scalar(select(Driver)).available
        else:
            assert state == "CANCELLED"
            assert session.get(RideRequest, second["id"]).status == "WAITING"
            assert session.scalar(select(Driver)).available
