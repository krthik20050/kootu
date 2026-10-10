# API contracts

`GET /openapi.json` and `/docs` describe the running API; `docs/openapi.json` is the committed snapshot. Generate frontend types with `python export_contracts.py` from `backend`. CI uses `--check`. Input models forbid extra fields, including attempted role/approval escalation.

| API area | Implemented routes |
| --- | --- |
| Public health | `GET /health`, `GET /ready` |
| Own profile | `GET /me`, `PATCH /me` |
| Passenger arrivals | `POST /ride-requests`, `GET /ride-requests`, `POST /ride-requests/{id}/match`, `POST /ride-requests/{id}/cancel` |
| Group/trip | `GET /ride-groups/{id}`, assigned-driver `GET /ride-groups/{id}/manifest`, assigned-driver `POST /ride-groups/{id}/status`, driver/operator `POST /ride-groups/{id}/cancel` |
| Driver/fleet | `POST /drivers`, `GET /drivers/me`, `PATCH /drivers/me/availability`, `POST /vehicles`, `GET /vehicles`, `PATCH /vehicles/{id}/availability` |
| Offers | `GET /driver-offers`, `POST /driver-offers/{id}/accept`, `POST /driver-offers/{id}/reject` |
| Operator | `GET /admin/drivers`, `GET /admin/vehicles`, `POST /admin/drivers/{id}/verification`, `POST /admin/vehicles/{id}/verification`, `POST /admin/ride-groups/{id}/offers` |
| Providers | `GET /locations/search?q=...`, multipart `POST /tickets/extract`, multipart `POST /audio/transcribe` |

All areas other than public health require a valid Clerk bearer token. Ownership/role checks are server-side. The bootstrap operator subject is a server setting, never a request field. Operator approval cannot self-approve a licence or vehicle and cannot change approval during an active assigned trip.

## Booking and intake

`RideRequestInput` defines fields: client-generated UUID, airport/flight/date, timezone-aware ready time, max wait, destination name/pin, passengers/luggage, optional women-only/wheelchair/child-seat/pet/notes and `flight_details_confirmed: true`. Repeating the same UUID and original data is idempotent; a changed payload or other owner returns409. Ready times are bounded to the next 30 days (five-minute clock grace); flight date must agree within one day. Request list pagination is bounded.

Ticket/audio multipart forms require `file` and `consent=true`; audio optionally accepts supported `language`. Uploads max 5 MB; text PDF max 3 pages, images max 12 megapixels, WAV max 30 seconds. Scanned PDFs must be supplied as JPG/PNG. Both return `confirmation_required: true`. Transcript notes must be reviewed and structured equipment selections made separately.

## States and errors

Requests: WAITING → MATCHED → ASSIGNED → IN_PROGRESS → COMPLETED, plus CANCELLED/FLIGHT_CANCELLED and transitions back to WAITING during rematching. Groups: PROPOSED → ASSIGNED → IN_PROGRESS → COMPLETED or CANCELLED before start. Driver offers: PENDING → ACCEPTED/REJECTED/EXPIRED/WITHDRAWN. Only the assigned driver can start/complete; starting before readiness or after wait expiry fails.

401 invalid session;403 denied role/action;404 inaccessible/not-found resource;409 stale state/conflict;413 oversized file;415 unsupported file type;422 invalid data;429 provider request budget;502 provider failure;503 missing configuration or unavailable storage. Validation errors omit rejected values. Internal errors never expose credentials or uploaded data. Frontend passes session tokens transiently and renders backend messages as text, not HTML.

`/ready` reports configured checks and `provider_credentials_verified: false`. It is not a live account smoke test. Routine API timeout is 8s; extraction/transcription 45s and matching 150s permit bounded external requests. UI refreshes every 15s while visible. Production should align ingress timeouts with those operations.
