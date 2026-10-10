# kootu

**Land together. Leave together.** Shared airport rides for passengers with compatible arrival times and nearby drop-offs.

## What works

- Passenger, driver and operator web workspaces connected to FastAPI, with Clerk bearer sessions and server-owned roles.
- PostgreSQL/PostGIS persistence; deterministic grouping by airport, ready/wait window, whole-cluster destination proximity, seats, luggage, women-only policy, wheelchair spaces, child seats and pets. Google road-distance verification is required before a group is created.
- Driver/vehicle operator approval, availability, expiring offers, atomic acceptance, passenger cancellation and trip start/completion. Exact drop-offs and private notes are available only to the assigned driver; other passengers receive aggregate group information.
- Optional Grok ticket extraction (JPG/PNG or text PDF), user-confirmed autofill, and Sarvam WAV transcription with reviewed notes. Explicit structured needs affect matching; free text does not automatically reserve equipment.
- Automatic Aviationstack flight polling adjusts ready times from the original baseline, preserves feasible groups, and releases incompatible/cancelled groups for rematching. A PostgreSQL advisory lock coordinates maintenance across processes; no queue service is required.
- Generated OpenAPI/TypeScript contracts, SQL migration runner, PR template, GitHub CI and [collaboration guide](CONTRIBUTING.md).

Local regression coverage includes real PostgreSQL 17/PostGIS 3.5, signed JWT validation, concurrency and provider contract fixtures. **The public website is deployed and the local backend is connected to Supabase; live Clerk/provider credentials and backend hosting have not been verified.** The keyless preview shows a setup state instead of fabricated bookings. Adding keys also requires applying migrations, enabling provider products, selecting a compatible Grok model and approving real drivers/vehicles. No claim of guaranteed rides or zero defects is made.

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
│   ├── grok/
│   ├── sarvam/
│   └── aviationstack/
├── docs/                     # Architecture, contracts and validation
└── .github/workflows/        # CI checks
```

Each main folder has its own README. Provider secrets and executable adapters belong to the backend; `integrations` explains each connection without putting private keys in browser code. Previous `apps/web`, `apps/api` and `supabase/migrations` paths are now `frontend`, `backend` and `database/migrations`. Historical changelog/validation records retain their original paths.

`frontend`: Next.js 16, React 19, TypeScript, Tailwind 4 and Clerk. The `(driver_app)` and `(user_app)` folders are Next.js route groups, so they organize each role's pages without changing `/driver`, `/passenger`, `/admin` or `/`. Shared components, authentication, styles and API calls stay in `src/components`, `src/app` and `src/lib`. `backend`: FastAPI/Pydantic, SQLAlchemy/psycopg, PyJWT. `database/migrations`: PostgreSQL/PostGIS SQL. `docs/openapi.json` and `frontend/src/lib/api/generated.ts` are exported from the backend, not edited independently. No microservices, Redis, AI matching, or message brokers. Docker is optional for disposable database tests, not an application prerequisite.

[Architecture](docs/architecture.md) · [Database](docs/database.md) · [Matching](docs/matching-engine.md) · [API](docs/api-contracts.md)

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
| API `.env` | `GROK_API_KEY`, `GROK_MODEL` | Account-supported vision model with structured output |
| API `.env` | `SARVAM_API_KEY`, `SARVAM_MODEL=saaras:v3` | Speech-to-text; WAV under 30 seconds in this MVP |
| API `.env` | `AVIATIONSTACK_API_KEY` | Plan with HTTPS flight lookup and the necessary coverage/date access |
| API `.env` | `FRONTEND_URL`, `APP_ENV` | Exact origin; production requires HTTPS |

Examples also expose configurable radius (3000m), seats/luggage (4 each), wait5–120 minutes, offer expiry300 seconds, and polling900 seconds. The web passenger form currently targets the default four-seat/four-luggage pilot policy. Provider usage can cost money; configure quotas/billing limits in the provider accounts. App limits per signed-in user per hour: ticket 20, audio 30, matching 30, destination search 100. Polling bounds each cycle to 30 active flight requests and 5 matching attempts.

Keys never go in Git, screenshots or chat. Public Next.js variables are baked into a build; rebuild after changing them. Raw tickets/audio are transient uploads, closed after processing; provider retention terms still apply. Consent is required before either upload is forwarded. Notes should contain only useful ride details.

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

Vercel root `frontend`, Node 22.12+, install `npm ci`, build `npm run build`. Render root `backend`, Python 3.13, build `python -m pip install -r requirements.lock` then `python -m pip install --no-deps .`; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT --no-access-log`. Set production HTTPS origins and server secrets. Apply reviewed migrations separately before releasing; use a direct/session-pooled PostgreSQL connection for advisory locks, not transaction-mode pooling. Set an ingress upload limit around 6MB and provider/request timeouts that permit bounded matching. A host that sleeps requires a continuously running worker or a later approved scheduled-job setup for continuous flight refresh. The Vercel public setup website has been deployed as documented below; backend hosting remains pending; the local Supabase connection is verified below.

