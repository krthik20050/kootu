# Change log

## 2026-10-11 05:39 IST - Submit chat ride requests

- Changed: Mapped chat flight/date/drop-off and coordinates into typed POST `/ride-requests`. Final review collects airport, pickup-ready time in IST on the arrival date, party/bag counts, maximum wait, optional requirements and explicit confirmation. Added stable retry UUIDs, submission locking, validation/error feedback, success/dashboard link and saved-journey refresh.
- Why: User requested sending processed chat inputs to the backend, superseding preview-only submission behavior.
- Validation: Frontend lint/typecheck passed and diff whitespace checked. No tests or live booking requests run.
- Limitations: Requires authenticated/configured backend. Pickup-ready time must be supplied, not guessed from a flight number. Creating from an existing ride does not update it; backend rejects duplicate active arrivals. Voice stays local and is not transcribed into answers.


## 2026-10-11 05:32 IST - Passenger dashboard features

- Changed: Replaced the sample dashboard route with authenticated upcoming rides, status timeline, group counts/departure, assigned vehicle, history and recent updates. Added request/refresh/match actions, inline cancellation confirmation and edit-preview links that prefill the existing three-field chat from an owned request. Shared responsive navigation/theme with `/request`; allowlisted dashboard sign-in returns.
- Why: User asked to add all suggested passenger dashboard sections/actions.
- Validation: Frontend typecheck passed; lint issue corrected and rerun. No tests or live authenticated browser/API checks run.
- Limitations: API does not expose driver names/contact or pickup instructions; UI states this. Edit remains preview-only under the accepted chat scope, and no booking update endpoint was added. Ride creation remains disabled in chat. Sample component remains unused source.


## 2026-10-11 05:25 IST - Google drop-off suggestions

- Changed: Drop-off input now automatically searches after 3 characters with a 400ms debounce, ignores stale responses, and displays Google Maps address results with loading/empty/error states. Selecting a result saves its coordinates; keyboard arrows/Enter and manual pin fallback are supported.
- Why: User requested Google Maps suggestions while typing an address.
- Validation: Frontend lint/typecheck run; no tests or live Google/browser checks run.
- Limitations: Reuses the authenticated `/locations/search` endpoint and its Google Geocoding implementation, restricted to India. Requires backend `GOOGLE_MAPS_API_KEY` and the Geocoding API; this is not a new Google Places autocomplete integration.


## 2026-10-11 05:22 IST - Interactive mobile request chat

- Changed: Added step navigation, tappable answers for editing, local-date Today/Tomorrow shortcuts, and automatic feed scrolling with reduced-motion support. Mobile styling uses dynamic viewport height, compact bubbles, 44px+ action targets, 16px inputs, two-column camera/voice controls, safe-area spacing and scrollable destination results.
- Why: User requested a more interactive mobile chatbox.
- Validation: Frontend lint/typecheck passed and diff whitespace checked. No tests or mobile browser checks run.
- Limitations: Existing UI-only saving restriction and camera/microphone/API requirements remain.


## 2026-10-11 05:19 IST - Sidebar navigation cleanup

- Removed Projects from the shared desktop/mobile dashboard sidebar as requested.
- Validation: Inspected the navigation source and checked diff whitespace; no tests run.


## 2026-10-11 05:18 IST - Camera ticket scan action

- Changed: Moved Scan ticket beside Record voice in the chat composer. It opens a themed camera dialog with rear-camera preference, capture/review/retake, permission errors and file fallback. Consent and Read ticket send the reviewed file through the existing extraction endpoint and autofill only flight number/arrival date. Camera tracks and preview URLs are released on close/unmount.
- Why: User requested a repositioned button that opens the camera.
- Validation: Frontend lint/typecheck run; no tests or physical camera/browser checks run.
- Limitations: Camera requires HTTPS or localhost and permission. Extraction still requires the configured backend/provider; ride saving remains disabled.


## 2026-10-11 05:15 IST - Chat voice recording

