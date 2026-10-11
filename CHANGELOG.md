# Change log

## 2026-10-11 09:41 IST - Verify rebuilt passenger portal live

Implementation 5116b7914427588dfdb7caecd27c119006bd8abf deployed successfully on Vercel. CI run 38110645691 passed: 148 backend tests, 57 frontend tests, lint, types, contracts and build. Verified the real signed-in passenger account at desktop 1280px, tablet 820px and phone 390px: no horizontal overflow; main card/summary/history edges align. Tested Plan a ride to /request, Ticket booking to /passenger and the mobile menu back to /dashboard. Local visual fixtures also covered a long assigned destination and dark mode; no synthetic rides were created in production. All PRs are closed, working implementation pushed, and the passenger dashboard is left open for the demo. Human review remains pending; this does not claim a new real-world driver trip, device voice capture or payment collection was tested.

## 2026-10-11 09:38 IST - Rebuild passenger overview layout

- Replaced the passenger overview presentation with a scoped CSS-module layout: aligned booking/progress columns, consistent card padding, a compact summary strip and useful journey history. New accounts get real booking links and a three-step guide; group/driver panels appear only with an active request. Sidebar icons and the title/theme/account bar now follow consistent spacing. Request chat keeps its existing form styling.
- Kept API loading, refresh, matching, edit-preview and confirmed cancellation behavior. Unmatched rides explicitly show pickup as not scheduled; driver-contact and direct-payment limitations remain visible. No backend, database-role, ticket or voice logic changed.
- Validation: all 57 frontend tests passed, including new empty-account, failed-loading and match/cancel/history regressions; lint and production build passed. Inspected a temporary local presentation fixture at 1440px, 820px and 390px, including a long assigned destination and dark theme; no horizontal overflow. Removed that fixture before building. The first build encountered stale generated development types for the removed fixture; clearing only that generated cache resolved it.
- Independent specialist agent reviewed functionality preservation; its pickup-time wording and contact-disclosure corrections were applied. Hosted verification follows deployment; human review pending. Local visual fixtures do not prove a real driver trip or payment collection.

## 2026-10-11 09:20 IST - Live passenger demo verification

Implementation 104eac3f5b5a08761232af3f0fa947eb0a99e388 deployed successfully; CI run 38109548135 passed both jobs (148 backend tests and all frontend tests). Verified the signed-in passenger /dashboard with reorganized top bar on desktop and at 390px, with no horizontal overflow. Both homepage portal links remain visible at mobile width. Verified a passenger visiting /driver stays on the driver URL with the explicit account-check and return/sign-in actions, without loading driver controls or redirecting. Driver-to-passenger and conflicting onboarding behavior are covered by regression tests. Kept the live passenger dashboard open for the demo. No account roles or ride data changed. Human review pending.

## 2026-10-11 09:17 IST - Preserve passenger portal intent

- Fixed the cause of passenger URLs opening a driver dashboard: RoleBoundary and explicit onboarding links no longer silently redirect an already-assigned opposite role. A clear account-check screen keeps the requested portal visible and provides sign-out/sign-in for the requested role, with retry handling. Unassigned and signed-out entry preserve passenger/driver intent. Database roles and backend authorization are unchanged.
- Reorganized the passenger top bar into workspace title/navigation and account controls; made both homepage portal entries visible on mobile. Passenger overview has an explicit passenger heading and clear primary ride action.
- Validation: lint/types/build pass; initial complete frontend suite passed 51 tests, followed by all 8 focused role/onboarding tests including the added opposite-role registration and failed-sign-out retry cases. Independent specialist review found no blocker; recommended tests added. Hosted visual checks follow publication; human review pending.

## 2026-10-11 09:07 IST - Verify live passenger access and compact mobile summary

Verified 3652f58 live on Vercel and CI run 38108862739 successful. The signed-in homepage shows Passenger dashboard, the Passenger portal link opens /dashboard, and desktop/mobile have no horizontal overflow. Driver controls were checked locally with the actual component and a removed fixture. Final mobile follow-up compacts summary cards into two columns and only shows edit guidance when a cancellable booking exists. Backend and authorization unchanged. Final lint/types/build passed; one parallel request-chat test hit its 5-second timeout, then the complete single-worker suite passed all 50 tests. Human review pending.

## 2026-10-11 09:05 IST - Fix portal discovery and driver workspace CSS

