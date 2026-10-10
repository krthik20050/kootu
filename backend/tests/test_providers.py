import io
import json
import wave
from datetime import date

import httpx2 as httpx
import pytest
from fastapi import HTTPException
from PIL import Image
from pydantic import SecretStr

from app.core.config import Settings
from app.schemas.integrations import Coordinates
from app.services import providers
from app.services.flight_updates import arrival_delay


def image_bytes():
    stream = io.BytesIO()
    Image.new("RGB", (100, 100)).save(stream, "PNG")
    return stream.getvalue()


def wav_bytes(seconds=1):
    stream = io.BytesIO()
    with wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(b"\0\0" * 8000 * seconds)
    return stream.getvalue()


def transport(monkeypatch, handler):
    client = httpx.Client
    monkeypatch.setattr(
        providers.httpx,
        "Client",
        lambda **kwargs: client(transport=httpx.MockTransport(handler), **kwargs),
    )


def test_groq_structured_output_and_image(monkeypatch):
    def handler(request):
        body = json.loads(request.content)
        assert request.url.host == "api.groq.com"
        assert body["response_format"] == {"type": "json_object"}
        assert body["reasoning_effort"] == "none"
        assert "flight_number" in body["messages"][0]["content"]
        assert body["messages"][1]["content"][0]["image_url"]["url"].startswith(
            "data:image/jpeg;base64,"
        )
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "flight_number": "AI123",
                                    "flight_date": "2026-10-11",
                                    "arrival_airport": "COK",
                                }
                            )
                        }
                    }
                ]
            },
        )

    transport(monkeypatch, handler)
    result = providers.extract_ticket(
        Settings(groq_api_key=SecretStr("test"), groq_model="account-model", _env_file=None),
        image_bytes(),
        "image/png",
    )
    assert result.arrival_airport == "COK"


def test_sarvam_multipart_and_transcript(monkeypatch):
    def handler(request):
        assert request.url.host == "api.sarvam.ai"
        assert request.headers["api-subscription-key"] == "test"
        assert b"saaras:v3" in request.content and b"voice-note.wav" in request.content
        return httpx.Response(
            200, json={"transcript": "One child seat please", "language_code": "en-IN"}
        )

    transport(monkeypatch, handler)
    assert (
        providers.transcribe_audio(
            Settings(sarvam_api_key=SecretStr("test"), _env_file=None), wav_bytes(), "en-IN"
        )["transcript"]
        == "One child seat please"
    )


def test_google_route_contract(monkeypatch):
    def handler(request):
        assert request.headers["X-Goog-FieldMask"] == "routes.distanceMeters,routes.duration"
        assert json.loads(request.content)["origin"]["location"]["latLng"]["latitude"] == 10
        return httpx.Response(200, json={"routes": [{"distanceMeters": 1500, "duration": "300s"}]})

    transport(monkeypatch, handler)
    routing = providers.GoogleRouting(
        Settings(google_maps_api_key=SecretStr("test"), _env_file=None)
    )
    assert (
        routing.estimate(
            Coordinates(latitude=10, longitude=76), Coordinates(latitude=10.01, longitude=76)
        ).distance_metres
        == 1500
    )


def test_flight_provider_filters_exact_arrival(monkeypatch):
    row = {
        "flight_date": "2026-10-11",
        "flight": {"iata": "AI123"},
        "arrival": {"iata": "COK"},
        "flight_status": "scheduled",
    }

    def handler(request):
        assert "flight_date" not in request.url.params
        return httpx.Response(200, json={"data": [row]})

    transport(monkeypatch, handler)
    settings = Settings(aviationstack_api_key=SecretStr("test"), _env_file=None)
    assert providers.flight_status(settings, "AI123", date(2026, 10, 11), "COK") == row
    assert providers.flight_status(settings, "AI124", date(2026, 10, 11), "COK") is None
    assert providers.flight_status(settings, "AI123", date(2026, 10, 12), "COK") is None


@pytest.mark.parametrize(
    "status,data", [(401, {"error": "SECRET"}), (200, []), (200, {"choices": []})]
)
def test_provider_failure_is_safe(monkeypatch, status, data):
    transport(monkeypatch, lambda request: httpx.Response(status, json=data))
    with pytest.raises(HTTPException) as caught:
        providers.extract_ticket(
            Settings(groq_api_key=SecretStr("test"), groq_model="model", _env_file=None),
            image_bytes(),
            "image/png",
        )
    assert caught.value.status_code == 502
    assert "SECRET" not in caught.value.detail


@pytest.mark.parametrize(
    "document,kind",
    [(b"not an image", "image/png"), (b"fake PDF", "application/pdf"), (b"<script>", "text/html")],
)
def test_invalid_ticket_rejected(document, kind):
    with pytest.raises(HTTPException):
        providers.ticket_content(document, kind)


@pytest.mark.parametrize("document", [b"not audio", wav_bytes(31)], ids=["invalid", "too-long"])
def test_invalid_or_long_audio_rejected(document):
    with pytest.raises(HTTPException) as caught:
        providers.transcribe_audio(
            Settings(sarvam_api_key=SecretStr("test"), _env_file=None), document, "unknown"
        )
    assert caught.value.status_code == 422


def test_upload_consent_and_missing_keys(client):
    assert (
        client.post(
            "/tickets/extract",
            files={"file": ("ticket.png", image_bytes(), "image/png")},
            data={"consent": "false"},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/tickets/extract",
            files={"file": ("ticket.png", image_bytes(), "image/png")},
            data={"consent": "true"},
        ).status_code
        == 503
    )
    assert (
        client.post(
            "/audio/transcribe",
            files={"file": ("voice.wav", wav_bytes(), "audio/wav")},
            data={"consent": "true"},
        ).status_code
        == 503
    )


def test_invalid_flight_time_does_not_change_pickup():
    with pytest.raises(ValueError):
        arrival_delay(
            {"arrival": {"scheduled": "2026-10-11T10:00:00", "estimated": "2026-10-11T12:00:00"}}
        )
