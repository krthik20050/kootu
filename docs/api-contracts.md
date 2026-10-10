# API contracts

FastAPI `/openapi.json` is the API source of truth. Interactive documentation is at `/docs`. Only the health endpoint is implemented.

## GET /health

Public process liveness, HTTP 200:

```json
{"status":"ok","service":"cootu-api","version":"0.1.0","environment":"development"}
```

Environment is `development`, `test` or `production`. This does not prove database, Clerk, maps or matching readiness. The frontend health client validates this response and uses an eight-second timeout. The landing is static concept content and does not invent a connected API indicator.

Validation errors use HTTP 422 with `detail: "Invalid request"` and an `errors` array of locations/types; rejected input values are omitted. Unexpected failures return HTTP 500 with `detail: "Internal server error"`. FastAPI's normal 404 remains in place. Public client errors retain HTTP status without exposing raw backend response bodies.

## Planned resource conventions

| Resource | Intended responsibility |
| --- | --- |
| `/passengers` | Passenger profile, subject/ownership enforced |
| `/ride-requests` | Airport, flight, ready window, coordinates, party/luggage, wait and safety preferences |
| `/ride-groups` | Proposed membership, cluster, capacity and lifecycle |
| `/drivers` | Driver onboarding and separate approval status |
| `/driver-offers` | Expiring offer, acceptance/rejection, atomic assignment |
| `/vehicles` | Approved seats/luggage capacity and availability |
| `/matches` | Candidate evaluation and authorized matching operations |

These paths have no routes today. Private endpoints require verified Clerk bearer tokens and backend role/ownership checks. Plan UTC ISO-8601 timestamps, stable UUID identifiers, validated coordinate ranges, explicit status enums, bounded pagination and idempotency for booking/offer mutations. Do not expose another passenger's ticket, phone or full destination to unauthorized users. Model a group containing parties, not one seat per request regardless of passenger count.

Define cancellation and stale-state conflicts explicitly (e.g. 409), and use transactions/version checks for membership and assignment races. Document exact schemas in FastAPI before generating frontend types. No hand-authored speculative CRUD or cross-language shared package.

## Planned notification projection

Useful future event names: `MATCH_FOUND`, `GROUP_UPDATED`, `DRIVER_ASSIGNED`, `DRIVER_ACCEPTED`, `PASSENGER_CANCELLED`, `TRIP_STATUS_CHANGED`. Persist authoritative state first, then expose minimal authorized projections through Supabase Realtime if it improves the experience. Clerk identity must map to a supported Realtime authorization policy; never use a service-role key in the browser. No event bus or Realtime subscription is implemented.