- Made passenger and driver portal entries explicit on the homepage and replaced generic signed-in My workspace with the database-role-specific dashboard name. Passenger navigation/header now identifies the passenger workspace.
- Fixed missing workspace form styling in the driver AppShell. Refined light/dark semantic colors, spacing, headers, input focus/size, approval badges and availability states. Moved the add-vehicle form to Profile & vehicles while preserving availability controls and API calls. Compact account selection no longer inherits full-screen empty-state height.
- Browser-checked the actual DriverDesk component with a temporary local-only fixture at 1440px desktop (dark) and 390px mobile (light); availability interaction succeeded, vehicle inputs measured at least 44px tall and no horizontal overflow. Removed the fixture before production build.
- Validation: 50 frontend tests passed; TypeScript and production build passed. Backend logic and persisted roles unchanged. Independent specialist review found no blocking regression; coarse-pointer controls retain 44px targets. Hosted verification follows deployment; human review pending.

## 2026-10-11 08:50 IST - Verify deployed role separation

- Implementation 256a97888e9b81dd7d0b01534a2e7f994819d589 deployed successfully on Vercel; Render OpenAPI exposes /me/role. GitHub Actions run 38107237139 passed both jobs, providing a third full automated pass after two local runs (148 backend, 50 frontend tests). Environment helper tests passed 3/3; npm production dependency audit found zero vulnerabilities.
- Hosted /health and /ready returned 200; anonymous role selection and proxied ride requests returned 401. Real signed-in passenger opening /driver/earnings and /onboarding?role=DRIVER returned to its persisted passenger dashboard. Passenger dashboard and /request loaded without driver controls; hosted fictional PDF upload extracted AI123 successfully.
- Repeated a real Groq/Geoapify integration journey: ticket extraction, address search, idempotent requests, matching, driver acceptance, private manifest, trip start/completion and fleet release. This used a separately created disposable local PostGIS database, removed afterward. Real Sarvam transcription of 63-second synthetic speech passed separately.
- Refreshed SUBMISSION verification checkpoint. No open PRs remain. No production test bookings were created. A full hosted journey across separate real accounts and physical microphone/GPS behavior remain unverified; payment is direct-to-driver guidance only. Human review and actual event submission remain pending.

## 2026-10-11 08:34 IST - Separate accounts and polish the MVP

- Added explicit one-time passenger/driver registration with server-owned roles, role-based portal redirects, fail-closed route guards and API authorization. Existing roles are preserved; new accounts start unassigned. Applied migration 006 to hosted Supabase successfully.
- Replaced the homepage with responsive passenger/driver entry points and clear account placement. Removed unused mock dashboard modules; retained synthetic regression fixtures. Clarified direct-to-driver payment policy without fabricated fares, balances or payment confirmation.
- Rewrote README and submission story against implemented features, event rules and primary-source research. Specialist agents reviewed backend authorization, frontend account transitions and product/README claims; fixed delayed account-switch response handling. Human review remains pending.
- Validation: two full backend runs, 148 passing each; two frontend runs, 50 passing each; lint, TypeScript, Ruff and generated contracts pass. Production build passed. Local browser homepage inspected at desktop and 390px mobile with no horizontal overflow. Hosted rollout and signed-in post-deployment checks follow this checkpoint; live multi-account ride and physical microphone/GPS are not established by these tests.

## 2026-10-11 07:35 IST - Final hosted verification

- Implementation e3f3c73 is READY on Vercel deployment dpl_CkGa9Q3RFRQzexhdxXBKqpjCRJw8 and https://kootu-five.vercel.app. Both CI jobs passed: https://github.com/krthik20050/kootu/actions/runs/38103826205 (142 backend, 40 frontend tests plus lint/types/build/contracts).
- Real signed-in browser recheck: synthetic PDF extraction; unavailable ZZ9999 flight recovery; native printed landing input then Next to destination; another unavailable-flight warning replaced by a 6 MB itinerary; old error cleared and extracted AI123/arrival/counts/seat/gate restored; Next succeeded again. Saved local screenshots of clean ticket review and destination with inline microphone. Multiple background refresh cycles completed without a connection warning during this final session.
- Prior 19 MB hosted PDF, real destination search, 63-second real Sarvam and isolated real-provider booking/matching/driver lifecycle checks remain valid. No synthetic production ride/profile was saved. Original private ticket, phone microphone/GPS and multilingual dictation remain unverified; matching is a bounded heuristic rather than guaranteed globally optimal dispatch. Development dependency audit warnings remain as documented above.

