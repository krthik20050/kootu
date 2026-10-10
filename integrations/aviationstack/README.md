# Aviationstack flight updates

Server settings: AVIATIONSTACK_API_KEY, FLIGHT_POLL_SECONDS.

Implementation: backend/app/services/flight_updates.py.

Provider adapter: backend/app/services/providers.py. The polling worker needs a running backend and a direct/session-pooled PostgreSQL connection.

See [integration index](../README.md) and [root setup](../../README.md) for credentials, consent and deployment. Live provider authentication has not yet been verified.
