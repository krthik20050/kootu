# kootu

Latest backend: [destination clusters and database architecture](docs/database-architecture.md). Nearby-city groups now default to up to six passengers/six bags subject to actual approved vehicle capacity. Concurrent booking retries, duplicate arrival bookings, missed pickup cleanup and stale flight callbacks are covered by database regressions. Migrations through `202610110004_arrival_booking_integrity.sql` are applied to the existing Supabase database; production ride-flow verification still needs routing and signed-in users.

**Land together. Leave together.** Shared airport rides for passengers with compatible arrival times and nearby drop-offs.

## What works

- Passenger, driver and operator web workspaces connected to FastAPI, with Clerk bearer sessions and server-owned roles.
- PostgreSQL/PostGIS persistence; deterministic grouping by airport, ready/wait window, whole-cluster destination proximity, seats, luggage, women-only policy, wheelchair spaces, child seats and pets. Google road-distance verification is required before a group is created.
- Driver/vehicle operator approval, availability, expiring offers, atomic acceptance, passenger cancellation and trip start/completion. Exact drop-offs and private notes are available only to the assigned driver; other passengers receive aggregate group information.
- Groq ticket-first autofill for JPG/PNG and PDFs (including scans, up to three pages): review editable flight details, passenger name and count before saving. Unknown flight fields stay empty. Continue through arrival review and destination steps. Dictate directly into the optional special-instructions box; Sarvam transcription appends automatically. Brief confetti follows a successful save. Explicit structured needs affect matching; free text does not automatically reserve equipment. [Flow, research and limits](docs/ticket-voice-intake.md).
- Automatic Aviationstack flight polling adjusts ready times from the original baseline, preserves feasible groups, and releases incompatible/cancelled groups for rematching. A PostgreSQL advisory lock coordinates maintenance across processes; no queue service is required.
- Generated OpenAPI/TypeScript contracts, SQL migration runner, PR template, GitHub CI and [collaboration guide](CONTRIBUTING.md).

Local regression coverage includes real PostgreSQL 17/PostGIS 3.5, signed JWT validation, concurrency and provider contract fixtures. **The website and backend are deployed and connected to Supabase and a Clerk development instance; Groq ticket extraction and Sarvam transcription passed synthetic live checks; Aviationstack live-query access passed, while a matching real flight and the signed-in ride flow remain unverified.** The keyless preview shows a setup state instead of fabricated bookings. Adding keys also requires applying migrations, enabling provider products, selecting a compatible Groq vision model and approving real drivers/vehicles. No claim of guaranteed rides or zero defects is made.

This is a coordination MVP. Payments, fare quotes, GPS tracking, emergency dispatch, passenger identity verification and commercial operating procedures are not implemented. Driver approval records an operator decision; kootu does not verify government documents automatically. See [competitor research](docs/competitor-analysis.md) and [validation](docs/backend-validation.md).

Built from scratch for the DevDay Exchange Community Hackathon: Kochi, 10–11 October 2026. [RULES.md](RULES.md) permits a team of at most four; the 23-person workflow in CONTRIBUTING applies outside that event or with organizer approval. Participant identities and submission details remain in [SUBMISSION.md](SUBMISSION.md).

## Stack and ownership

Start here when choosing what to work on:

```text
kootu/
├── frontend/                 # Website, screens and browser API client
│   ├── src/app/(driver_app)/ # Driver routes
│   ├── src/app/(user_app)/   # Home, passenger and operator routes
│   ├── src/app/              # Shared layout and global styles
│   ├── src/components/       # Shared UI and workspace components
│   ├── src/lib/api/          # Backend client and generated contract types
│   └── tests/                # Frontend tests
├── backend/                  # FastAPI application and Python tooling
│   ├── app/api/              # HTTP routes
│   ├── app/core/             # Settings, authentication and database connection
│   ├── app/models/           # Persistent domain models
│   ├── app/schemas/          # Request and response validation
│   ├── app/services/         # Matching, ride lifecycle and server API adapters
│   └── tests/                # Backend and database integration tests
├── database/
│   └── migrations/           # Ordered PostgreSQL/PostGIS schema changes
├── integrations/             # External API setup guides and code locations
│   ├── clerk/
│   ├── google-maps/
│   ├── groq/
│   ├── sarvam/
│   └── aviationstack/
├── docs/                     # Architecture, contracts and validation
└── .github/workflows/        # CI checks
```

