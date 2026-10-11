from datetime import date, datetime
from typing import Literal

import httpx2 as httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile

from app.core.auth import Identity, verify_token
from app.core.rate_limit import provider_budget
from app.schemas.responses import (
    FlightArrivalResponse,
    LocationResponse,
    TicketResponse,
    TranscriptResponse,
)
from app.services.providers import GeoapifyLocations, extract_ticket, flight_status, transcribe_audio

router = APIRouter(tags=["integrations"])


@router.get(
    "/flights/arrival", response_model=FlightArrivalResponse,
    dependencies=[Depends(provider_budget)],
)
def flight_arrival(
    request: Request,
    flight_number: str = Query(pattern=r"^[A-Z0-9]{2,3}[0-9]{1,4}$"),
    flight_date: date = Query(),
    airport: str = Query(pattern=r"^[A-Z]{3}$"),
    identity: Identity = Depends(verify_token),
) -> FlightArrivalResponse:
    try:
        row = flight_status(
            request.app.state.settings, flight_number, flight_date, airport,
            match_arrival_date=True,
        )
    except (HTTPException, httpx.RequestError) as error:
        # Provider errors may include request URLs containing private credentials.
        raise HTTPException(
            503, "Flight timing is unavailable. Enter pickup time manually."
        ) from error
    if not row or row.get("flight_status") in {"cancelled", "incident", "diverted"}:
        return FlightArrivalResponse()
    for source in ("actual", "estimated", "scheduled"):
        value = row["arrival"].get(source)
        if not value:
            continue
        try:
            arrival = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if arrival.tzinfo is not None:
                return FlightArrivalResponse(arrival_at=arrival, source=source)
        except (TypeError, ValueError, AttributeError):
            continue
    return FlightArrivalResponse()


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
    return GeoapifyLocations(request.app.state.settings).search(q)


@router.post(
    "/tickets/extract", response_model=TicketResponse, dependencies=[Depends(provider_budget)]
)
def ticket(
    request: Request,
    file: UploadFile = File(),
    identity: Identity = Depends(verify_token),
) -> dict:
    try:
        result = extract_ticket(
            request.app.state.settings, read_bounded(file, 5 * 1024 * 1024), file.content_type or ""
        )
        return {"details": result.model_dump(), "confirmation_required": True}
    finally:
        file.file.close()


@router.post(
    "/audio/transcribe", response_model=TranscriptResponse, dependencies=[Depends(provider_budget)]
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
            request.app.state.settings, read_bounded(file, 5 * 1024 * 1024), language
        )
        return {**result, "confirmation_required": True}
    finally:
        file.file.close()
