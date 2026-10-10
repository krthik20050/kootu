# kootu

**Land together. Leave together.** Airport shared-cab coordination for passengers arriving at similar times and travelling to one small destination cluster.

Airport arrivals often mean solo cab fares or a long wait to find company. kootu's planned matching system groups compatible passengers by airport, ready time, real destination coordinates, seats/luggage and safety preferences. Thrissur and nearby destinations may share a cab; Guruvayur normally forms a separate group. This is not a long multi-stop route service.

Built from scratch for the **DevDay Exchange Community Hackathon: Kochi**, 10–11 October 2026. Read [RULES.md](RULES.md) and [AGENTS.md](AGENTS.md). Participant identities and final submission details remain for the team to complete in [SUBMISSION.md](SUBMISSION.md).

## Current status

Backend milestone in progress (11 October 2026): persistent ride APIs, Clerk verification, matching, driver/admin workflow, Grok/Sarvam/Google/flight adapters and polling are implemented. 45 local backend tests passed, including real PostgreSQL/PostGIS tests. Frontend screens and final documentation are being connected next. The older bootstrap description below records the starting point and will be replaced before handoff.


**IMPLEMENTED:** responsive public concept landing, strict frontend configuration checks, optional configured Clerk provider/proxy/sign-in controls with shadcn theme, API client boundary, FastAPI health/OpenAPI, environment settings, CORS, startup logging, sanitized error responses, six API tests, provider contracts, PostGIS extension migration and CI configuration.

**PLANNED:** bookings, ticket uploads/extraction with confirmation, domain tables, spatial queries, deterministic matching, role/ownership checks and API token verification, verified driver onboarding, offers, routing, flight updates, cancellation/re-matching and authorized Realtime updates. These do not exist as working features.

The public shell runs without credentials with authentication explicitly disabled. Clerk-enabled sign-in is scaffolded but has not been live-verified. `/health` proves process liveness only. No database, live map, passenger data or ride inventory is shown.

## Architecture and stack

Next.js 16, React 19, strict TypeScript and Tailwind 4 own the user experience; shadcn/ui configuration and `cn` utility are prepared. Clerk owns authentication, distinct from kootu driver verification. FastAPI/Python/Pydantic own future authorization, business logic and matching. Supabase PostgreSQL/PostGIS will own persistence and spatial queries. Routing and ticket extraction sit behind provider contracts. Deployment targets are Vercel and Render, not yet deployed.

No microservices, queues, Docker prerequisite or AI matching. See [architecture](docs/architecture.md), [API contracts](docs/api-contracts.md), [database](docs/database.md), and [matching engine](docs/matching-engine.md).

```text
apps/
  web/                       Next.js app, package-lock.json, shadcn config
    src/app/                 Landing and root layout
    src/components/          Optional Clerk integration
    src/lib/api/             FastAPI client
    src/proxy.ts             Optional Clerk middleware
  api/                       pyproject.toml and pip dependency lockfiles
    app/
      api/                   Health resource
      core/                  Environment settings
      models/                Identity/verification vocabulary
      schemas/               Validated provider data
      services/              Provider contracts
      main.py                Composition, lifespan, errors
    tests/                   Health, OpenAPI and CORS checks
supabase/migrations/         PostGIS extension preparation
docs/                        Architecture and validation evidence
.github/workflows/          Independent web/API CI checks
```

Future `/passenger`, `/driver`, `/admin` areas can use separate layouts and feature components. No empty role pages or fake CRUD endpoints are created.

## Local setup

Prerequisites: **Node 22+**, npm, **Python 3.13 recommended** (project requires 3.12+) and Git. Use **pip + venv only** for Python. Exact dependencies are captured in npm and pip lockfiles.

From the repository in PowerShell:

