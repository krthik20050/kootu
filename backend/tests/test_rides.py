from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.domain import DriverOffer, RideGroup, RideRequest, now
from app.schemas.integrations import RouteEstimate
from app.services.flight_updates import apply_flight_update, maintain_rides
from app.services.providers import GoogleRouting


def party(**changes):
    ready = now() - timedelta(minutes=1)
    return {
        "client_request_id": str(uuid4()),
        "airport": "COK",
        "flight_number": "AI123",
        "flight_date": ready.date().isoformat(),
        "ready_at": ready.isoformat(),
        "max_wait_minutes": 30,
        "destination_name": "Aluva",
        "destination": {"latitude": 10.108, "longitude": 76.351},
        "passengers": 1,
        "luggage": 1,
        "flight_details_confirmed": True,
        **changes,
    }


def headers(subject):
    return {"X-Test-Subject": subject}


def fleet(client, subject="driver", registration="KL07AB1234", **features):
    assert (
        client.post("/me/role", headers=headers(subject), json={"role": "DRIVER"}).status_code
        == 200
    )
    driver = client.post(
        "/drivers",
        headers=headers(subject),
        json={"licence_reference": "REVIEW-12345", "women_only_eligible": True},
    )
    assert driver.status_code == 201, driver.text
    vehicle = client.post(
        "/vehicles",
        headers=headers(subject),
        json={"registration": registration, "seats": 4, "luggage_capacity": 4, **features},
    )
    assert vehicle.status_code == 201, vehicle.text
    for kind, item in (("drivers", driver.json()), ("vehicles", vehicle.json())):
        approved = client.post(
            f"/admin/{kind}/{item['id']}/verification",
            headers=headers("operator"),
            json={"approved": True},
        )
        assert approved.status_code == 200, approved.text
    assert (
        client.patch(
            "/drivers/me/availability", headers=headers(subject), json={"available": True}
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/vehicles/{vehicle.json()['id']}/availability",
            headers=headers(subject),
            json={"available": True},
        ).status_code
        == 200
    )
    return driver.json(), vehicle.json()


def submit(client, subject="alice", **changes):
    assert (
        client.post("/me/role", headers=headers(subject), json={"role": "PASSENGER"}).status_code
        == 200
    )
    body = party(**changes)
    response = client.post("/ride-requests", headers=headers(subject), json=body)
    assert response.status_code == 201, response.text
    return response.json(), body


def make_group(client, monkeypatch):
    fleet(client)
    first, _ = submit(client)
    second, _ = submit(client, "bob")
    monkeypatch.setattr(
        GoogleRouting,
        "estimate",
        lambda *args: RouteEstimate(distance_metres=500, duration_seconds=120),
    )
    response = client.post(f"/ride-requests/{first['id']}/match")
    assert response.status_code == 200, response.text
    assert response.json()["matched"]
    return first, second, response.json()["group"]


def test_request_idempotency_ownership_and_role_security(client):
    client.post("/me/role", headers=headers("bob"), json={"role": "PASSENGER"})
    item, body = submit(client, notes="Private luggage note")
    assert client.post("/ride-requests", json=body).json()["id"] == item["id"]
    assert client.post("/ride-requests", json={**body, "passengers": 2}).status_code == 409
    assert client.post("/ride-requests", headers=headers("bob"), json=body).status_code == 409
    assert client.get("/ride-requests", headers=headers("bob")).json() == []
    assert (
        client.post(f"/ride-requests/{item['id']}/cancel", headers=headers("bob")).status_code
        == 404
    )
    assert client.patch("/me", json={"display_name": "Alice", "role": "ADMIN"}).status_code == 422
    assert client.get("/admin/drivers").status_code == 403


