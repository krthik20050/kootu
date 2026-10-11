from datetime import timedelta

from app.models.domain import RideGroup, now
from app.services.matching import utc


def clear_location(group: RideGroup) -> None:
    group.driver_latitude = None
    group.driver_longitude = None
    group.driver_accuracy_metres = None
    group.driver_location_captured_at = None
    group.driver_location_updated_at = None


def location_view(group: RideGroup) -> dict | None:
    if group.status not in {"ASSIGNED", "IN_PROGRESS"} or group.driver_location_captured_at is None:
        return None
    return {
        "coordinates": {"latitude": group.driver_latitude, "longitude": group.driver_longitude},
        "accuracy_metres": group.driver_accuracy_metres,
        "captured_at": group.driver_location_captured_at,
        "updated_at": group.driver_location_updated_at,
        "stale": now() - utc(group.driver_location_captured_at) > timedelta(seconds=60),
    }
