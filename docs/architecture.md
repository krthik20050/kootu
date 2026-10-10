# COOTU architecture

COOTU coordinates airport passengers into shared cabs for one small destination cluster. It is not a multi-stop service along a long route. Matching is deterministic product intelligence; AI is not required for the core algorithm.

## Implemented foundation

- `apps/web`: Next.js App Router, React, strict TypeScript, Tailwind, ESLint, shadcn configuration and `cn` utility. Public concept page with honest preview labels. Clerk provider/proxy/sign-in controls activate only with explicit configuration.
- `apps/api`: FastAPI, Pydantic settings, lifespan logging, restrictive CORS, safe error responses, public `GET /health`, OpenAPI and tests.
- `supabase/migrations`: PostGIS extension preparation only. No domain tables, database connection or applied remote migration.
- Python routing and ticket-extraction protocols describe future provider calls. No concrete adapters or fake results.
- GitHub Actions runs frontend lint/typecheck/build and backend lint/format/tests. No automatic deployment.

## Ownership and future boundaries

Next.js owns presentation, accessibility, Clerk user interaction and token acquisition. FastAPI owns authorization, request lifecycle, deterministic matching, offers and trip state. Supabase hosts PostgreSQL/PostGIS; Storage and Realtime are optional infrastructure used only when a feature needs them.

Passenger, driver, ride and matching modules should be added beside the health router as actual vertical slices. Avoid centralizing all future logic in `main.py`. Future frontend routes `/passenger`, `/driver`, `/admin` may have separate layouts and feature components; no empty route scaffold has been created. FastAPI OpenAPI owns wire contracts; generate TypeScript from it once resource endpoints exist rather than inventing a shared-types package.

`RoutingProvider` accepts validated WGS84 coordinates and returns road distance/time. Google Maps or another implementation belongs behind that interface, with explicit timeouts, quota handling and unavailable-result behavior. A provider outage must not silently approve an unverified detour.

`TicketExtractor` accepts a document after the intake layer has enforced size, content type, file signature and malware/unsafe-file handling appropriate to the chosen storage. Its output contains only flight number, date and arrival airport suggestions. The future UI must require confirmation before creating a ride request. Raw documents need short retention and restricted access; do not persist names, ticket numbers or entire ticket contents by default. No upload endpoint, storage or OCR exists now.

## Authentication and authorization plan

1. Clerk authenticates the passenger/driver/admin identity in Next.js.
2. Next.js obtains a short-lived session token and sends `Authorization: Bearer ...` to FastAPI over HTTPS. Never store tokens in localStorage.
3. Before ANY private resource is added, FastAPI must verify the token signature against trusted Clerk JWKS, algorithm allowlist, exact issuer, expiry/not-before and authorized-party/audience policy. Pin the trusted issuer/JWKS configuration server-side; never take it from token input. Cache public keys with bounded refresh and fail closed on verification errors.
4. Map the verified Clerk subject to a COOTU profile. Resolve role/permissions from server-controlled records or verified server-managed claims. Never trust a role or passenger identity supplied by the browser.
5. Apply resource ownership and role checks on every private endpoint; invalid credentials return 401, insufficient authorization 403.

`PASSENGER`, `DRIVER`, `ADMIN` are vocabulary only today. Driver verification (`PENDING`, `APPROVED`, `REJECTED`) is separate from authentication and will require licence, vehicle and document approval. Signing in does not approve a driver. No private API resource or implemented server token verifier exists in this bootstrap. `/health` is intentionally public.

`NEXT_PUBLIC_AUTH_ENABLED=false` is an explicit public-preview mode, not fake authentication. With `true`, real Clerk keys are mandatory. No accountless app or credentials are provisioned automatically. The provider follows [Clerk's Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart); real sign-in requires a configured Clerk application and has not been live-verified.

## Security and deployment

The API allows exactly `FRONTEND_URL`, currently GET and the Authorization/Content-Type headers; extend methods alongside implemented endpoints. CORS is not authorization. The health endpoint is process liveness, not database readiness. Error handlers omit submitted inputs and internal exception messages. Uvicorn access logging should be disabled where paths/query strings may contain sensitive data.

Vercel root: `apps/web`, Node 22, `npm ci`, `npm run build`. Set browser-safe API URL to the Render HTTPS origin and configure real Clerk keys only when enabling auth. Next.js public variables are embedded at build time; changing them requires a rebuild.

Render root: `apps/api`, Python 3.13, build `python -m pip install -r requirements.lock` then `python -m pip install --no-deps .`; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT --no-access-log`; health path `/health`. Set `APP_ENV=production` and the exact deployed `FRONTEND_URL`. Store future database/service-role credentials only in backend secret configuration.

No deployment, Supabase project, Clerk app, routing account or credentials were created. No Docker, queues, Redis, microservices or Kubernetes are needed for this foundation.

## Frontend design targets

Assumptions: mobile/4G; SEO-friendly public landing with server components; future role areas authenticated; Tailwind tokens and shadcn components are the visual source of truth; WCAG AA, with team accessibility owner still to be assigned. Targets at mobile p75: LCP <= 2000ms, INP <= 200ms, CLS <= 0.1; initial route JS <= 150KB gzip; Lighthouse accessibility >= 95 and performance >= 90. These are targets, not measured claims. Keep fonts local/system, avoid unnecessary imagery and respect reduced motion.

## Parallel team work

A. Passenger UI and confirmed ticket intake: `apps/web` feature components, extraction adapter and reviewed upload API contract.

B. Database/PostGIS: reviewed minimal schema, ordered migrations, GiST indexes, ownership/RLS and migration validation.

C. Matching: pure deterministic constraints/scoring with fixtures for same flight, nearby flights, cluster diameter, wait limits, capacity and safety; connect spatial queries after B.

D. Clerk and driver onboarding: backend verification dependency, profile roles, ownership checks, separate document approval and driver offer integration.

Coordinate endpoint contracts and migration sequence numbers before touching shared docs. Workstream ownership is a recommendation; none has been started.
