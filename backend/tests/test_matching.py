from dataclasses import replace
from datetime import timedelta

import pytest

from app.models.domain import now
from app.services.matching import Candidate, build_candidate, departure_for


def candidate(id="one", **changes):
    time = now()
    return Candidate(
        id=id,
        profile_id=id,
        airport="COK",
        flight_number="AI123",
        flight_date=time.date(),
        ready_at=time,
        max_wait_minutes=30,
        latitude=10,
        longitude=76,
        passengers=1,
        luggage=1,
        women_only=False,
        wheelchair_spaces=0,
        child_seats=0,
        pet_friendly=False,
        version=1,
        **changes,
    )


@pytest.mark.parametrize(
    "changes",
    [
        {"airport": "TRV"},
        {"women_only": True},
        {"latitude": 11},
        {"passengers": 4},
        {"luggage": 4},
        {"ready_at": now() + timedelta(hours=2)},
    ],
)
def test_hard_constraints(changes):
    a = candidate()
    b = replace(a, id="two", profile_id="two", **changes)
    assert build_candidate(a, [b], now(), 3000, 4, 4) == []


def test_same_flight_preference_is_deterministic():
    a = candidate()
    b = replace(a, id="two", profile_id="two", flight_number="AI124")
    c = replace(a, id="three", profile_id="three")
    assert [row.id for row in build_candidate(a, [b, c], now(), 3000, 2, 4)] == ["one", "three"]


def test_every_pair_must_fit_not_only_seed():
    a = candidate()
    b = replace(a, id="two", profile_id="two", longitude=76.02)
    c = replace(a, id="three", profile_id="three", longitude=75.98)
    assert len(build_candidate(a, [b, c], now(), 3000, 4, 4)) == 2


def test_wait_deadline_and_exact_boundary():
    a = candidate()
    deadline = a.ready_at + timedelta(minutes=30)
    assert departure_for([a], deadline) == deadline
    assert departure_for([a], deadline + timedelta(seconds=1)) is None


def test_same_account_cannot_supply_multiple_parties_in_one_group():
    a = candidate()
    duplicate = replace(a, id="another-request")
    b = replace(a, id="two", profile_id="two")
    assert build_candidate(a, [duplicate], now(), 3000, 4, 4) == []
    assert build_candidate(a, [a, duplicate, b, b], now(), 3000, 4, 4) == [a, b]


def test_empty_group_has_no_departure():
    assert departure_for([], now()) is None
