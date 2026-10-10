"""City-cluster and airport-arrival burst scenarios using synthetic passengers."""

from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from test_rides import fleet, headers, party, submit

from app.models.domain import RideGroup, RideMember
from app.schemas.integrations import RouteEstimate
from app.services.providers import GoogleRouting


def routes(monkeypatch):
    monkeypatch.setattr(
        GoogleRouting,
        "estimate",
        lambda *args: RouteEstimate(distance_metres=500, duration_seconds=120),
    )


def test_six_nearby_city_passengers_use_six_seat_vehicle(client, monkeypatch):
    fleet(client, "small", "KL07SM1234")
    fleet(client, "large", "KL07LG1234", seats=6, luggage_capacity=6)
    requests = []
    for index in range(6):
        item, _ = submit(
            client,
            f"rider-{index}",
            destination_name="Thrissur city",
            destination={"latitude": 10.5276 + index * 0.0001, "longitude": 76.2144},
        )
        requests.append(item)
    routes(monkeypatch)
    response = client.post(f"/ride-requests/{requests[0]['id']}/match", headers=headers("rider-0"))
    assert response.status_code == 200, response.text
    assert response.json()["group"]["passengers"] == 6
    assert client.get("/driver-offers", headers=headers("small")).json() == []
    offer = client.get("/driver-offers", headers=headers("large")).json()[0]
    assigned = client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("large"))
    assert assigned.status_code == 200
    assert assigned.json()["vehicle"]["seats"] == 6


def test_same_city_name_does_not_combine_far_away_pins(client, monkeypatch):
    fleet(client, seats=6, luggage_capacity=6)
    first, _ = submit(client, destination_name="Thrissur")
    submit(
        client,
        "bob",
        destination_name="Thrissur",
        destination={"latitude": 10.5276, "longitude": 76.2144},
    )
    routes(monkeypatch)
    assert not client.post(f"/ride-requests/{first['id']}/match").json()["matched"]


def test_driver_cannot_be_counted_as_passenger_in_own_car(client, monkeypatch):
    fleet(client)
    first, _ = submit(client, "driver")
    submit(client, "bob")
    routes(monkeypatch)
    response = client.post(f"/ride-requests/{first['id']}/match", headers=headers("driver"))
    assert response.status_code == 200 and not response.json()["matched"]


def test_200_arrival_submissions_and_competing_cluster_matches(client, monkeypatch):
    fleet(client, seats=6, luggage_capacity=6)
    routes(monkeypatch)

    def book(index):
        # First five share Thrissur pins; the rest form distant synthetic clusters.
        cluster = index // 5
        body = party(
            destination_name="Thrissur city" if cluster == 0 else f"Area {cluster}",
            destination={"latitude": 10.5276 + cluster * 0.05, "longitude": 76.2144},
        )
        response = client.post("/ride-requests", headers=headers(f"arrival-{index}"), json=body)
        assert response.status_code == 201, response.text
        return response.json()["id"]

    with ThreadPoolExecutor(max_workers=8) as pool:
        ids = list(pool.map(book, range(200)))
    with ThreadPoolExecutor(max_workers=5) as pool:
        responses = list(
            pool.map(
                lambda index: client.post(
                    f"/ride-requests/{ids[index]}/match", headers=headers(f"arrival-{index}")
                ),
                range(5),
            )
        )
    assert all(response.status_code in {200, 409} for response in responses)
    with Session(client.app.state.engine) as session:
        assert session.scalar(select(func.count()).select_from(RideGroup)) == 1
        assert session.scalar(select(func.count()).select_from(RideMember)) == 5
        assert set(session.scalars(select(RideMember.request_id))) == set(ids[:5])