## 2026-10-11 07:31 IST - Verify large uploads and repair recovery feedback

- Implementation 06579c7 is live on the stable Vercel alias (deployment dpl_9VqeT3ND2UuYmoaovx86nAEvzJqu), with both CI jobs successful (run 38103509849). Real Clerk session accepted 6 MB and 19 MB fictional PDFs through the same-origin route, showed progress/extracted fields and advanced to destination. Real address search returned selectable Aluva results; no synthetic booking/profile save occurred. Anonymous proxied /me remains HTTP 401.
- Deliberately missing flight ZZ9999 returned useful recovery. Replacing that ticket exposed stale flight-error text; successful extraction now clears it. Explicit native input handling supplements change events for printed landing time after browser automation could display an edit without committing it to React state. Live verification of this last repair follows deployment.
- Live Sarvam successfully transcribed a 63-second fictional speech WAV across provider segments. This checks the longer server provider path, not target-phone microphone permission/recording or every language.
- Validation: 40 frontend tests, lint, production build/types passed; 142 backend tests remain passing in CI. Production dependency audit found zero vulnerabilities; full audit reports five high entries in the development-only eslint-config-next glob chain, not resolved with a breaking auto-downgrade. Original private PDF, target phone and global matching optimality are not claimed verified.

## 2026-10-11 07:25 IST - Stabilize ticket upload transport

- The signed-in hosted account loaded through the GET proxy, but a repeated direct PDF POST still failed at browser transport. Short writes and ticket uploads now use the fixed upstream external rewrite, retaining Bearer verification, no cookies and no automatic write replay. Long audio/matching requests retain direct routing to preserve timeout contracts beyond Vercel's 120-second external proxy timeout.
- Excluded only the external backend prefix from Clerk frontend middleware so upload streams avoid middleware body processing. Backend JWT/role checks remain the resource authorization boundary. Ordinary frontend Clerk routes remain covered.
- Validation: all 39 frontend tests, lint and production build/types passed. Hosted large-PDF checks follow. Fixed a test assertion TypeScript tuple error caught by the build. The original private ticket has not been supplied. References: https://vercel.com/docs/limits and https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites.

## 2026-10-11 07:17 IST - Stabilize short browser reads

- Production follow-up still observed intermittent cross-origin read failures while PDF upload and address search succeeded. Backend application error logs for the verification window were empty; no server-side exception cause is claimed. Added a fixed-upstream Next rewrite for browser GET reads at /api/backend, retaining Bearer verification and private/no-store responses. Cookies are omitted. Writes and long ticket/audio uploads retain the direct backend path and existing timeout contract.
- A pending-read regression showed four account loads overlapping within 45 seconds. Passenger background refresh now allows one pending poll, preventing retries from amplifying slow connections. Existing review/destination state is preserved.
- Validation: request routing and overlapping-read regressions failed before the changes and passed afterward; all 37 frontend tests, lint and production build/types passed. Previous 142 backend tests and live synthetic booking lifecycle remain applicable because backend code did not change in this milestone. Official Next.js rewrite documentation was consulted; hosted authenticated proxy verification remains pending until deployment.

## 2026-10-11 07:10 IST - Fix issues exposed by signed-in browser verification

- Real Clerk sign-in completed. A production synthetic PDF upload returned flight, landing time, seat/gate and counts; Next reached the destination step and live address search returned Aluva results. No synthetic ride was saved in the production account. The original private ticket remains unavailable.
- Reproduced account-load recovery leaving an old connection error visible. Separated connection errors from form errors, clear them after successful loading/polling and added Retry connection. GET transport failures retry once with a fresh 30-second default timeout; writes/uploads and HTTP failures are never automatically replayed. This improves transient/cold-start recovery without claiming the underlying network never fails.
- Reproduced HTTP 400 browser preflight for driver-location PUT/DELETE. Added these existing API methods to CORS while preserving exact-origin and header restrictions. Affects backend/app/main.py, health regressions, passenger UI, API client and frontend regressions.
- Validation: all three new regressions failed before their fixes; 142 backend tests in a fresh disposable local PostgreSQL/PostGIS database and 36 frontend tests passed, along with lint, Ruff/format, contracts and production webpack build/typecheck. Actual phone GPS permission/movement remains untested. Deployment verification will follow once complete.

## 2026-10-11 07:03 IST - Verify booking lifecycle with live providers