### Current Vercel deployment

[Public website](https://kootu-five.vercel.app) · [Vercel project](https://vercel.com/krthik20050s-projects/kootu)

The existing `krthik20050` account owns the project. GitHub `krthik20050/kootu` is connected, with root `frontend`, Next.js preset, Node project setting `22.x` and install command `npm ci`. The initial production deployment reached READY, and its homepage and passenger setup state were browser-verified on 11 October 2026. Vercel warns that the package's `>=22.12.0` engine range can select a later major runtime.

Production and Preview currently use `NEXT_PUBLIC_AUTH_ENABLED=false` and `NEXT_PUBLIC_API_URL=https://kootu-api.invalid`. That reserved invalid domain intentionally cannot reach a backend. Booking is disabled. Replace it with the real HTTPS API URL and configure Clerk before enabling booking; then redeploy. Supabase migrations and the server role are provisioned and verified; provider authentication and backend hosting remain pending. The website calls FastAPI; only FastAPI receives the Supabase database connection string.

For future CLI deployments, run from the repository root (the project already specifies `frontend`):

```powershell
vercel link --yes --project kootu --scope krthik20050s-projects
vercel deploy --prod --scope krthik20050s-projects
```

Do not deploy from `frontend` after setting the remote root directory, since that can apply the subdirectory twice. `.vercelignore` excludes local environment files, dependencies and build output. Keep real credentials in the appropriate hosting environment. GitHub deploys are subject to Vercel's account/commit-author permissions; a connected repository does not grant teammates deployment access.

### Current Supabase connection

[Supabase project](https://supabase.com/dashboard/project/hsxahwksjlvtrgpbrwvc): `kootu`, Mumbai (`ap-south-1`), existing approved organization. CLI 2.120.0 is linked via `database/supabase`. All three migrations, nine application tables with RLS and nine policies restricted to `kootu_api` were verified remotely, along with backend-role login and session advisory locks. `backend/.env` now connects the local API to the session pooler with TLS. Owner and API passwords remain in ignored files, outside Git and the frontend.

The hosted website still shows setup: no hosted FastAPI endpoint or live Clerk/provider credentials are configured. A deployed API must receive its own server-role `DATABASE_URL` and secrets; then set Vercel's `NEXT_PUBLIC_API_URL` to that HTTPS endpoint and enable Clerk. The database connection alone does not activate bookings.

## Sources

[Clerk](https://clerk.com/docs/nextjs/getting-started/quickstart), [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://docs.sqlalchemy.org/en/20/), [PostGIS](https://postgis.net/documentation/), [Google Routes](https://developers.google.com/maps/documentation/routes/compute_route_directions), [Grok structured output](https://docs.x.ai/developers/model-capabilities/text/structured-outputs), [Sarvam transcription](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe), [Aviationstack](https://docs.apilayer.com/apilayer/docs/aviationstack), [Vitest](https://vitest.dev/guide/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). No external dataset or live credentials are bundled.
