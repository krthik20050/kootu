# kootu architecture

The implemented system has one Next.js frontend, one FastAPI application and PostgreSQL/PostGIS. Matching is deterministic. Grok suggests flight fields; Sarvam returns words for human review. Neither decides safety eligibility or ride compatibility.

## Responsibility map

| Module | Owns |
| --- | --- |
| `apps/web/src/components/workspace` | Passenger booking/intake, driver offers/trips and operator review |
| `apps/api/app/core` | Settings, trusted Clerk verification, transaction dependencies, shared provider budgets |
| `apps/api/app/api` | Input/output contracts, roles, resource ownership and lifecycle routes |
| `apps/api/app/models/domain.py` | Persistent profiles, requests, drivers, vehicles, groups, memberships, offers and events |
| `apps/api/app/services/matching.py` | Pure whole-cluster constraints and deterministic ordering |
| `services/rides.py` | Candidate retrieval, road verification and locked state transitions |
| `services/providers.py` | Bounded Google, Grok, Sarvam and Aviationstack adapters |
| `services/flight_updates.py` | Flight adjustments, stale offers and bounded rematching |

FastAPI's OpenAPI owns wire contracts. `export_contracts.py` generates the committed OpenAPI snapshot and frontend model types. CI rejects drift. Domain-specific response models prevent accidentally serializing private ORM fields.

## Session and privacy

Clerk token acquisition stays in the browser's active session; tokens are passed as bearer credentials, never saved to localStorage. Backend verification pins RS256, issuer, time claims and exact authorized frontend origin, with optional audience. JWT role claims are ignored: kootu profile records control roles. New profiles begin as passengers; onboarding can set DRIVER but cannot approve them. Only a configured trusted operator subject can bootstrap ADMIN.

All private endpoints verify authentication. Passengers access their own requests; operators review applications; drivers access their own fleet/offers. Only assigned drivers see manifests. Groups expose counts and a representative destination label, not other passengers' exact addresses or notes. RLS denies direct browser database access; the server role must have explicitly provisioned access. Signing in does not verify a government identity or a driver's licence.

## Transactions and providers

Database mutations commit before returning success. Conflicts roll back with 409; unavailable storage returns 503. Requests have client UUIDs for safe retries and versions for matching revalidation. Membership primary keys and unique active driver/vehicle indexes back application checks. Road calls run after releasing the candidate read transaction, then locked snapshots are revalidated before the proposal is committed. Concurrent conflicts may require a retry; no zero-error guarantee is made.

Private provider-backed endpoints have PostgreSQL-shared hourly limits. Upload files are bounded, validated, stripped of image metadata where possible, and closed after processing. Grok's prompt treats document text as untrusted. Extraction/transcription results require review; only explicit structured needs affect eligibility. Provider failures return safe errors, never synthetic success or unverified road matches.

## Maintenance

The lifespan starts a polling loop outside tests. PostgreSQL session advisory locking allows one maintenance cycle across processes; a separate connection holds the lock while per-ride transactions remain short. Flight lookup happens outside row locks. Arrival delta is applied to the original ready time, so repeated polls do not accumulate delay. Missing estimates preserve the previous ready time. Feasible groups keep their members; incompatible groups/flight cancellations release others to waiting. Started/completed trips are not rematched automatically. Expired or declined proposals return to matching. UI state polls every 15 seconds; no unauthenticated realtime channel exists.

The API must remain awake for maintenance. Flight account coverage, poll latency and actual pickup operations remain external constraints. Future scale could need a dedicated worker, but no queue/Redis is introduced for this pilot.

## Configuration and deployment

See README and database role setup. `/health` is liveness; `/ready` is configuration/table availability, explicitly not provider credential verification. Logs omit bodies, tokens, keys and exception messages. Use HTTPS in production and disable URL access logging. Database migrations are explicit deployment steps; startup never silently creates tables. Vercel and Render are targets, not completed deployments.

Frontend uses the existing cream/green system, readable native forms and clear waiting/approval/error states. No generic AI claims or fabricated ride inventory. Accessibility and performance targets require browser/audit measurement before making scored claims.