- Ran a synthetic PDF through the actual local upload endpoint with live Groq, then searched a public Aluva destination with live Geoapify. Verified extracted flight/airport/arrival/party counts, landing plus 30-minute pickup, idempotent booking for two synthetic parties, matching with real road-distance verification, outsider privacy, driver acceptance/manifest, trip start/completion and fleet release.
- All data lived in a uniquely named disposable local PostgreSQL/PostGIS database, removed afterward. Local test identities replaced Clerk only in the in-process verification app; production authentication/database were unchanged. No private ticket was sent. The first lifecycle attempt correctly refused trip start before pickup readiness; the complete rerun used an elapsed buffer and passed. Corrected the standalone harness import path before execution.
- Rechecked hosted readiness (all configuration checks true), the live implementation commit and successful CI for both implementation and release documentation. Browser sign-in retry reached Google's credential form. The original PDF and real signed-in hosted booking remain blocked on completing sign-in and supplying the document; this run does not claim those checks passed.

## 2026-10-11 06:59 IST - Arrival fix hosted verification

- Pushed implementation `8fa37df`; [both CI jobs passed](https://github.com/krthik20050/kootu/actions/runs/38101860223). Render deployment `dep-db5ebljrjlhs73anium0` is live at that exact commit. Vercel deployment `dpl_8QdwXs78n9p5UqKWzZPQJXrSUmeU` reached READY and aliased kootu-five.vercel.app.
- Hosted passenger page returned HTTP 200; backend `/ready` returned HTTP 200 with all configuration checks true. Readiness does not certify provider credentials or signed-in ride behavior. Public bundle inspection via PowerShell stalled and was cancelled; the bounded page health check succeeded. Original-ticket retry remains pending.

## 2026-10-11 06:55 IST - Preserve extracted arrivals and recover missing flight timing

- Reproduced Next failing after an unchanged date-input event erased a valid extracted arrival. Flight updates now normalize identifiers, preserve timing for unchanged fields and invalidate it only for actual edits. Timezone-free timestamps are rejected rather than interpreted in the browser's timezone.
- Added an inline exception-only recovery: replace the boarding pass with a full itinerary, or confirm its printed landing date/time. Known Indian airports use IST automatically; other airports require an explicit UTC offset. Pickup remains landing plus 30 minutes. No arrival input appears in the normal successful extraction flow. Cancelled/incident/diverted lookup errors do not enable recovery.
- Flight-provider connection errors now return sanitized actionable HTTP 503; missing live-feed records explain the itinerary recovery instead of suggesting an indefinite retry. Updated passenger draft/UI, provider tests, README and intake guide.
- Validation: regression failed before the fix and passed afterward; 140 backend tests in a uniquely named disposable local PostgreSQL/PostGIS database (removed afterward), 33 frontend tests, lint/types, Ruff/format, contracts and production webpack build passed. Live Groq extraction of a fictitious synthetic PDF returned the expected flight/airport/arrival offset. Existing matching capacity, road-distance, wait windows, fleet approval, lifecycle and concurrency tests passed; matching remains a bounded greedy heuristic, not a global optimizer. Original private ticket and authenticated hosted lifecycle remain unverified. Deployment verification follows separately.

## 2026-10-11 06:48 IST - Maps integration hosted verification

- Published implementation `220d842` to GitHub; [CI passed](https://github.com/krthik20050/kootu/actions/runs/38101166557). Existing Vercel project reached READY (deployment `dpl_AZmmEnx57Hi33rUmggDss3Qd11U7`) at kootu-five.vercel.app; Render deployment `dep-db5e5trbc2fs738mlf3g` is live at the implementation commit. Hosted `/ready` returned HTTP 200 with all configuration checks true, and OpenAPI includes location PUT/DELETE. This does not certify live identity/GPS workflows.
- Added explicit Vercel upload exclusions for credentials, backend/database administration and local QA/build files; retained CLI-generated secret ignores. Three environment-sync tests passed; frontend lint/types/30 tests passed after cleanup ordering was hardened. Production npm audit returned zero advisories; existing development-tool warnings remain outside this feature. Passenger signed-out entry loads in the browser; real-phone permission/movement and assigned passenger navigation remain human checks.

## 2026-10-11 06:43 IST - Geoapify routing and trip location sharing

- Replaced the default Google routing/search selection with a server-only Geoapify adapter, bounded five-minute cache and process request pacing. Configured the supplied key in the central local env and authorized Render private env, without committing values. Google remains an explicit optional adapter. Added provider attribution and documentation.
- Added consented foreground driver GPS updates, assigned-driver write authorization, member-only group reads, coordinate/time validation and update throttling. Passenger cards show accuracy/age and key-free Maps links; stale locations disable navigation. Stop, cancellation and completion clear the latest coordinate. Migration 005 applied to Supabase after a schema-only metadata backup; existing RLS remains in force.
- Checks: 139 backend tests in a separate disposable database; 30 frontend tests, lint/types and webpack production build; Ruff and contract generation. Live Geoapify public search returned two results; sample airport route returned 19,593 metres/1,506 seconds. Hosted rollout verification recorded separately below when complete. Browser background GPS is unsupported; actual phone movement/permission and local route accuracy require human testing. Limits/cache pacing are per API process; multiple replicas need coordinated rate limiting. Human review pending.

## 2026-10-11 06:42 IST - Recover local provider configuration

- Recovered existing Sarvam, Groq and Aviationstack credentials from the team backend Render environment into ignored `.environment/.env`; ran the existing sync command for component environment files.
- Verified exact value agreement between central/backend files, Git ignore protection, and exclusion of provider secrets from frontend configuration. Values are not recorded here.
- This configuration check does not verify provider authentication or consumption limits. Restart local apps to load the recovered credentials.

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


## 2026-10-11 07:54 IST — integrate passenger PR without backend regression

- Integrated PR #1 dashboard/chat/clock UI with current main; resolved conflicts by preserving all current backend, migrations, environment examples, API client/proxy and generated contracts. Kept `/passenger` ticket-guided flow and linked new dashboard from home.
- Replaced chat's local-only voice preview with existing transcription, reused robust 20 MB ticket extraction, cleared replaced ticket fields, corrected flight query to `number`, preserved profile/eligibility updates, added driver-location pins and guarded overlapping background loads.
- Repaired npm lockfile that caused CI clean-install failures. Files: frontend routes/components/package-lock/tests/README and root documentation; no backend implementation delta.
- Validation: backend 142 tests passed with disposable database; Ruff and contract export check passed. Frontend 42 tests passed, lint/typecheck and production build passed; production dependency audit found zero vulnerabilities. Browser confirmed signed-out dashboard renders and asks for sign-in. GitHub CI and deployment validation pending at this checkpoint.
- Limitations: authenticated hosted booking, physical camera/microphone/GPS were not exercised in this integration session. Local npm ci encountered a native module held by the existing server; npm install completed, and clean Linux install will be verified in CI.


## 2026-10-11 07:56 IST — browser contrast correction

Browser inspection found white-on-white link buttons in dark mode: the global anchor color overrode Tailwind utility colors. Moved the anchor reset into the base layer in frontend/src/app/globals.css. Production rebuild passed. Integration checkpoint 7e12571 passed both GitHub web/API runs and Vercel preview deployment; final CSS commit will receive its own checks. Authenticated device flows remain unverified.


## 2026-10-11 08:12 IST — integrate driver dashboard PR #2

- Resolved shared CSS conflict while preserving passenger styles and all current backend implementation/contracts. Adopted the monochrome driver sidebar/header and responsive navigation; connected pages to existing Clerk-authenticated DriverDesk operations.
- Removed prototype sample profiles/trips/receipts/notifications, localhost gateway probes, local-only availability changes and unsupported sync promises. Earnings/payment/support submission remain explicitly unimplemented.
- Added real overview counts and filtered offers/trips/history; retained operator approval, vehicle registration, manifest, device location and trip lifecycle controls. Prevented overlapping background reads and stale responses; account failures no longer masquerade as onboarding.
- Added four driver UI regression tests and a complete media-to-trip API integration test using disposable PostGIS and stubbed external providers. Files: driver routes/components, scoped globals.css, driver.tsx, frontend/tests/driver-dashboard.test.tsx, backend/tests/test_media_to_trip.py and documentation.
- Pass 1: 142 backend and 42 existing frontend tests passed, lint/typecheck/build/contracts passed. Pass 2: 143 backend and 46 frontend tests passed after new integration cases; final build/browser and clean remote CI follow. Browser found and fixed dark-mode sign-in contrast. Physical microphone/GPS and real-provider full booking remain unverified.

- Mobile browser verification: 390px viewport has no horizontal overflow; drawer opens, focuses and navigates to profile. Fixed header sign-in return destinations for explicitly allowlisted driver subpages; added redirect-security regression cases. Production npm audit: zero vulnerabilities.
