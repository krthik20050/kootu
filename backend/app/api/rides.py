from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.auth import current_profile
from app.core.database import get_session
from app.core.rate_limit import provider_budget
from app.models.domain import Driver, Profile, RideGroup, RideMember, RideRequest, Vehicle, now
from app.schemas.requests import TripStatusInput
from app.schemas.responses import GroupResponse, ManifestResponse, MatchResponse, RequestResponse
from app.services.matching import departure_for
from app.services.providers import GoogleRouting
from app.services.rides import (
    can_view_group,
    dissolve_group,
    locked_group,
    locked_members,
    propose_match,
    record,
    snapshot,
)
from app.services.views import group_members, group_view, request_view

router = APIRouter(tags=["rides"])


@router.get("/ride-groups/{group_id}/manifest", response_model=list[ManifestResponse])
def manifest(
    group_id: str,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> list[dict]:
    group = session.get(RideGroup, group_id)
    driver = session.get(Driver, group.driver_id) if group and group.driver_id else None
    if not driver or driver.profile_id != profile.id:
        raise HTTPException(404, "Assigned trip not found")
    return [
        {
            **request_view(row, session),
            "display_name": session.get(Profile, row.profile_id).display_name,
        }
        for row in group_members(session, group_id)
    ]


@router.post(
    "/ride-requests/{request_id}/match",
    response_model=MatchResponse,
    dependencies=[Depends(provider_budget)],
)
def match_request(
    request_id: str,
    request: Request,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    row = session.get(RideRequest, request_id)
    if not row or row.profile_id != profile.id:
        raise HTTPException(404, "Ride request not found")
    member = session.get(RideMember, request_id)
    if member:
        return {
            "matched": True,
            "group": group_view(session.get(RideGroup, member.group_id), session, profile),
        }
    # Persist a newly created identity before releasing the read transaction for routing.
    session.commit()
    group = propose_match(
        session, request_id, request.app.state.settings, GoogleRouting(request.app.state.settings)
    )
    session.flush()
    return {
        "matched": bool(group),
        "group": group_view(group, session, profile) if group else None,
        "message": None
        if group
        else (
            "No compatible passenger group and eligible vehicle yet. Your request remains waiting."
        ),
    }


@router.post("/ride-requests/{request_id}/cancel", response_model=RequestResponse)
def cancel_request(
    request_id: str,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    row = session.get(RideRequest, request_id)
    if not row or row.profile_id != profile.id:
        raise HTTPException(404, "Ride request not found")
    initial = session.get(RideMember, request_id)
    group = locked_group(session, initial.group_id) if initial else None
    if group:
        locked_members(session, group.id)
    row = session.scalar(
        select(RideRequest)
        .where(RideRequest.id == request_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    member = session.get(RideMember, request_id, populate_existing=True)
    if member:
        if group is None or member.group_id != group.id:
            raise HTTPException(409, "Group changed during cancellation; retry")
        if group.status in {"IN_PROGRESS", "COMPLETED"}:
            raise HTTPException(409, "A started trip requires operator assistance")
        row.status = "CANCELLED"
        session.execute(delete(RideMember).where(RideMember.request_id == request_id))
        session.flush()
        remaining = group_members(session, group.id)
        if len(remaining) < 2 or group.status == "PROPOSED":
            dissolve_group(session, group, "PASSENGER_CANCELLED")
        else:
            departure = departure_for([snapshot(item) for item in remaining], now())
            if departure is None:
                dissolve_group(session, group, "PICKUP_WINDOW_EXPIRED")
            else:
                group.departure_at = departure
                record(session, group.id, "GROUP_UPDATED")
    elif row.status == "COMPLETED":
        raise HTTPException(409, "A completed ride cannot be cancelled")
    row.status = "CANCELLED"
    row.version += 1
    return request_view(row, session)


@router.get("/ride-groups/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: str,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    group = session.get(RideGroup, group_id)
    if not group or not can_view_group(session, group, profile):
        raise HTTPException(404, "Ride group not found")
    return group_view(group, session, profile)


@router.post("/ride-groups/{group_id}/cancel", response_model=GroupResponse)
def release_group(
    group_id: str,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    group = locked_group(session, group_id)
    driver = session.get(Driver, group.driver_id) if group.driver_id else None
    own_trip = bool(driver and driver.profile_id == profile.id)
    if not own_trip and profile.role != "ADMIN":
        raise HTTPException(403, "Only the assigned driver or an operator can release this group")
    if group.status != "CANCELLED":
        dissolve_group(session, group, "DRIVER_CANCELLED" if own_trip else "OPERATOR_CANCELLED")
        if own_trip:
            driver.available = False
            session.get(Vehicle, group.vehicle_id).available = False
    return group_view(group, session, profile)


@router.post("/ride-groups/{group_id}/status", response_model=GroupResponse)
def trip_status(
    group_id: str,
    body: TripStatusInput,
    profile: Profile = Depends(current_profile),
    session: Session = Depends(get_session, scope="function"),
) -> dict:
    group = locked_group(session, group_id)
    driver = session.get(Driver, group.driver_id) if group.driver_id else None
    if not driver or driver.profile_id != profile.id:
        raise HTTPException(403, "Only the assigned driver can update this trip")
    expected = "ASSIGNED" if body.status == "IN_PROGRESS" else "IN_PROGRESS"
    if group.status == body.status:
        return group_view(group, session, profile)
    if group.status != expected:
        raise HTTPException(409, "Invalid trip status transition")
    members = locked_members(session, group.id)
    if body.status == "IN_PROGRESS":
        departure = departure_for([snapshot(row) for row in members], now())
        if departure is None or now() < group.departure_at:
            raise HTTPException(409, "Passengers are not ready or their wait window expired")
    group.status = body.status
    for row in members:
        row.status = body.status
        row.version += 1
    if body.status == "COMPLETED":
        driver = session.scalar(
            select(Driver)
            .where(Driver.id == group.driver_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        vehicle = session.scalar(
            select(Vehicle)
            .where(Vehicle.id == group.vehicle_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        driver.available = True
        vehicle.available = True
    record(session, group.id, "TRIP_STATUS_CHANGED")
    return group_view(group, session, profile)
