"""Server-only Geoapify adapter with a bounded, short-lived process cache."""

import hashlib
import time
from collections import OrderedDict
from threading import Lock

import httpx2 as httpx
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.integrations import Coordinates, RouteEstimate
from app.services.providers import GoogleRouting, provider_json, require_key

_lock = Lock()
_cache: OrderedDict[tuple, tuple[float, dict]] = OrderedDict()
_last_request = 0.0


class GeoapifyRouting:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _get(self, endpoint: str, params: dict) -> dict:
        global _last_request
        key = require_key(self.settings.geoapify_api_key, "Geoapify")
        fingerprint = hashlib.sha256(key.encode()).hexdigest()
        cache_key = (fingerprint, endpoint, tuple(sorted(params.items())))
        # Coalesce identical concurrent requests and stay under 5 requests/sec in
        # one process. Multiple replicas need a shared rate limiter before scaling.
        with _lock:
            cached = _cache.get(cache_key)
            if cached and time.monotonic() - cached[0] < 300:
                _cache.move_to_end(cache_key)
                return cached[1]
            time.sleep(max(0, 0.26 - (time.monotonic() - _last_request)))
            _last_request = time.monotonic()
            try:
                with httpx.Client(timeout=10) as client:
                    response = client.get(
                        f"https://api.geoapify.com/v1/{endpoint}",
                        params={**params, "apiKey": key},
                    )
            except httpx.RequestError:
                # Do not propagate a provider URL containing the API key.
                raise HTTPException(502, "Geoapify is temporarily unreachable; retry") from None
            if response.status_code == 429:
                raise HTTPException(
                    503, "Geoapify quota reached; try later", headers={"Retry-After": "60"}
                )
            data = provider_json(response, "Geoapify")
            # Validate provider data in estimate/search before exposing it. Failed
            # HTTP responses are never cached; all entries expire after five minutes.
            _cache[cache_key] = (time.monotonic(), data)
            _cache.move_to_end(cache_key)
            while len(_cache) > 256:
                _cache.popitem(last=False)
            return data

    def estimate(self, origin: Coordinates, destination: Coordinates) -> RouteEstimate:
        data = self._get(
            "routing",
            {
                "waypoints": f"{origin.latitude},{origin.longitude}|"
                f"{destination.latitude},{destination.longitude}",
                "mode": "drive",
                "units": "metric",
                "format": "json",
            },
        )
        try:
            route = data["results"][0]
            return RouteEstimate(distance_metres=route["distance"], duration_seconds=route["time"])
        except (KeyError, IndexError, TypeError, ValueError, ValidationError):
            raise HTTPException(502, "Geoapify returned no usable road route") from None

    def search(self, query: str) -> list[dict]:
        data = self._get(
            "geocode/search",
            {
                "text": " ".join(query.split()),
                "filter": "countrycode:in",
                "limit": 5,
                "format": "json",
            },
        )
        try:
            rows = data["results"]
            if not isinstance(rows, list):
                raise ValueError("Invalid results")
            return [
                {
                    "name": row["formatted"],
                    "place_id": row["place_id"],
                    "coordinates": Coordinates(
                        latitude=row["lat"], longitude=row["lon"]
                    ).model_dump(),
                }
                for row in rows[:5]
            ]
        except (KeyError, TypeError, ValueError, ValidationError):
            raise HTTPException(502, "Geoapify location search returned invalid data") from None


def routing_for(settings: Settings) -> GeoapifyRouting | GoogleRouting:
    return (
        GeoapifyRouting(settings)
        if settings.routing_provider == "geoapify"
        else GoogleRouting(settings)
    )