Each main folder has its own README. Provider secrets and executable adapters belong to the backend; `integrations` explains each connection without putting private keys in browser code. Previous `apps/web`, `apps/api` and `supabase/migrations` paths are now `frontend`, `backend` and `database/migrations`. Historical changelog/validation records retain their original paths.

`frontend`: Next.js 16, React 19, TypeScript, Tailwind 4 and Clerk. The `(driver_app)` and `(user_app)` folders are Next.js route groups, so they organize each role's pages without changing `/driver`, `/passenger`, `/admin` or `/`. Shared components, authentication, styles and API calls stay in `src/components`, `src/app` and `src/lib`. `backend`: FastAPI/Pydantic, SQLAlchemy/psycopg, PyJWT. `database/migrations`: PostgreSQL/PostGIS SQL. `docs/openapi.json` and `frontend/src/lib/api/generated.ts` are exported from the backend, not edited independently. No microservices, Redis, AI matching, or message brokers. Docker is optional for disposable database tests, not an application prerequisite.

[Architecture](docs/architecture.md) · [Database](docs/database.md) · [Matching](docs/matching-engine.md) · [API](docs/api-contracts.md)

[Backend research and hardening plan](docs/backend-research-and-plan.md) explains current parameters, competitor/research approaches, database invariants and remaining failure modes. The local hardening milestone adds distinct-account groups, prefiltered candidate selection, bounded road alternatives and fair maintenance attempts. Apply migration `202610110003_matching_integrity.sql` before deploying this backend; it has not been applied to the hosted database in this milestone. Frontend API contracts remain unchanged.

## Local setup

Use Node **22.12+**, npm, Python **3.13** (project requires 3.12+), Git and a PostgreSQL database with PostGIS. Python uses pip + venv.

PowerShell, in `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.lock
.\.venv\Scripts\python -m pip install --no-deps -e .
Copy-Item .env.example .env
# Fill server-only settings. Apply migrations using a database migration owner:
.\.venv\Scripts\python migrate.py
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

In `frontend`, another terminal:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. Use that same origin in `FRONTEND_URL`; `localhost` and `127.0.0.1` are different origins for CORS and Clerk `azp`. Without database/keys, `/health` and the public shell work, while private functionality fails with an explicit configuration error. `/ready` checks configuration and table availability; it does not authenticate provider credentials. macOS/Linux use `cp` and `.venv/bin/python`.

## Fill these settings

| Location | Settings | Purpose |
| --- | --- | --- |
| Web `.env.local` | `NEXT_PUBLIC_API_URL` | API base URL |
| Web `.env.local` | `NEXT_PUBLIC_AUTH_ENABLED=true`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Enable real sign-in; secret stays server-only |
| API `.env` | `DATABASE_URL` | PostgreSQL connection, migrations applied; [role setup](docs/database.md) |
| API `.env` | `CLERK_ISSUER`, optional `CLERK_AUDIENCE` | Exact trusted instance origin; JWKS derived from it |
| API `.env` | `BOOTSTRAP_ADMIN_SUBJECT` | Trusted operator's Clerk user ID; creates ADMIN after that user signs in |
| API `.env` | `GOOGLE_MAPS_API_KEY` | Enable Routes API and Geocoding API for this server key |
| API `.env` | `GROQ_API_KEY`, `GROQ_MODEL` | Groq vision model with JSON mode and server validation |
| API `.env` | `SARVAM_API_KEY`, `SARVAM_MODEL=saaras:v3` | Speech-to-text; browser recordings convert to mono 16 kHz WAV, up to two minutes, split into short provider requests |
| API `.env` | `AVIATIONSTACK_API_KEY` | Plan with HTTPS flight lookup and the necessary coverage/date access |
| API `.env` | `FRONTEND_URL`, `APP_ENV` | Exact origin; production requires HTTPS |

Examples also expose configurable radius (3000m), seats/luggage (4 each), wait5–120 minutes, offer expiry300 seconds, and polling900 seconds. The web passenger form targets the default six-seat/six-luggage pilot policy. Provider usage can cost money; configure quotas/billing limits in the provider accounts. App limits per signed-in user per hour: ticket 20, audio 30, matching 30, destination search 100. Polling bounds each cycle to 30 active flight requests and 5 matching attempts.

`DISPATCH_HORIZON_MINUTES=30` (allowed 5–120) keeps advance requests waiting until close to readiness, instead of reserving today's fleet for a distant booking. Automatic matching skips expired/out-of-horizon requests and rotates by attempt time; flight polling rotates even after failures or empty results. Proposal expiry processes at most 100 groups per cycle. Road alternatives share a per-attempt budget of 12 directed calls under the default four-seat policy. These are bounded heuristics, not guaranteed wait times or global provider spending caps.

Keys never go in Git, screenshots or chat. Public Next.js variables are baked into a build; rebuild after changing them. Raw tickets/audio are transient uploads, closed after processing; provider retention terms still apply. Choosing a ticket or stopping microphone dictation initiates processing; there are no additional consent checkboxes in the booking flow. Notes should contain only useful ride details.

## Checks

In `frontend`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --omit=dev`.

