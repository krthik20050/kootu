from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import current_profile
from app.core.database import get_session
from app.models.domain import Profile, RideRequest
from app.schemas.requests import ProfileUpdate, RideRequestInput
from app.schemas.responses import ProfileResponse, RequestResponse
from app.services.views import request_view

router = APIRouter(tags=["passengers"])


@router.get("/me", response_model=ProfileResponse)
def me(profile: Profile = Depends(current_profile)) -> dict:
    return {
        "id": profile.id,
        "role": profile.role,
        "display_name": profile.display_name,
        "women_only_eligible": profile.women_only_eligible,
    }


@router.patch("/me", response_model=ProfileResponse)
def update_me(body: ProfileUpdate, profile: Profile = Depends(current_profile)) -> dict:
    profile.display_name = body.display_name
    profile.women_only_eligible = body.women_only_eligible
    return me(profile)


@router.post("/ride-requests", status_code=201, response_model=RequestResponse)
def create_request(
    body: RideRequestInput,
    request: Request,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    # Serialize submissions for one account across API workers. A retry must see
    # the first transaction's committed row before checking its client UUID.
    profile = session.scalar(
        select(Profile)
        .where(Profile.id == profile.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    existing = session.get(RideRequest, body.client_request_id)
    if existing:
        if existing.profile_id != profile.id:
            raise HTTPException(409, "Request identifier already exists")
        original = body.model_dump(
            exclude={"destination", "client_request_id", "flight_details_confirmed", "ready_at"}
        )
        if (
            any(getattr(existing, key) != value for key, value in original.items())
            or existing.baseline_ready_at != body.ready_at
            or existing.latitude != body.destination.latitude
            or existing.longitude != body.destination.longitude
        ):
            raise HTTPException(
                409, "This request identifier was already used for different details"
            )
        return request_view(existing, session)
    active = session.scalar(
        select(RideRequest.id)
        .where(
            RideRequest.profile_id == profile.id,
            RideRequest.airport == body.airport,
            RideRequest.flight_date == body.flight_date,
            RideRequest.status.in_(("WAITING", "MATCHED", "ASSIGNED", "IN_PROGRESS")),
        )
        .limit(1)
    )
    if active:
        raise HTTPException(
            409,
            "You already have an active booking for this airport and arrival date. "
            "Use that booking, or cancel it before submitting a replacement.",
        )
    if body.women_only and not profile.women_only_eligible:
        raise HTTPException(
            422, "Confirm that every passenger in your party is eligible for a women-only ride"
        )
    if body.passengers > request.app.state.settings.max_group_seats:
        raise HTTPException(422, "Your party exceeds the configured shared-cab capacity")
    values = body.model_dump(
        exclude={"destination", "flight_details_confirmed", "client_request_id"}
    )
    row = RideRequest(
        id=body.client_request_id,
        profile_id=profile.id,
        baseline_ready_at=body.ready_at,
        latitude=body.destination.latitude,
        longitude=body.destination.longitude,
        **values,
    )
    session.add(row)
    session.flush()
    return request_view(row, session)


@router.get("/ride-requests", response_model=list[RequestResponse])
def list_requests(
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    if not 1 <= limit <= 100 or not 0 <= offset <= 10000:
        raise HTTPException(422, "Invalid pagination")
    rows = session.scalars(
        select(RideRequest)
        .where(RideRequest.profile_id == profile.id)
        .order_by(RideRequest.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return [request_view(row, session) for row in rows]
