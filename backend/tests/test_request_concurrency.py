"""Real PostgreSQL checks for request retries and account booking integrity."""

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from test_rides import headers, party, submit

from app.models.domain import RideRequest, now


def concurrent_submissions(client, bodies):
    assert client.post("/me/role", json={"role": "PASSENGER"}).status_code == 200
    # Exercise concurrent retries after explicit account registration.
    barrier = Barrier(len(bodies))

    def send(body):
        barrier.wait(timeout=10)
        return client.post("/ride-requests", json=body)

    with ThreadPoolExecutor(max_workers=len(bodies)) as pool:
        return list(pool.map(send, bodies))


def test_concurrent_identical_retries_return_one_request(client):
    body = party()
    responses = concurrent_submissions(client, [body] * 4)
    assert [response.status_code for response in responses] == [201] * 4
    assert {response.json()["id"] for response in responses} == {body["client_request_id"]}
    with Session(client.app.state.engine) as session:
        assert session.scalar(select(func.count()).select_from(RideRequest)) == 1


def test_concurrent_different_ids_cannot_double_book_arrival(client):
    responses = concurrent_submissions(client, [party() for _ in range(4)])
    assert sorted(response.status_code for response in responses) == [201, 409, 409, 409]
    for response in responses:
        if response.status_code == 409:
            assert "active booking" in response.json()["detail"]
    assert len(client.get("/ride-requests").json()) == 1


def test_concurrent_changed_retry_does_not_overwrite_request(client):
    body = party()
    responses = concurrent_submissions(client, [body, {**body, "passengers": 2}])
    assert sorted(response.status_code for response in responses) == [201, 409]
    rejected = next(response for response in responses if response.status_code == 409)
    assert "different details" in rejected.json()["detail"]
    accepted = next(response for response in responses if response.status_code == 201)
    assert client.get("/ride-requests").json()[0]["passengers"] == accepted.json()["passengers"]


@pytest.mark.parametrize("status", ["WAITING", "MATCHED", "ASSIGNED", "IN_PROGRESS"])
def test_active_arrival_cannot_be_booked_again_with_changed_flight(client, status):
    first, _ = submit(client)
    with Session(client.app.state.engine) as session, session.begin():
        session.get(RideRequest, first["id"]).status = status
    response = client.post("/ride-requests", json=party(flight_number="AI456"))
    assert response.status_code == 409


@pytest.mark.parametrize("status", ["CANCELLED", "FLIGHT_CANCELLED", "COMPLETED"])
def test_terminal_arrival_allows_new_request_and_old_retry(client, status):
    first, original = submit(client)
    with Session(client.app.state.engine) as session, session.begin():
        session.get(RideRequest, first["id"]).status = status
    second, _ = submit(client)
    assert second["id"] != first["id"]
    retry = client.post("/ride-requests", json=original)
    assert retry.status_code == 201
    assert retry.json()["id"] == first["id"]
    assert retry.json()["status"] == status


def test_other_arrivals_and_accounts_remain_independent(client):
    submit(client)
    tomorrow = now() + timedelta(days=1)
    submit(client, ready_at=tomorrow.isoformat(), flight_date=tomorrow.date().isoformat())
    submit(client, airport="CCJ")
    submit(client, "bob")
    assert len(client.get("/ride-requests").json()) == 3
    assert len(client.get("/ride-requests", headers=headers("bob")).json()) == 1