In `backend`:

```powershell
.\.venv\Scripts\python -m ruff check .
.\.venv\Scripts\python -m ruff format --check .
.\.venv\Scripts\python -m pytest
.\.venv\Scripts\python export_contracts.py --check
```

Set `TEST_DATABASE_URL` to a **disposable** PostgreSQL/PostGIS database whose name contains `test`. Tests drop/recreate its public schema and truncate test tables; never use a shared/production database. If omitted, database tests skip locally; CI supplies the database and runs them. The current isolated local container uses port55432 and ignored `.env.test` files; no credentials are committed.

After a contract change run `python export_contracts.py`, review both generated files and commit them with the backend change. CI detects contract drift. npm/pip lockfiles pin installed versions. Production npm audit is separate from dev tooling; known ESLint dependency advisories are disclosed in validation, without forced incompatible upgrades.

## Demo walkthrough

1. Configure the database and providers, apply migrations, enable Clerk, then restart both apps.
2. Sign in with an operator matching `BOOTSTRAP_ADMIN_SUBJECT`; visit `/admin`.
3. A different user visits `/driver`, submits a licence reference and vehicle. Operator reviews actual documents and approves both. Driver sets both available.
4. Two passenger accounts visit `/passenger`, confirm arrival details and choose nearby destination pins, overlapping ready times and compatible needs. Save and match. A group is proposed only when road verification and capacity checks succeed.
5. Driver accepts under `/driver`, views assigned drop-offs, starts after ready time, then completes. Passenger status refreshes every 15 seconds.
6. Demonstrate cancellation or a provider-confirmed delay: affected groups return to waiting when required. The maintenance worker runs while the API process is awake; a sleeping host cannot continuously poll flights.
7. Without keys, demonstrate only the honest setup state, `/health`, `/ready` and the test suite; do not portray those as a live ride demo.

## Deployment