- Changed: Added a microphone action beside the request chat input, with permission handling, stop control, 30-second limit, local audio preview, discard/re-record controls and microphone/object URL cleanup. Checkpoint includes the existing three-question request preview and `/request` route that host the control.
- Why: User asked for a record voice button in the chatbox.
- Validation: Frontend lint/typecheck run. No tests or microphone/browser checks run.
- Limitations: Local recording only; audio is not sent, transcribed or used to fill answers. Microphone access requires permission and HTTPS or localhost.


## 2026-10-11 05:13 IST - Request page dashboard theme

- Changed: Applied the dashboard palette to `/request`, with matching responsive sidebar, sticky header, light/dark toggle, bordered cards, chat bubbles, composer, ticket upload and journey list styling. Reused the saved theme preference. Corrected the passenger sign-in return destination to `/request`.
- Why: User asked to apply the dashboard design to the request route.
- Validation: Frontend lint/typecheck run; type narrowing issue corrected. No tests or browser checks run.
- Limitations: Three-question UI-only flow and existing authentication/API requirements remain. Saving requests is still disabled.


## 2026-10-11 05:09 IST - Dashboard dark mode

- Changed: Added an accessible light/dark toggle in the dashboard header, saved browser preference, system-theme default, and matching dark colors for cards, charts, inputs and mobile navigation.
- Why: User requested dark mode for the new dashboard.
- Validation: Frontend lint and typecheck run; no tests or browser checks run.
- Limitations: Theme applies to `/dashboard` only. Preference remains session-only if browser storage is unavailable.


## 2026-10-11 05:06 IST - Supplied dashboard UI

- Changed: Integrated the user-supplied App1 React dashboard at `/dashboard`, its shadcn UI components, sample datasets, responsive sidebar, chart, project search and notification disclosure. Added Radix UI, Lucide, CVA and Recharts dependencies; scoped the neutral dashboard palette.
- Why: Match the dashboard component in the user's attachment.
- Validation: Frontend typecheck passed; lint corrected two issues in pasted source and rerun. No tests or browser checks run.
- Limitations: All dashboard metrics, projects and activity are explicitly sample data; no backend integration. Recharts 2.15.4 matches the supplied chart API but is a deprecated major version. npm reports five high-severity advisories in the dependency tree.


## 2026-10-11 02:51 IST - Destination clusters and concurrent ride integrity

- Updated matching to favor nearby destination pins and fuller feasible groups; six seats/six bags by default, always bounded by approved vehicle capacity. Filter fleet equipment before limiting, fetch driver/vehicle together and exclude a driver from their own passenger group. Added `docs/database-architecture.md` with ER diagram, invariants, what-if cases and explicit scaling limits.
- Serialized request retries per account; added migration 004 with one active account/airport/arrival-date booking. Standardized member/fleet locking, fixed stale flight membership releasing a reassigned driver, added missed-pickup/wait expiry cleanup and versioned trip transitions. Readiness now detects missing mapped columns/indexes; bounded pool/lock waits return explicit retryable conflicts.
- Validation: deployable snapshot passed all 100 backend tests, lint/format and contract checks on a dedicated local release-test database. Synthetic scenario submitted 200 bookings using eight concurrent submitters, then five concurrent matching calls, producing one five-person group with no duplicate memberships. Six-seat fleet test grouped six nearby passengers. This is correctness evidence, not a production throughput benchmark.
- Hosted DB: private schema-only backup completed; migrations 003 and 004 applied transactionally, new columns readable by runtime role, arrival unique index valid, RLS verified on nine application tables. No passenger table data exported. Initial full backup and credential-file copying were rejected by automatic approval review; safe schema/source-only alternatives were used.
- Preserved teammate voice/PDF/frontend edits. A full mixed-workspace run saw two failures in their unfinished scanned-PDF code; the clean deployable snapshot uses committed provider code and passed. No AI-provider/frontend implementation included in this milestone. GitHub push/CI verification follows; live routing and completed human ride flow remain outstanding.

## 2026-10-11 02:40 IST - Central environment configuration

- Consolidated existing backend/provider, frontend/Clerk and Supabase administration settings into ignored `.environment/.env`; added a sanitized example and folder guide. Added scripts/sync_env.py to generate scoped runtime files without exposing values. Test-only database settings remain isolated.
- Validation: all real generated settings match the central source; secrets remain Git-ignored. Three synthetic tests verify frontend secret separation, blank-overwrite protection and duplicate rejection. Ruff checks passed. Preserved unrelated in-progress backend work.


