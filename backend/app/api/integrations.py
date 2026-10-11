from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile

from app.core.auth import Identity, verify_token
from app.core.rate_limit import provider_budget
from app.schemas.integrations import FlightArrivalResponse
from app.schemas.responses import LocationResponse, TicketResponse, TranscriptResponse
from app.services.providers import GoogleRouting, extract_ticket, flight_status, transcribe_audio

router = APIRouter(tags=["integrations"])


@router.get(
    "/flights/arrival",
    response_model=FlightArrivalResponse,
    dependencies=[Depends(provider_budget)],
)
def flight_arrival(
    request: Request,
    number: str = Query(pattern=r"^[A-Z0-9]{2,3}[0-9]{1,4}$"),
    flight_date: date = Query(),
    airport: str = Query(pattern=r"^[A-Z]{3}$"),
    identity: Identity = Depends(verify_token),
) -> dict:
    data = flight_status(request.app.state.settings, number, flight_date, airport)
    if not data:
        raise HTTPException(
            404,
            "Arrival time is unavailable for this flight. Check the flight details or retry later.",
        )
    if data.get("flight_status") in {"cancelled", "incident", "diverted"}:
        raise HTTPException(409, "This flight is unavailable. Check its status with the airline.")
    # Save a scheduled baseline. Existing flight polling applies delays once after booking.
    scheduled = data.get("arrival", {}).get("scheduled")
    try:
        arrival = datetime.fromisoformat(scheduled.replace("Z", "+00:00"))
        if arrival.tzinfo is None:
            raise ValueError("Missing timezone")
    except (ValueError, TypeError, AttributeError) as error:
        raise HTTPException(
            502, "The flight provider has no reliable arrival time. Try again."
        ) from error
    return {"arrival_at": arrival}


def read_bounded(upload: UploadFile, maximum: int) -> bytes:
    document = upload.file.read(maximum + 1)
    if len(document) > maximum:
        raise HTTPException(413, "File exceeds the upload limit")
    if not document:
        raise HTTPException(422, "Upload an actual file")
    return document


@router.get(
    "/locations/search",
    response_model=list[LocationResponse],
    dependencies=[Depends(provider_budget)],
)
def locations(
    request: Request,
    q: str = Query(min_length=3, max_length=160),
    identity: Identity = Depends(verify_token),
) -> list[dict]:
    return GoogleRouting(request.app.state.settings).search(q)


@router.post(
    "/tickets/extract",
    response_model=TicketResponse,
    dependencies=[Depends(provider_budget)],
    description="Extract tickets up to 20 MB using PDF text or vision for scans.",
)
def ticket(
    request: Request,
    file: UploadFile = File(),
    identity: Identity = Depends(verify_token),
) -> dict:
    try:
        result = extract_ticket(
            request.app.state.settings,
            read_bounded(file, 20 * 1024 * 1024),
            file.content_type or "",
        )
        return {"details": result.model_dump(), "confirmation_required": True}
    finally:
        file.file.close()


@router.post(
    "/audio/transcribe",
    response_model=TranscriptResponse,
    dependencies=[Depends(provider_budget)],
    description="Transcribe WAV dictation up to ten minutes, split into short provider requests.",
)
def audio(
    request: Request,
    file: UploadFile = File(),
    language: Literal["unknown", "ml-IN", "en-IN", "hi-IN", "ta-IN", "kn-IN"] = Form(
        default="unknown"
    ),
    identity: Identity = Depends(verify_token),
) -> dict:
    try:
        result = transcribe_audio(
            request.app.state.settings, read_bounded(file, 20 * 1024 * 1024), language
        )
        return {**result, "confirmation_required": True}
    finally:
        file.file.close()