Vercel root `frontend`, Node 22.12+, install `npm ci`, build `npm run build`. Render root `backend`, Python 3.13, build `python -m pip install -r requirements.lock` then `python -m pip install --no-deps .`; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT --no-access-log`. Set production HTTPS origins and server secrets. Apply reviewed migrations separately before releasing; use a direct/session-pooled PostgreSQL connection for advisory locks, not transaction-mode pooling. Set an ingress upload limit around 6MB and provider/request timeouts that permit bounded matching. A host that sleeps requires a continuously running worker or a later approved scheduled-job setup for continuous flight refresh. The Vercel public setup website has been deployed as documented below; the hosted backend and Supabase connection are verified below.

### Current Vercel deployment

[Public website](https://kootu-five.vercel.app) · [Vercel project](https://vercel.com/krthik20050s-projects/kootu)

The existing `krthik20050` account owns the project. GitHub `krthik20050/kootu` is connected, with root `frontend`, Next.js preset, Node project setting `22.x` and install command `npm ci`. The initial production deployment reached READY, and its homepage and passenger setup state were browser-verified on 11 October 2026. Vercel warns that the package's `>=22.12.0` engine range can select a later major runtime.

Production uses `NEXT_PUBLIC_AUTH_ENABLED=true` and `NEXT_PUBLIC_API_URL=https://kootu-api-k5eh.onrender.com`, with Clerk credentials stored in Vercel. Preview stays auth-disabled because the backend authorizes only the stable public origin. Clerk uses development keys for the hackathon demo on the Vercel-provided domain; no production Clerk instance is configured. Groq, Sarvam and Aviationstack settings have been stored privately. Synthetic Groq/Sarvam requests passed; Aviationstack live access passed. Google Maps remains missing, so road matching is unavailable. The website calls FastAPI; only FastAPI receives the Supabase database connection string.

For future CLI deployments, run from the repository root (the project already specifies `frontend`):

```powershell
vercel link --yes --project kootu --scope krthik20050s-projects
vercel deploy --prod --scope krthik20050s-projects
```

Do not deploy from `frontend` after setting the remote root directory, since that can apply the subdirectory twice. `.vercelignore` excludes local environment files, dependencies and build output. Keep real credentials in the appropriate hosting environment. GitHub deploys are subject to Vercel's account/commit-author permissions; a connected repository does not grant teammates deployment access.

### Current Supabase connection

