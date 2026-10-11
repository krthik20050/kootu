# Change log

## 2026-10-11 06:41 IST - Isolate passenger timing deployment

- Removed two unfinished driver-location references from the committed passenger component after they slipped into the previous staged file during concurrent edits. The missing component/type caused frontend CI and Vercel to fail; backend CI passed. The in-progress driver-tracking implementation is preserved in the working tree for its own milestone.
- Validation: exact committed frontend source minus those references passed 28 tests, lint/types; isolated production build verified with a temporary dependency-root override for the shared node_modules. No build configuration change is included in this commit. New production CI/deployment checks follow; human review pending.

## 2026-10-11 06:38 IST - Automatic pickup timing without time inputs

- Removed the arrival/local-time field from ticket review and changed the automatic pickup buffer from 45 to 30 minutes after landing. UTC instants preserve timezone offsets and overnight transitions. Ticket arrival supplies timing directly; changing flight number/date/airport clears stale timing.
- Added authenticated, bounded /flights/arrival lookup when timing is missing or invalidated. It matches flight number, service date and airport, accepts only timezone-aware scheduled arrival, rejects unavailable/cancelled flights, and uses a separate 30-request hourly budget. The scheduled baseline avoids double-applying delays in existing flight polling. During lookup fields/progression are disabled; failure retains the draft for retry.
- Affected passenger component/draft, integration route/schema/budget, generated contracts, tests and guides. Checks: 130 backend tests in an isolated source snapshot and disposable PostgreSQL/PostGIS database; 28 frontend tests; Ruff/format, contract generation, frontend lint/types/build. Concurrent routing/driver-location edits were preserved and excluded from this milestone. Provider live-flight plan availability remains a limitation; authenticated real-flight lookup requires human verification. Human review pending.

## 2026-10-11 06:25 IST - Ticket review and extraction feedback

- Added accessible indeterminate upload/extraction progress and confirmed completion. Successful extraction opens a ticket-style review immediately below the progress bar, with route, airline and all supported printed details. Expanded extraction schema/prompt for boarding/departure times, seat, gate, terminals, cabin, allowance, reference and ticket number. Values remain unconfirmed; unknown values are not guessed. Supplementary details stay in the review draft and are not persisted in ride requests.
- Removed the Ready to leave input. Arrival time drives the automatic 45-minute pickup buffer; missing arrival time is requested explicitly. Enter in text/date/number inputs no longer advances or submits the form; explicit Next/Find my ride controls remain keyboard accessible. Replacement clears old supplementary values; busy extraction disables progression.
- Affected backend extraction schemas/providers, generated contracts, passenger draft/review/upload UI, responsive CSS, regression tests and guides. Validation: 123 isolated backend tests, 27 frontend tests, Ruff/format, contract check, frontend lint/types/build passed. Synthetic browser checks verified real file chooser, pending/completed progress, automatic review, Enter behavior, Next/Back and a 390px layout without horizontal overflow. Temporary preview removed before production build. Actual document accuracy and authenticated production extraction remain human verification tasks; no zero-error guarantee is claimed. Human review pending.

## 2026-10-11 06:06 IST - Shared autofill across booking steps

- Consolidated name, flight/airport/date, pickup readiness, passenger/luggage counts, destination and destination pin into one passenger draft. One successful ticket extraction replaces all ticket-derived fields together, including fields displayed on later pages. Next/Back preserves the shared draft; a replacement clears unknown values and any stale map pin. Separate typed/dictated instructions remain editable and preserved while navigating.
- Updated frontend/lib/ticket-draft.ts, passenger component, cross-step regressions, README and intake guide. Validation: 25 frontend tests passed, including zero luggage, replacement clearing, all autofilled fields, destination on the later step and preservation of instructions/readiness across repeated Next/Back. Frontend lint/typecheck and production build passed. Backend unchanged; previous 123 backend tests and live/CI verification stand.
- The upload error handling, 20 MB upload and ten-minute dictation change is deployed with passing CI (778b349). User has deferred retrying the original PDF, so its live extraction result remains unverified. Human review pending. Push/deployment verification follows for this state-only follow-up.

## 2026-10-11 05:59 IST - PDF upload connection errors and larger intake limits

- Reproduced a failure in the actual upload endpoint's error path: Starlette's outer error handler returned HTTP 500 without CORS headers, causing browsers to show the generic network message. Added the configured exact-origin headers to unexpected-error responses only; untrusted origins remain rejected and private exception details remain hidden. Added upload regression tests for both origins.
- Read digital ticket PDF text first to avoid unnecessary native rendering; scanned/mixed tickets keep the vision rendering path. Increased ticket/audio upload bounds from 5 to 20 MB, dictation from two to ten minutes, and ticket timeout from 45 to 90 seconds. Voice retains lossless 29-second provider chunks (at most 21), and the client allows 750 seconds for all chunks. Distinguish abort/timeouts from network failures while preserving drafts and retry audio.
- Updated integration/API research and setup docs, generated contracts and tests. Validation: 123 backend tests passed in an isolated disposable PostgreSQL/PostGIS database; 24 frontend tests and production build passed. Ruff/format, lint/types and contract checks verified before commit. Larger-upload test uses a 6 MB PDF fixture; digital-PDF test proves native rendering is skipped, and a ten-minute WAV recovers every frame in 21 bounded segments.
- Live diagnostics: API health 200, trusted-origin preflight 200 and readiness database/auth/ticket/transcription configured; Google routing remains missing. The user reported the failure on a PDF, but did not supply the document; the exact document/provider exception and new authenticated live extraction remain unverified. No private Clerk user-directory data read: automatic approval review rejected that unnecessary diagnostic lookup; continued with public checks and synthetic fixtures. Human review pending. Deployment verification follows.

