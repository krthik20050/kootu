# kootu validation record

Checked 11 October 2026 around 01:01 IST on Windows with Python 3.13 and Node 22; live account keys were not supplied.

## Verified locally

- Backend: **53 passed** with FastAPI TestClient and an actual disposable PostgreSQL 17/PostGIS 3.5 container. Tests include migration application/hash protection, documented dedicated-server role provisioning, browser-role RLS denial, indexed spatial storage, durable requests after reconnection, UUID retries/changed-payload conflicts, ownership/role protection and generated RSA JWT/JWK validation.
- Ride behavior: compatible grouping, wait/seat/luggage/equipment/safety constraints, directed road rejection, driver/vehicle approval, atomic acceptance, competing drivers, competing groups for one vehicle, duplicate-membership prevention, expiry, passenger cancellation, driver release, trip start/completion, flight cancellation, repeated delay and missing arrival estimates.
- Provider adapter contract tests: Google Routes payload/field mask, Grok structured image output, Sarvam multipart WAV transcription, Aviationstack exact flight/airport/date filtering, malformed/error responses, invalid uploads, consent and missing keys. These use mocked HTTP transports; no live paid request or production ticket was sent.
- Frontend: **8 interaction/client tests passed** for reviewed booking data and needs, stable retry IDs, backend error display, transcript review, offer acceptance, denied operator access, bearer JSON/multipart requests and configuration errors. These render components in jsdom with test fixtures, not a live authenticated browser session.
- Web lint, strict TypeScript and production build passed for `/`, `/passenger`, `/driver`, `/admin`. Production dependency audit returned 0 vulnerabilities. The full audit retains 5 high advisories in development ESLint dependencies; no forced breaking upgrade was used.
- Backend Ruff lint/format, generated OpenAPI/TypeScript drift check and `pip check` passed. git diff whitespace checks passed.
- Browser review: public landing and navigation to the passenger/driver setup states were checked in the in-app browser at the narrow default viewport and1366x900. The viewport override was reset. Auth-disabled pages accurately require setup and show no fabricated rides. Authenticated feature layouts were exercised by interaction tests; live browser sign-in has not been tested.

## Remote evidence

The backend milestone `1a1f33babdd10980c7f960a8e73d1b21804573f4` passed [GitHub Actions](https://github.com/krthik20050/kootu/actions/runs/38078412613), including its 45-test backend/database suite. The completed connected implementation `3a03e7ce8cf957b783bd9a954f951a59060e21f8` passed [its expanded GitHub Actions run](https://github.com/krthik20050/kootu/actions/runs/38080277973), including 53 backend and 8 frontend tests, lint/types/build and contract checks. CI provides PostgreSQL/PostGIS, so database tests do not skip there.

## Activation still needed

Provision a PostgreSQL/Supabase database, apply migrations, provision its server role, fill the ignored API/web env files, enable Google Routes/Geocoding, select an account-supported vision/structured-output Grok model, and configure Clerk origins/issuer/operator subject. Approve real drivers and vehicles after document review. Confirm Aviationstack coverage and account plan access. Rebuild/restart the web app after public env changes.

Then run a real multi-account smoke test: sign-in, destination lookup, consented test-ticket extraction, short consented WAV transcription, two compatible arrivals, offer acceptance, pickup/trip lifecycle and flight update behavior. Provider keys alone do not verify account permissions, credentials, coverage or operating availability.

No cloud deployment, payment/fare system, GPS/emergency service, commercial document verification, participant identities or final organizer submission were completed. Continuous polling requires an awake host; a sleeping host pauses maintenance. The algorithm is a bounded heuristic, not a global route/cost optimizer or a guarantee of a cab. Main-branch review protections are documented and require enabling by the repository owner; CI files alone do not enforce them.