```powershell
cd apps/web
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. In another terminal:

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.lock
.\.venv\Scripts\python -m pip install --no-deps -e .
Copy-Item .env.example .env
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

On macOS/Linux use `cp` and `.venv/bin/python`. Run API commands from `apps/api` so its `.env` is loaded there. No database is required for this bootstrap.

## Environment

| Variable | Scope | Requirement |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser-safe web | Required HTTP(S) API base URL; local example `http://localhost:8000` |
| `NEXT_PUBLIC_AUTH_ENABLED` | Browser-safe web | Required explicit `false` preview or `true` real auth |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser-safe web | Real key required when Clerk is enabled |
| `CLERK_SECRET_KEY` | Web server only | Real key required when Clerk is enabled; never client-side |
| `APP_ENV` | API server | `development` (default), `test`, or `production` |
| `FRONTEND_URL` | API server | One exact allowed origin; default `http://localhost:3000`; production requires an explicit HTTPS origin |

Missing required web configuration, or enabled Clerk without keys, fails clearly during build/start. Preview mode authenticates nobody. Configure a Clerk app with the [official quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart) before enabling auth. Before any private endpoint ships, implement backend token verification and role/ownership checks.

Future database, Supabase, Clerk issuer/JWKS and maps credentials should be added only when adapters use them. Service-role credentials stay server-only. Never commit `.env`, keys or private passenger/ticket data. Examples contain no credentials. Public Next.js variables are embedded at build time; changing them requires a rebuild.

## Commands and checks

From `apps/web`:

```powershell
npm run lint
npm run typecheck
npm run build
npm run start
npm audit --omit=dev
```

From `apps/api`:

```powershell
.\.venv\Scripts\python -m ruff check .
.\.venv\Scripts\python -m ruff format --check .
.\.venv\Scripts\python -m pytest
.\.venv\Scripts\python -m pip check
```

GitHub Actions checks both apps; deployment is manual. [Deployment instructions](docs/architecture.md#security-and-deployment) specify Vercel/Render roots and commands. PostGIS migration must be reviewed and applied to the team's selected Supabase development project; no remote migration was executed.

## Hackathon demo

1. Run both applications.
2. Open the landing, resize to mobile, and follow “Meet the idea”. The route is a labelled illustration, not a live map.
3. Open `http://localhost:8000/health`, then `/docs` or `/openapi.json`. Only `/health` is implemented.
4. Present the documented matching architecture as planned work, not a working booking flow.

## Verified results and limitations

Clean frontend install, lint, typecheck and production build passed. API imports, Ruff lint/format and **six tests** passed. Running Uvicorn returned the expected health JSON over HTTP. Browser verification at desktop 1440px and mobile 390px confirmed layout, no horizontal overflow, anchor navigation and no captured console errors/warnings. Missing API config and enabled Clerk without keys failed as intended. See [exact commands and evidence](docs/bootstrap-validation.md).

Production npm audit reports **zero advisories**. Full audit reports **five high-severity tooling advisories** stemming from unpatched `braces` through Next.js lint dependencies ([advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)). Registry version 3.0.3 remains affected. ESLint 9 is pinned for compatibility with Next.js's import/React/a11y plugins and emits an upstream deprecation notice; ESLint 10 caused incompatible peer warnings and was reverted. Revisit compatible patched tooling; do not force a Next.js tooling downgrade to hide the warnings.

No live Clerk sign-in, role enforcement, database/migration execution, matching, routing, ticket extraction, remote CI, deployment or performance target verification is claimed. This is an architecture bootstrap, not the complete product.

Sources: [Next.js](https://nextjs.org/docs), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Tailwind](https://tailwindcss.com/docs), [shadcn/ui](https://ui.shadcn.com), [Clerk](https://clerk.com/docs), [FastAPI](https://fastapi.tiangolo.com), [Pydantic](https://docs.pydantic.dev), [Uvicorn](https://www.uvicorn.org), [Supabase/PostGIS](https://supabase.com/docs/guides/database/extensions/postgis), [pytest](https://docs.pytest.org), [Ruff](https://docs.astral.sh/ruff). No dataset, commercial image or AI model is used by the application; the route SVG is original markup.

See [AI_USAGE.md](AI_USAGE.md) and [CHANGELOG.md](CHANGELOG.md). Independent next workstreams: passenger frontend/ticket intake; database/PostGIS domain schema; deterministic matching; Clerk and driver onboarding. None has been started.
