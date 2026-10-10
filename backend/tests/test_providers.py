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


@pytest.mark.parametrize("document", [b"not audio", wav_bytes(121)], ids=["invalid", "too-long"])
def test_invalid_or_long_audio_rejected(document):
    with pytest.raises(HTTPException) as caught:
        providers.transcribe_audio(
            Settings(sarvam_api_key=SecretStr("test"), _env_file=None), document, "unknown"
        )
    assert caught.value.status_code == 422


def test_upload_action_without_checkbox_and_missing_keys(client):
    assert (
        client.post(
            "/tickets/extract",
            files={"file": ("ticket.png", image_bytes(), "image/png")},
        ).status_code
        == 503
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


@pytest.mark.parametrize("pages", [1, 3])
def test_scanned_pdf_is_rendered_for_vision(pages):
    from pypdf import PdfWriter

    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=595, height=842)
    output = io.BytesIO()
    writer.write(output)
    content = providers.ticket_content(output.getvalue(), "application/pdf")
    assert len(content) == pages
    assert all(item["image_url"]["url"].startswith("data:image/jpeg;base64,") for item in content)


@pytest.mark.parametrize("encrypted,pages", [(True, 1), (False, 4), (False, 0)])
def test_unsupported_pdf_rejected(encrypted, pages):
    from pypdf import PdfWriter

    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=595, height=842)
    if encrypted:
        writer.encrypt("test-password")
    output = io.BytesIO()
    writer.write(output)
    with pytest.raises(HTTPException) as caught:
        providers.ticket_content(output.getvalue(), "application/pdf")
    assert caught.value.status_code == 422


@pytest.mark.parametrize(
    "details",
    [
        {"passengers": 9},
        {"passengers": "2"},
        {"display_name": "X" * 81},
        {"flight_date": "2026-02-30"},
        {"pnr": "PRIVATE"},
    ],
)
def test_invalid_extracted_booking_details_rejected(monkeypatch, details):
    transport(
        monkeypatch,
        lambda request: httpx.Response(
            200, json={"choices": [{"message": {"content": json.dumps(details)}}]}
        ),
    )
    with pytest.raises(HTTPException) as caught:
        providers.extract_ticket(
            Settings(groq_api_key=SecretStr("test"), _env_file=None), image_bytes(), "image/png"
        )
    assert caught.value.status_code == 502


def test_ticket_name_and_passenger_count_are_unconfirmed_suggestions(monkeypatch):
    details = {
        "flight_number": "AI123",
        "arrival_airport": "COK",
        "flight_date": "2026-10-11",
        "display_name": "Demo Traveller",
        "passengers": 2,
    }
    transport(
        monkeypatch,
        lambda request: httpx.Response(
            200, json={"choices": [{"message": {"content": json.dumps(details)}}]}
        ),
    )
    result = providers.extract_ticket(
        Settings(groq_api_key=SecretStr("test"), _env_file=None), image_bytes(), "image/png"
    )
    assert result.model_dump(mode="json", exclude_none=True) == details


@pytest.mark.parametrize(
    "payload,status",
    [
        ({"transcript": "  "}, 422),
        ({"transcript": 4}, 502),
        ({"transcript": "A note", "language_code": {}}, 502),
    ],
)
def test_invalid_or_empty_sarvam_response(monkeypatch, payload, status):
    transport(monkeypatch, lambda request: httpx.Response(200, json=payload))
    with pytest.raises(HTTPException) as caught:
        providers.transcribe_audio(
            Settings(sarvam_api_key=SecretStr("test"), _env_file=None), wav_bytes(), "unknown"
        )
    assert caught.value.status_code == status


@pytest.mark.parametrize("document", [wav_bytes(0), wav_bytes()[:44]], ids=["empty", "truncated"])
def test_empty_or_truncated_wav_rejected_before_provider(monkeypatch, document):
    def unexpected(request):
        pytest.fail("Invalid audio must never reach Sarvam")

    transport(monkeypatch, unexpected)
    with pytest.raises(HTTPException) as caught:
        providers.transcribe_audio(
            Settings(sarvam_api_key=SecretStr("test"), _env_file=None), document, "unknown"
        )
    assert caught.value.status_code == 422


def test_long_dictation_is_split_without_dropping_pcm(monkeypatch):
    original = wav_bytes(61)
    segments = providers.audio_segments(original)
    duration = []
    recovered = []
    for segment in segments:
        with wave.open(io.BytesIO(segment)) as part:
            duration.append(part.getnframes() / part.getframerate())
            recovered.append(part.readframes(part.getnframes()))
    assert duration == [29, 29, 3]
    with wave.open(io.BytesIO(original)) as full:
        assert b"".join(recovered) == full.readframes(full.getnframes())
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(
            200, json={"transcript": f"part {len(calls)}", "language_code": "en-IN"}
        )

    transport(monkeypatch, handler)
    result = providers.transcribe_audio(
        Settings(sarvam_api_key=SecretStr("test"), _env_file=None), original, "unknown"
    )
    assert result["transcript"] == "part 1 part 2 part 3"
    assert len(calls) == 3


def test_failed_later_dictation_segment_never_returns_partial_success(monkeypatch):
    calls = []

    def handler(request):
        calls.append(request)
        if len(calls) == 2:
            return httpx.Response(500, json={"error": "SECRET"})
        return httpx.Response(200, json={"transcript": "first words"})

    transport(monkeypatch, handler)
    with pytest.raises(HTTPException) as caught:
        providers.transcribe_audio(
            Settings(sarvam_api_key=SecretStr("test"), _env_file=None), wav_bytes(31), "unknown"
        )
    assert caught.value.status_code == 502
    assert "SECRET" not in caught.value.detail


def test_arrival_timezone_and_luggage_are_validated():
    from pydantic import ValidationError

    from app.schemas.integrations import ExtractedFlight

    details = ExtractedFlight(arrival_at="2026-10-12T01:30:00+05:30", luggage=2)
    assert details.arrival_at.utcoffset().total_seconds() == 19800
    with pytest.raises(ValidationError):
        ExtractedFlight(arrival_at="2026-10-12T01:30:00")
    with pytest.raises(ValidationError):
        ExtractedFlight(luggage=-1)
