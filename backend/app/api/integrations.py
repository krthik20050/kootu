from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile

from app.core.auth import Identity, verify_token
from app.core.rate_limit import provider_budget
from app.schemas.responses import LocationResponse, TicketResponse, TranscriptResponse
from app.services.providers import GoogleRouting, extract_ticket, transcribe_audio

router = APIRouter(tags=["integrations"])


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