## 2026-10-11 04:01 IST - Guided ticket booking and inline dictation

- Replaced the long passenger form with ticket upload, arrival review and destination/instructions steps. Removed provider explanations, consent checkboxes, WAV upload and separate transcript acceptance controls. The comment box has an inline microphone; stopping dictation appends editable text. Saved arrivals remain accessible, and adding another arrival clears the previous draft. Brief confetti follows successful persistence and respects reduced motion.
- Added nullable timezone-aware arrival, booked luggage and explicit drop-off extraction fields. Suggest pickup readiness 45 minutes after arrival without guessing missing details. Review Next validates and confirms flight data. Updated schemas/contracts, passenger components/styles, intake research, README and provider/API guides.
- Extended server dictation to 120 seconds using lossless 29-second WAV segmentation (at most five Sarvam calls); browser automatic stop is 118 seconds. Notes accept 2,000 characters; overlong transcripts remain visible until shortened. Failed segments fail the whole transcription, with retained browser audio for retry.
- Validation: 119 backend tests passed in an isolated disposable PostgreSQL/PostGIS database; 23 frontend tests, Ruff/format, lint/types and contract checks passed. Production build passed. Synthetic local browser review at 325px and 1280px confirmed step navigation, inline mic, save completion and no horizontal overflow. Corrected a browser-only Next/button reuse validation race and native date input synchronization. Temporary QA route removed before the final production build; stale generated dev-route types initially blocked the build, and clearing that generated cache resolved it.
- Limits: multilingual long dictation on target phones, real ticket accuracy and signed-in real rides remain unverified. Segmentation preserves all audio frames but recognition across word boundaries is not guaranteed. No new live paid provider request was made. Human review pending. Push/deployment verification follows.

## 2026-10-11 02:51 IST - Destination clusters and concurrent ride integrity

- Updated matching to favor nearby destination pins and fuller feasible groups; six seats/six bags by default, always bounded by approved vehicle capacity. Filter fleet equipment before limiting, fetch driver/vehicle together and exclude a driver from their own passenger group. Added `docs/database-architecture.md` with ER diagram, invariants, what-if cases and explicit scaling limits.
- Serialized request retries per account; added migration 004 with one active account/airport/arrival-date booking. Standardized member/fleet locking, fixed stale flight membership releasing a reassigned driver, added missed-pickup/wait expiry cleanup and versioned trip transitions. Readiness now detects missing mapped columns/indexes; bounded pool/lock waits return explicit retryable conflicts.
- Validation: deployable snapshot passed all 100 backend tests, lint/format and contract checks on a dedicated local release-test database. Synthetic scenario submitted 200 bookings using eight concurrent submitters, then five concurrent matching calls, producing one five-person group with no duplicate memberships. Six-seat fleet test grouped six nearby passengers. This is correctness evidence, not a production throughput benchmark.
- Hosted DB: private schema-only backup completed; migrations 003 and 004 applied transactionally, new columns readable by runtime role, arrival unique index valid, RLS verified on nine application tables. No passenger table data exported. Initial full backup and credential-file copying were rejected by automatic approval review; safe schema/source-only alternatives were used.
- Preserved teammate voice/PDF/frontend edits. A full mixed-workspace run saw two failures in their unfinished scanned-PDF code; the clean deployable snapshot uses committed provider code and passed. No AI-provider/frontend implementation included in this milestone. GitHub push/CI verification follows; live routing and completed human ride flow remain outstanding.

## 2026-10-11 02:51 IST - Ticket-first autofill and voice preferences

- Added prominent ticket intake, editable Groq suggestions for name/passenger count and existing flight fields, unknown-field clearing and flight confirmation reset on replacement or edit. Destination, pickup readiness and equipment remain explicit.
- Added Sarvam microphone recording alongside preferences: language choice, 29-second automatic stop, WAV conversion, playback, consent, reviewed transcript and typed/upload fallback. Resource cleanup covers permission races and unmount.
- Render one-to-three-page PDFs (including scans) through pinned pypdfium2, bound output image sizes, serialize PDFium calls, reject invalid/empty/truncated audio and validate provider output without returning PNRs or ticket numbers. Updated generated contracts, README, integration/API guides and docs/ticket-voice-intake.md with primary research sources.
- Validation: frontend lint/typecheck and 20 tests passed; production build passed. Final backend run passed 116 tests in a separately created disposable database; focused provider suite passed 30 tests. A shared-database rerun failed because concurrent test runs reset the same schema; isolation resolved those failures. Ruff and generated-contract checks passed. Corrected PDFium page/bitmap cleanup and jsdom file upload tests during validation. Final frontend lint/typecheck, 20 tests and production build passed; final backend Ruff/format and generated-contract checks passed.
- Limitations: local Groq/Sarvam settings have no usable keys; synthetic extraction returned 503 before a provider request. New live extraction, multilingual target-phone recording and signed-in end-to-end use are unverified. This change is local and has not been deployed. Human review pending. Preserved unrelated concurrent backend changes.

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