## 2026-10-11 02:36 IST - Matching and database hardening

- Researched published Uber, Lyft, Quick Ride and ride-pooling research plus PostgreSQL/PostGIS/SQLAlchemy/Google references. Added `docs/backend-research-and-plan.md` with current parameters, architecture decisions, database responsibilities, prioritized failure modes, rollout and staged route-duration/scaling work.
- Backend matching now filters seed-incompatible requests before the 100-row limit, rejects same-account group duplicates, gates proposals with a configurable 30-minute dispatch horizon, and considers road-compatible alternatives within a bounded lookup budget. Immutable vehicle limits preserve provider I/O outside database transactions; locked ORM rows refresh before revalidation.
- Maintenance records independent attempt times so failed/empty flight lookups and unsuccessful matching rotate fairly; skips expired/future match seeds and bounds proposal expiry to 100 groups. Added migration `202610110003_matching_integrity.sql` for legal states, versions, approval/availability, assignment and vehicle-owner integrity plus queue indexes. Updated setup, matching and database guides.
- Validation: baseline 53 tests passed. Final backend suite: **76 passed**, including real disposable PostgreSQL/PostGIS migrations and regressions, existing concurrency/auth/privacy/provider coverage, and new forced approval-race/road-alternative/queue-fairness cases. Ruff lint and format checks passed; generated API contract check passed. Initial import-order lint failure corrected before final checks. Frontend files and AI extraction/transcription unchanged.
- Limitations: migration/code remain local, not deployed or applied to hosted Supabase; load/failover and live authenticated ride flow not tested. Matching remains bounded/greedy; full-route detour, driver pickup ETA, no-show recovery, global provider quotas and durable notifications remain documented work. Human review pending.

## 2026-10-11 02:36 IST - Local credential recovery

Restored missing local Groq, Sarvam and Aviationstack settings from the existing private Render environment after finding blank entries and obsolete Grok variable names in backend/.env. Verified key presence without printing values. Clerk frontend keys remained present. Google Maps was not configured. Only ignored local settings changed; origin of the file replacement is unknown.

## 2026-10-11 02:23 IST - Authentication browser and hosted verification

- Auth checkpoint `4796756` passed GitHub API/web CI; Vercel READY and Render live. Verified deployed sign-in/sign-up pages, passenger entry and driver return link. At 390px width, the Clerk card background is opaque and the page has no horizontal overflow.
- API health200, unauthenticated me401 and readiness503 verified: only routing is missing from configuration. Full human login, routing alternative and live ride approval remain outstanding. Updated README/AI usage evidence; no implementation changes in this checkpoint.

## 2026-10-11 02:20 IST - Readable authentication and workspace return

- Reproduced transparent Clerk modal in the deployed website: shadcn theme referenced absent card/input tokens. Added those tokens and explicit Clerk appearance colors. Replaced modal entry points with dedicated, responsive sign-in/sign-up pages with prominent Google/email options, booking context and back links.
- Restricted return destinations to passenger/driver/operator workspaces and preserved the selection through sign-in/sign-up. Prefill passenger names from Clerk when no saved name exists. Added product context from existing docs and the user feedback. Backend roles are unchanged.
- Validation: frontend lint/typecheck and ten tests passed, including return destination security coverage. Production webpack build passed; browser checks in progress; completed user authentication still requires human login.

## 2026-10-11 02:18 IST - Live provider validation and Groq switch

- Switched ticket extraction to Groq at user request, using the current account-supported Qwen vision model, JSON mode and local field validation. Updated upload consent, environment names and integration docs. Synthetic image extraction returned all expected flight fields; Sarvam transcribed synthetic spoken needs successfully. Stored available provider settings in the approved private Render environment.
- Removed Aviationstack historical date parameter after live 403 plan restriction; live query returns 200 and exact flight/airport/date filtering remains. Added regression coverage for date mismatch.
- Validation: 53 backend tests, Ruff and contracts passed; eight frontend tests and regenerated route type checks passed. Local Turbopack build hit a process-start panic; hosted build verification remains pending. Google Maps, human session and operator approval remain pending.