def test_complete_trip_and_privacy(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    assert client.get(f"/ride-groups/{group['id']}", headers=headers("outsider")).status_code == 404
    assert "notes" not in str(group)
    assert first["destination_name"] not in str(group)
    assert group["destination_area"] == {"latitude": 10.11, "longitude": 76.35}
    assert client.get(f"/ride-groups/{group['id']}/manifest").status_code == 403
    offer = client.get("/driver-offers", headers=headers("driver")).json()[0]
    accepted = client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("driver"))
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "ASSIGNED"
    assert (
        client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("driver")).status_code
        == 200
    )
    assert (
        len(client.get(f"/ride-groups/{group['id']}/manifest", headers=headers("driver")).json())
        == 2
    )
    assert (
        client.patch(
            "/drivers/me/availability", headers=headers("driver"), json={"available": True}
        ).status_code
        == 409
    )
    for status in ("IN_PROGRESS", "COMPLETED"):
        response = client.post(
            f"/ride-groups/{group['id']}/status", headers=headers("driver"), json={"status": status}
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == status
        if status == "IN_PROGRESS":
            assert client.post(f"/ride-requests/{first['id']}/cancel").status_code == 409
            assert (
                client.post(
                    f"/ride-groups/{group['id']}/cancel", headers=headers("driver")
                ).status_code
                == 409
            )
    assert client.get("/ride-requests").json()[0]["status"] == "COMPLETED"
    assert client.get("/drivers/me", headers=headers("driver")).json()["available"]


def test_cancellation_releases_other_party(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    assert client.post(f"/ride-requests/{first['id']}/cancel").status_code == 200
    other = client.get("/ride-requests", headers=headers("bob")).json()[0]
    assert other["status"] == "WAITING" and other["group_id"] is None
    assert (
        client.get("/driver-offers", headers=headers("driver")).json()[0]["status"] == "WITHDRAWN"
    )


def test_road_distance_needs_and_wait_limits(client, monkeypatch):
    fleet(client)
    first, _ = submit(client, wheelchair_spaces=1)
    submit(client, "bob")
    calls = []
    monkeypatch.setattr(
        GoogleRouting,
        "estimate",
        lambda *args: (
            calls.append(args) or RouteEstimate(distance_metres=4000, duration_seconds=300)
        ),
    )
    assert not client.post(f"/ride-requests/{first['id']}/match").json()["matched"]
    assert not calls  # No vehicle supports the wheelchair need.
    ordinary, _ = submit(client, "charlie")
    assert not client.post(
        f"/ride-requests/{ordinary['id']}/match", headers=headers("charlie")
    ).json()["matched"]
    assert calls


def test_delay_breaks_group_and_uses_baseline_once(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    engine = client.app.state.engine
    data = {
        "flight_status": "active",
        "arrival": {
            "scheduled": now().isoformat(),
            "estimated": (now() + timedelta(hours=2)).isoformat(),
        },
    }
    with Session(engine) as session, session.begin():
        baseline = session.get(RideRequest, first["id"]).baseline_ready_at
        apply_flight_update(session, first["id"], data)
    with Session(engine) as session, session.begin():
        revised = session.get(RideRequest, first["id"]).ready_at
        apply_flight_update(session, first["id"], data)
        assert session.get(RideRequest, first["id"]).ready_at == revised
        assert revised > baseline + timedelta(minutes=119)
        assert session.get(RideGroup, group["id"]).status == "CANCELLED"
    assert client.get("/ride-requests", headers=headers("bob")).json()[0]["status"] == "WAITING"


def test_expired_offer_returns_requests_to_waiting(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    with Session(client.app.state.engine) as session, session.begin():
        offer = session.scalar(select(DriverOffer))
        offer.expires_at = now() - timedelta(seconds=1)
    maintain_rides(client.app.state.engine, client.app.state.settings)
    assert client.get("/ride-requests").json()[0]["status"] == "WAITING"


def test_concurrent_match_never_duplicates_members(client, monkeypatch):
    fleet(client)
    first, _ = submit(client)
    second, _ = submit(client, "bob")
    monkeypatch.setattr(
        GoogleRouting,
        "estimate",
        lambda *args: RouteEstimate(distance_metres=500, duration_seconds=120),
    )
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(
                lambda item: client.post(
                    f"/ride-requests/{item[0]}/match", headers=headers(item[1])
                ),
                [(first["id"], "alice"), (second["id"], "bob")],
            )
        )
    assert all(response.status_code in {200, 409} for response in responses)
    with client.app.state.engine.connect() as connection:
        assert connection.scalar(text("SELECT count(*) FROM ride_members")) == 2
        assert (
            connection.scalar(text("SELECT count(*) FROM ride_groups WHERE status='PROPOSED'")) == 1
        )


def test_real_postgis_index_and_persistence(client):
    item, _ = submit(client)
    with client.app.state.engine.connect() as connection:
        assert (
            connection.scalar(
                text("SELECT ST_SRID(destination_geo::geometry) FROM passenger_requests")
            )
            == 4326
        )
        assert (
            connection.scalar(
                text(
                    "SELECT count(*) FROM pg_indexes WHERE indexname='ix_requests_destination_geo'"
                )
            )
            == 1
        )
    client.app.state.engine.dispose()
    assert client.get("/ride-requests").json()[0]["id"] == item["id"]


def test_two_groups_cannot_assign_the_same_vehicle(client, monkeypatch):
    client.app.state.settings.max_group_seats = 2
    make_group(client, monkeypatch)
    third, _ = submit(client, "charlie")
    submit(client, "diana")
    response = client.post(f"/ride-requests/{third['id']}/match", headers=headers("charlie"))
    assert response.json()["matched"]
    offers = client.get("/driver-offers", headers=headers("driver")).json()
    assert len(offers) == 2
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(
                lambda offer: client.post(
                    f"/driver-offers/{offer['id']}/accept", headers=headers("driver")
                ),
                offers,
            )
        )
    assert sorted(response.status_code for response in responses) == [200, 409]
    with client.app.state.engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT count(*) FROM ride_groups WHERE status='ASSIGNED'")) == 1
        )


def test_provider_budget_is_shared_and_user_scoped(client):
    for subject in ("alice", "bob"):
        client.post("/me/role", headers=headers(subject), json={"role": "PASSENGER"})
    for _ in range(30):
        assert client.post("/ride-requests/missing/match").status_code == 404
    limited = client.post("/ride-requests/missing/match")
    assert limited.status_code == 429
    assert limited.headers["Retry-After"] == "3600"
    assert client.post("/ride-requests/missing/match", headers=headers("bob")).status_code == 404


def test_missing_arrival_estimate_preserves_previous_delay(client):
    first, _ = submit(client)
    with Session(client.app.state.engine) as session, session.begin():
        row = session.get(RideRequest, first["id"])
        delayed = row.ready_at + timedelta(hours=1)
        row.ready_at = delayed
        apply_flight_update(session, first["id"], {"flight_status": "active", "arrival": {}})
        assert row.ready_at == delayed


def test_competing_driver_offers_have_one_winner(client, monkeypatch):
    fleet(client, "driver-two", "KL07ZZ5678")
    first, second, group = make_group(client, monkeypatch)
    offers = [
        (subject, client.get("/driver-offers", headers=headers(subject)).json()[0])
        for subject in ("driver", "driver-two")
    ]
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(
                lambda entry: client.post(
                    f"/driver-offers/{entry[1]['id']}/accept", headers=headers(entry[0])
                ),
                offers,
            )
        )
    assert sorted(response.status_code for response in responses) == [200, 409]
    statuses = [
        client.get("/driver-offers", headers=headers(subject)).json()[0]["status"]
        for subject in ("driver", "driver-two")
    ]
    assert sorted(statuses) == ["ACCEPTED", "WITHDRAWN"]


def test_driver_release_returns_passengers_to_waiting_and_goes_offline(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    offer = client.get("/driver-offers", headers=headers("driver")).json()[0]
    assert (
        client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("driver")).status_code
        == 200
    )
    assert client.post(f"/ride-groups/{group['id']}/cancel").status_code == 403
    response = client.post(f"/ride-groups/{group['id']}/cancel", headers=headers("driver"))
    assert response.status_code == 200 and response.json()["status"] == "CANCELLED"
    assert client.get("/ride-requests").json()[0]["status"] == "WAITING"
    assert not client.get("/drivers/me", headers=headers("driver")).json()["available"]


def test_cancelled_flight_requeues_others(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    with Session(client.app.state.engine) as session, session.begin():
        apply_flight_update(session, first["id"], {"flight_status": "cancelled", "arrival": {}})
    assert client.get("/ride-requests").json()[0]["status"] == "FLIGHT_CANCELLED"
    assert client.get("/ride-requests", headers=headers("bob")).json()[0]["status"] == "WAITING"
