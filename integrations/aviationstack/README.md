# Aviationstack flight updates

Server settings: AVIATIONSTACK_API_KEY, FLIGHT_POLL_SECONDS.

Implementation: backend/app/services/flight_updates.py.

Provider adapter: backend/app/services/providers.py. The polling worker needs a running backend and a direct/session-pooled PostgreSQL connection.

See [integration index](../README.md) and [root setup](../../README.md) for credentials, consent and deployment. Live-query access returned HTTP 200. The free-plan query omits paid historical filters and matches the returned flight date exactly; historical/future coverage is not guaranteed.

`GET /flights/arrival` provides the request review with actual/estimated/scheduled landing time for the selected airport and scheduled arrival date in IST. It requires authentication and uses a separate per-user hourly budget of 30 lookups. The chat suggests landing plus 30 minutes and supports five-minute adjustments; no flight match means manual entry. Existing ride polling continues using its original exact flight-date matching.
