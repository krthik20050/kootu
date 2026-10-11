from datetime import timedelta

from sqlalchemy.orm import Session
from test_rides import headers, make_group

from app.models.domain import RideGroup, now


def assigned(client, monkeypatch):
    first, second, group = make_group(client, monkeypatch)
    offer = client.get("/driver-offers", headers=headers("driver")).json()[0]
    response = client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("driver"))
    assert response.status_code == 200
    return first, second, group["id"]


def position(**changes):
    return {
        "coordinates": {"latitude": 10.108, "longitude": 76.351},
        "accuracy_metres": 15,
        "captured_at": now().isoformat(),
        **changes,
    }


def test_location_is_only_shared_with_assigned_members(client, monkeypatch):
    first, second, group_id = assigned(client, monkeypatch)
    path = f"/ride-groups/{group_id}/driver-location"
    assert client.put(path, json=position()).status_code == 403
    client.post("/me/role", headers=headers("other-driver"), json={"role": "DRIVER"})
    assert client.put(path, headers=headers("other-driver"), json=position()).status_code == 404
    result = client.put(path, headers=headers("driver"), json=position())
    assert result.status_code == 200, result.text
    location = result.json()["driver_location"]
    assert location["coordinates"]["latitude"] == 10.108 and not location["stale"]
    assert client.get(f"/ride-groups/{group_id}", headers=headers("bob")).json()["driver_location"]
    assert client.get(f"/ride-groups/{group_id}", headers=headers("stranger")).status_code == 404
    assert client.put(path, headers=headers("driver"), json=position()).status_code == 429
    assert client.delete(path, headers=headers("bob")).status_code == 403
    assert client.delete(path, headers=headers("driver")).status_code == 204
    assert client.get(f"/ride-groups/{group_id}").json()["driver_location"] is None


def test_location_validates_age_and_clears_after_cancellation(client, monkeypatch):
    _, _, group_id = assigned(client, monkeypatch)
    path = f"/ride-groups/{group_id}/driver-location"
    assert (
        client.put(
            path,
            headers=headers("driver"),
            json=position(captured_at=(now() - timedelta(minutes=3)).isoformat()),
        ).status_code
        == 422
    )
    assert (
        client.put(
            path,
            headers=headers("driver"),
            json=position(coordinates={"latitude": 100, "longitude": 76}),
        ).status_code
        == 422
    )
    assert client.put(path, headers=headers("driver"), json=position()).status_code == 200
    with Session(client.app.state.engine) as session:
        group = session.get(RideGroup, group_id)
        group.driver_location_captured_at = now() - timedelta(seconds=90)
        session.commit()
    assert client.get(f"/ride-groups/{group_id}").json()["driver_location"]["stale"]
    assert (
        client.post(f"/ride-groups/{group_id}/cancel", headers=headers("driver")).status_code == 200
    )
    assert client.put(path, headers=headers("driver"), json=position()).status_code == 409
    with Session(client.app.state.engine) as session:
        assert session.get(RideGroup, group_id).driver_latitude is None
