from typing import Protocol

from app.schemas.integrations import Coordinates, ExtractedFlight, RouteEstimate


class RoutingProvider(Protocol):
    def estimate(self, origin: Coordinates, destination: Coordinates) -> RouteEstimate:
        """Return a road estimate; adapters must enforce timeout and provider error handling."""
        ...


class TicketExtractor(Protocol):
    def extract(self, document: bytes, media_type: str) -> ExtractedFlight:
        """Receive a size/type-validated document; results require passenger confirmation."""
        ...