## 2026-10-11 02:01 IST - Hosted deployment verification

- Verified Vercel auth-enabled deployment READY and its stable public alias; live passenger sign-in opens the kootu Clerk modal with Google/email options. GitHub CI run 38083829579 passed API and web jobs for checkpoint `17e7aef`. Render initial deployment remains live.
- Recorded evidence in README. Human sign-in, operator identity and provider credentials remain pending; no full live booking claim is made.

## 2026-10-11 01:56 IST - Hosted API and Clerk connection

- Created/linked a dedicated kootu Clerk app, pulled local development keys, verified RSA JWKS, and saved keys in Vercel after explicit credential-transfer approval. Enabled local sign-in and built successfully. Production Vercel settings now target the real API and enable sign-in; previews stay disabled under the backend's exact-origin policy.
- Installed/checksummed the official Render CLI in ignored tooling, completed user login, validated `render.yaml`, and created a free Singapore Python service `srv-db59t3nlot8c73e7be60` with its private Supabase runtime connection and Clerk issuer. API deployment reached live; health200 and readiness503 correctly report database/auth configured and four providers missing.
- Fast-forwarded the teammate's route grouping commit `feece27` without overwriting it. Render's initial build used that commit. No provider keys, paid plans or operator identity were invented. Free-host sleep prevents continuous idle flight polling. User sign-in/provider dashboard access and full live ride testing remain pending.

## 2026-10-11 01:43 IST - Supabase connection

- With explicit approval for the organization and Mumbai region, created and linked Supabase project `hsxahwksjlvtrgpbrwvc` (`kootu`) through CLI 2.120.0. No paid upgrade selected. Added tracked CLI config under `database/supabase`; all credentials/link metadata remain ignored.
- Applied the three existing migrations, provisioned the dedicated `kootu_api` server role, and configured the ignored local backend environment with its TLS session-pooler URL. Migration-owner credentials are kept separate from the runtime connection.
- Validation: healthy project; database and backend-role login succeeded; three migration records, nine RLS-enabled tables, nine backend-only policies and session advisory locking verified remotely. Local API restarted: health200, readiness503 with database=true and missing auth/provider configuration. Hosted backend, Clerk and providers remain pending; Vercel booking stays disabled.

## 2026-10-11T01:43:16+05:30 — Group frontend routes by role

- Changed: Moved the driver route under `frontend/src/app/(driver_app)` and the home, passenger and operator routes under `frontend/src/app/(user_app)`.
- Why: Separate role-specific frontend route files while keeping one shared Next.js app and preserving existing public URLs.
- Documentation: Updated root and frontend READMEs with the new route-group structure.
- Validation: Confirmed route files are in the requested groups and `git diff --check` passed. No tests or build were run.
- Limitations: Driver and user experiences still share authentication, components, styles and API client by design.

## 2026-10-11 01:35 IST - Clear team folder structure

- Moved `apps/web` to `frontend`, `apps/api` to `backend`, and `supabase` to `database`. Added folder READMEs and `integrations` guides for Clerk, Google Maps, Grok, Sarvam and Aviationstack; executable server adapters remain packaged in the backend.
- Updated CI/cache paths, migration runner, database test paths, contract exporter, current setup/architecture/collaboration docs and Vercel root to `frontend`. Historical records preserve original paths. Local ignored environments/dependencies moved with their apps.
- Validation: 53 backend and 8 frontend tests passed; Ruff, frontend lint/typecheck and contract drift checks passed. A stale moved `.next` cache caused a build failure; removing only that generated cache allowed production compilation. Clean production build passed. GitHub CI for ee40be9 passed (run 38082348112), and its automatic Vercel deployment reached READY at kootu-five.vercel.app with root frontend. Supabase account connection and hosted API remain pending.

## 2026-10-11 01:26 IST - Vercel public setup deployment

