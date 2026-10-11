"""Full API lifecycle with real disposable PostGIS and stubbed external providers."""

from datetime import timedelta

from test_driver_location import position
from test_providers import image_bytes, wav_bytes
from test_rides import fleet, headers, party

from app.api import integrations
from app.models.domain import now
from app.schemas.integrations import ExtractedFlight, RouteEstimate
from app.services.providers import GoogleRouting


def test_ticket_and_voice_survive_booking_matching_and_trip_completion(client, monkeypatch):
    ready = now() - timedelta(minutes=1)
    monkeypatch.setattr(
        integrations,
        "extract_ticket",
        lambda *_: ExtractedFlight(
            flight_number="AI123", flight_date=ready.date(), arrival_airport="COK"
        ),
    )
    monkeypatch.setattr(
        integrations,
        "transcribe_audio",
        lambda *_: {"transcript": "Please help with one small bag", "language_code": "en-IN"},
    )
    ticket = client.post(
        "/tickets/extract", files={"file": ("synthetic.png", image_bytes(), "image/png")}
    )
    voice = client.post(
        "/audio/transcribe", files={"file": ("synthetic.wav", wav_bytes(), "audio/wav")}
    )
    assert ticket.status_code == voice.status_code == 200
    details = ticket.json()["details"]
    body = party(
        flight_number=details["flight_number"],
        flight_date=details["flight_date"],
        airport=details["arrival_airport"],
        notes=voice.json()["transcript"],
    )
    first = client.post("/ride-requests", json=body)
    assert first.status_code == 201
    assert client.post("/ride-requests", json=body).json()["id"] == first.json()["id"]
    assert client.post("/ride-requests", headers=headers("bob"), json=party()).status_code == 201
    fleet(client)
    monkeypatch.setattr(
        GoogleRouting,
        "estimate",
        lambda *_: RouteEstimate(distance_metres=500, duration_seconds=120),
    )
    match = client.post(f"/ride-requests/{first.json()['id']}/match")
    assert match.status_code == 200 and match.json()["matched"]
    group_id = match.json()["group"]["id"]
    offer = client.get("/driver-offers", headers=headers("driver")).json()[0]
    assert (
        client.post(f"/driver-offers/{offer['id']}/accept", headers=headers("driver")).status_code
        == 200
    )
    manifest = client.get(f"/ride-groups/{group_id}/manifest", headers=headers("driver"))
    assert manifest.status_code == 200
    assert any(row["notes"] == voice.json()["transcript"] for row in manifest.json())
    assert client.get(f"/ride-groups/{group_id}/manifest").status_code == 404
    assert (
        client.put(
            f"/ride-groups/{group_id}/driver-location",
            headers=headers("driver"),
            json=position(),
        ).status_code
        == 200
    )
    assert client.get(f"/ride-groups/{group_id}").json()["driver_location"]
    for status in ("IN_PROGRESS", "COMPLETED"):
        result = client.post(
            f"/ride-groups/{group_id}/status",
            headers=headers("driver"),
            json={"status": status},
        )
        assert result.status_code == 200 and result.json()["status"] == status
    assert client.get("/ride-requests").json()[0]["status"] == "COMPLETED"
    assert client.get(f"/ride-groups/{group_id}").json()["driver_location"] is None
