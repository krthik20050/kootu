"""Persisted portal choice is immutable, including simultaneous registration tabs."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from test_rides import headers, party


def test_new_account_must_choose_role_before_entering_either_portal(client):
    assert client.get("/me").json()["role"] == "UNASSIGNED"
    for path in ("/ride-requests", "/drivers/me", "/vehicles", "/driver-offers"):
        assert client.get(path).status_code == 403
    assert client.post("/drivers", json={"licence_reference": "LICENSE-123"}).status_code == 403
    assert client.post("/ride-requests", json=party()).status_code == 403
    assert client.post("/me/role", json={"role": "ADMIN"}).status_code == 422


def test_passenger_cannot_promote_or_open_driver_api(client):
    selected = client.post("/me/role", json={"role": "PASSENGER"})
    assert selected.status_code == 200
    assert client.post("/me/role", json={"role": "PASSENGER"}).json() == selected.json()
    assert client.post("/me/role", json={"role": "DRIVER"}).status_code == 409
    assert client.post("/drivers", json={"licence_reference": "LICENSE-123"}).status_code == 403
    assert client.get("/drivers/me").status_code == 403
    assert client.get("/me").json()["role"] == "PASSENGER"
    assert client.get("/ride-requests").status_code == 200


def test_driver_cannot_book_or_access_passenger_api(client):
    assert client.post("/me/role", json={"role": "DRIVER"}).status_code == 200
    assert client.get("/drivers/me").status_code == 404  # Registration still requires review.
    assert client.post("/drivers", json={"licence_reference": "LICENSE-123"}).status_code == 201
    assert client.get("/me").json()["role"] == "DRIVER"
    assert client.post("/me/role", json={"role": "PASSENGER"}).status_code == 409
    assert client.get("/ride-requests").status_code == 403
    assert client.post("/ride-requests", json=party()).status_code == 403
    assert client.post("/ride-requests/missing/match").status_code == 403
    assert client.post("/ride-requests/missing/cancel").status_code == 403


def test_simultaneous_first_registration_cannot_switch_roles(client):
    barrier = Barrier(2)

    def choose(role):
        barrier.wait(timeout=10)
        return client.post("/me/role", json={"role": role})

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(choose, ("PASSENGER", "DRIVER")))
    assert sorted(response.status_code for response in responses) == [200, 409]
    winner = next(response.json()["role"] for response in responses if response.status_code == 200)
    assert client.get("/me").json()["role"] == winner


def test_bootstrap_operator_cannot_self_change_role(client):
    assert client.get("/me", headers=headers("operator")).json()["role"] == "ADMIN"
    assert (
        client.post("/me/role", headers=headers("operator"), json={"role": "DRIVER"}).status_code
        == 409
    )
    assert client.get("/admin/drivers", headers=headers("operator")).status_code == 200