[Supabase project](https://supabase.com/dashboard/project/hsxahwksjlvtrgpbrwvc): `kootu`, Mumbai (`ap-south-1`), existing approved organization. CLI 2.120.0 is linked via `database/supabase`. All three migrations, nine application tables with RLS and nine policies restricted to `kootu_api` were verified remotely, along with backend-role login and session advisory locks. `backend/.env` now connects the local API to the session pooler with TLS. Owner and API passwords remain in ignored files, outside Git and the frontend.

The hosted FastAPI service now uses the dedicated server-role connection and verified Clerk issuer. Provider keys and an operator identity still need configuring before the full ride workflow can run.



### Current backend and Clerk setup

[Render API](https://kootu-api-k5eh.onrender.com/health) · [Render service dashboard](https://dashboard.render.com/web/srv-db59t3nlot8c73e7be60)

`kootu-api` runs Python 3.13.9 on a free Render service in Singapore, from `backend`, with GitHub auto-deploy. `render.yaml` records the deployment settings and passed Render blueprint validation; its `sync: false` values are supplied privately, never committed. The current service was created through the CLI. Do not create another service just to apply this file.

Clerk application `app_3KWBNZTTRjtIZHSHZSAgL8Fc6wt` has development instance `ins_3KWBNbW7Wcy2xQRybxK7x40CiQB`, issuer `https://dear-lionfish-4707.clerk.accounts.dev`. Its RSA JWKS endpoint was verified, and its keys were saved to Vercel after explicit user approval. The Render backend requires only the issuer for session verification, not the Clerk secret key. The auth-enabled Vercel deployment reached READY and the live passenger page opened the Clerk modal with Google/email sign-in. CI passed for implementation checkpoint `17e7aef` ([run 38083829579](https://github.com/krthik20050/kootu/actions/runs/38083829579)). A completed end-user session and authenticated ride workflow still await human sign-in; loading the modal does not verify them.

The API's `/health` returns 200. `/ready` returns 503 with database/authentication configured and routing/ticket/transcription/flight integrations unconfigured. Health checks use `/health` so incomplete optional provider setup does not restart the service continually. Real rides still require Google routing, approved drivers/vehicles and an operator. Set `BOOTSTRAP_ADMIN_SUBJECT` to the intended operator's Clerk user ID after that person signs in; never assign the first arbitrary user administrator privileges.

Free Render services sleep after 15 minutes without inbound traffic and can take about a minute to wake. Flight maintenance runs only while this host is awake; an always-running host is needed for continuous updates. This deployment does not bypass sleep restrictions. See [Render free-service limits](https://render.com/docs/free) and [Clerk environments](https://clerk.com/docs/guides/development/managing-environments).

## Sources

[Clerk](https://clerk.com/docs/nextjs/getting-started/quickstart), [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://docs.sqlalchemy.org/en/20/), [PostGIS](https://postgis.net/documentation/), [Google Routes](https://developers.google.com/maps/documentation/routes/compute_route_directions), [Groq vision and JSON mode](https://console.groq.com/docs/vision), [Sarvam transcription](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe), [Aviationstack](https://docs.apilayer.com/apilayer/docs/aviationstack), [Vitest](https://vitest.dev/guide/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). No external dataset or live credentials are bundled.

### Authentication experience

Sign-in links open `/sign-in`; new users can switch to `/sign-up`. Google and email remain available. After authentication, users return to the selected passenger, driver or operator workspace; return URLs are restricted to these internal routes. Forms use opaque surfaces and explicit Clerk colors to prevent the previous transparent-card issue. Passenger names are prefilled from Clerk when there is no saved profile name. Driver approval and operator authorization are still enforced by the backend.

Authentication implementation checkpoint `4796756` passed [GitHub CI](https://github.com/krthik20050/kootu/actions/runs/38085374264), Vercel reached READY and Render reached live. Browser checks verified sign-in/sign-up, passenger entry and preserved driver return links. At 390px width the form had no horizontal overflow and its computed card background was opaque `rgb(255, 254, 249)`. Google/email account completion remains a human test. Live readiness now reports database/auth/ticket/transcription/flight configuration present, with routing missing; this is configuration evidence, not a full booking test.

### Central local environment

All local app/provider/Clerk/Supabase administration settings are now collected in `.environment/.env`. Edit that ignored file, then run `.\backend\.venv\Scripts\python scripts/sync_env.py` from the root to generate the scoped runtime files. See [.environment/README.md](.environment/README.md). The sync command rejects duplicate/missing names and refuses to clear saved values with empty entries. Restart local apps after syncing. Hosted settings still require a separate approved sync.

Passenger dashboard: `/dashboard` uses authenticated ride/group APIs for upcoming rides, progress, vehicle assignment and history, with refresh, matching, cancellation and an edit-preview link. Driver name/pickup instructions are unavailable in the API; draft edits do not update original bookings. See [frontend notes](frontend/README.md).

The `/dashboard` preview supports light and dark themes using the header toggle, with a saved browser preference and system-theme default.

The `/request` workspace now shares the dashboard's light/dark theme and responsive navigation while keeping its existing three-question ride preview.

The `/request` chat includes a local voice recorder with playback and discard controls. Recordings are not uploaded or transcribed.

On `/request`, “Scan ticket” opens a camera capture dialog beside “Record voice”, with review/retake, file fallback and consent before existing ticket extraction.

Mobile `/request` chat now includes step navigation, tap-to-edit answers, arrival-date shortcuts and larger composer controls.

The `/request` drop-off input now shows Google Maps address suggestions as you type, using the existing backend geocoding search; selecting a suggestion stores its map coordinates.

Chat submission: `/request` now sends confirmed flight/drop-off inputs and final-review pickup details to POST `/ride-requests`, with retry-safe request identifiers. Existing rides can seed a new draft but are not updated.

The dashboard and request page now share a beige/taupe light theme and warm brown dark theme with beige accents.