- Created and linked `kootu` under the existing, user-selected `krthik20050` account. Deployed the public website at https://kootu-five.vercel.app and connected GitHub `krthik20050/kootu`, with monorepo root `apps/web` and `npm ci` installs.
- Added `apps/web/.vercelignore` to exclude local secrets and build artifacts; updated README with actual deployment state and CLI steps. Production/Preview booking stays disabled, with a reserved invalid API URL until a backend is available.
- Validation: upload manifest contained 31 files and excluded environment files, node_modules and `.vercel` contents. Vercel production build compiled, typechecked and reached READY. Browser verified the homepage and passenger setup state. Supabase, backend hosting, Clerk and live provider testing remain pending; no live booking claim.

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

## 2026-10-10T23:53:48+05:30 — Initialize COOTU application architecture

- Changed: `apps/web` Next.js/Tailwind/TypeScript shell with configurable Clerk and API boundary; `apps/api` FastAPI health/settings/CORS/errors/tests and provider protocols; PostGIS extension migration; CI checks; `.gitignore`, README, SUBMISSION, AI_USAGE and architecture/validation docs. RULES and AGENTS preserved.
- Why: Establish a simple, independently workable hackathon foundation for airport-to-destination-cluster shared cabs without pretending matching or booking already exists.
- Validation: Frontend install/lint/typecheck/build passed; backend import, Ruff lint/format and six tests passed; live health/OpenAPI responses checked; desktop/mobile browser checks passed; production npm audit clean. Executed commands and corrections are in `docs/bootstrap-validation.md`.
- Limitations: Five unpatched high-severity dev-tool advisories and ESLint compatibility/deprecation; no live Clerk, database/migration, matching, routing, extraction, Realtime, remote CI or deployment verification. Human review and participant/submission details pending.

## Template setup — 10 October 2026

- Changed: Added the event README, rules, agent guide, change log, AI usage record, submission checklist, Git ignore rules, and pull request checklist.
- Why: Give participants a consistent starting point for event rules, basic coding patterns, documented changes, and regular commits.
- Validation: Checked local Markdown links, event detail consistency, required documents, and diff whitespace before publishing.
- Limitations: Documentation scaffolding only; no participant project, application, or working demo is included. GitHub publication and template status are verified separately after creation.

## 2026-10-11 00:34 IST - Persistent backend milestone

- Added Clerk verification, PostgreSQL ride domain and PostGIS matching, driver/operator approval, offers, cancellation and trip lifecycle. Added confirmed ticket extraction with Grok, WAV transcription with Sarvam, Google road verification and automatic flight polling/rematching. Latest user naming is kootu.
- Added collaboration guidance and real PostgreSQL/PostGIS CI service, migrations and exported API contracts.
- Validation: 45 backend checks passed locally using disposable PostgreSQL17/PostGIS3.5; Ruff passed before adding migration runner. Provider tests use contract fixtures and signed-token tests use generated RSA keys.
- Remaining: frontend screens, final docs, full checks and live credential smoke tests. No live provider accounts or deployment verified.

## 2026-10-11 01:01 IST - Connected ride workspaces and final hardening

- Connected passenger booking/ticket/voice needs, driver fleet/offers/trips and operator review to the typed FastAPI contract. Updated kootu branding/copy and retained the cream/green visual system.
- Added shared provider request budgets, incomplete-flight-estimate preservation, fleet-wide offers, consistent group-first locks and driver release before pickup. Proposals expose only an approximate destination area; assigned manifests include required names, exact drop-offs and private notes.
- Added migration/RLS regression checks, eight web interaction tests and web-test CI. Rewrote setup/architecture/API/database/matching docs, documented collaboration for2–4 and23 people, and researched official competitor pages.
- Validation:53 backend tests on real PostgreSQL/PostGIS;8 frontend tests; web lint/types/build; backend Ruff/format/contracts/pip checks; production npm audit0; browser keyless landing/navigation at narrow and desktop sizes. Backend milestone remote CI also passed.
- Limitations: live account keys, deployed environment, real licence checks and remote branch rules remain unverified/unconfigured. Dev-only ESLint advisories remain. See docs/backend-validation.md.

## 2026-10-11 01:05 IST - Remote validation handoff

Recorded the completed implementation checkpoint `3a03e7ce8cf957b783bd9a954f951a59060e21f8` and its passing GitHub Actions run in submission/validation docs. Both web and API jobs passed, including 53 backend and 8 frontend checks. Documentation-only change; local links and whitespace verified. Participant/organizer submission details remain for the team.
