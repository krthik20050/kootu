# AI usage record

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

## 2026-10-11 09:05 IST - Passenger access and driver presentation repair

Codex traced unstyled driver controls to a missing workspace class, repaired shared form scope and refined responsive light/dark presentation. Added explicit passenger portal links and role-specific account labels, simplified driver overview and compacted onboarding. Used a temporary local visual fixture to inspect DriverDesk and its availability interaction without changing hosted data; removed it before build. Frontend tests (50), types and production build passed. Independent specialist review found no blocking regression; its touch-target recommendation was applied. Live follow-up and human review remain pending.

## 2026-10-11 08:50 IST - Hosted and provider follow-up

Codex verified deployment 256a978, both successful CI jobs, hosted health/readiness and anonymous denial, and real passenger role redirects plus ticket extraction. Repeated isolated full ride lifecycle with real Groq/Geoapify and a separate real Sarvam synthetic-speech check; the disposable local database was removed. Updated SUBMISSION with the actual verified checkpoint. Three full automated passes succeeded in total; no production synthetic bookings or real payments were created. Full hosted multi-account/device journey and human review remain pending.

## 2026-10-11 08:34 IST - Role separation and MVP review

Codex implemented database-backed one-time roles, API/portal authorization, account routing, homepage redesign and honest direct-payment instructions; removed only unused dashboard mock modules. Specialist review agents audited authorization, UX/state transitions and researched README structure/hosting limitations. Fixed stale onboarding responses during account switching. Two backend runs passed 148 tests each, two frontend runs passed 50 each; static checks, contracts and production build passed. Applied the preserving-role Supabase migration. Local responsive homepage inspected. Hosted follow-up pending at this checkpoint; human review pending. No payment provider or actual charge implemented.

## 2026-10-11 07:35 IST - Final deployed recheck

Codex verified final deployment e3f3c73 and both successful CI jobs. Hosted native itinerary-time recovery now advances; replacing a failed flight lookup with a 6 MB itinerary clears the stale error, restores extracted fields and advances again. Captured clean local screenshots of ticket review and destination with inline voice. No production test booking/profile save. Original private PDF and actual phone microphone/GPS remain unverified. Human review pending.

## 2026-10-11 07:31 IST - Hosted large-file and real voice verification

Codex verified authenticated hosted 6/19 MB fictional PDF uploads, extracted review, Next and destination search; anonymous backend proxy remains 401. Found stale flight error after replacing an itinerary and native date-input automation not committing state; cleared errors on successful extraction and added native input support. Verified real Sarvam on 63 seconds of generated fictional speech without database access. 40 frontend tests, lint/build/types and implementation CI passed; runtime dependency audit is clean, development glob-chain warnings remain documented. Original private ticket/phone recording and final repair hosted verification remain pending. No production synthetic ride save. Human review pending.

## 2026-10-11 07:25 IST - Ticket transport follow-up

Codex repeated signed-in hosted testing and observed a direct upload transport failure after GET proxy recovery. Routed ticket/short writes through the external rewrite while preserving backend token checks, multipart boundaries and long audio/matching direct timeouts. Excluded only backend-proxy streams from frontend Clerk middleware. All 39 frontend tests, lint and production build/types passed; hosted large synthetic PDF verification follows. Fixed a regression assertion type error caught by build. No production synthetic booking/profile save submitted. Human review pending.

## 2026-10-11 07:17 IST - Same-origin reads and polling guard

Codex continued testing after a follow-up screenshot showed another transient background warning. Verified no application errors in the bounded backend log window, added fixed-upstream same-origin GET routing with Bearer headers/no cookies/private cache policy, and prevented overlapping passenger polls. Long uploads and writes retain direct routing. Context7 tools were unavailable, so official Next.js external rewrite documentation supplied the API reference. Read/poll regressions failed before the fix; 37 frontend tests, lint and build/types passed. Hosted proxy verification and original private ticket remain pending; human review pending.

## 2026-10-11 07:10 IST - Signed-in verification and recovery fixes

After the user completed Google sign-in, Codex verified production synthetic PDF extraction, Next to destination and real address search. Found stale account-connection errors and missing driver GPS CORS methods, reproduced failures, and fixed them with isolated connection state, manual retry, bounded GET-only transport retry and PUT/DELETE preflight support. No production synthetic booking/profile update was submitted. Checks: 142 isolated backend and 36 frontend tests, lint, types/build, Ruff/format and contracts passed. Original private ticket and phone GPS remain human checks. Human review pending.

## 2026-10-11 07:03 IST - Live-provider lifecycle verification

Codex used a temporary local synthetic verification harness with real Groq extraction and Geoapify search/routing, in a separate disposable PostgreSQL/PostGIS database. Verified upload details, buffered timing, booking idempotency, matching, privacy, driver acceptance, manifest, start/completion and fleet release. Corrected the harness import path; an initial early-start rejection was expected backend behavior, and the elapsed-buffer rerun passed. Current hosted readiness and CI passed. Browser retry reached Google sign-in; no credentials were entered by Codex. Original-ticket and actual Clerk-account booking verification remain pending; human review pending.

## 2026-10-11 06:59 IST - Arrival fix release verification

Codex pushed `8fa37df`, verified both CI jobs, Render's exact implementation commit and Vercel READY/stable alias. Public passenger and backend readiness checks returned HTTP 200. Cancelled a stalled PowerShell asset-inspection request and used a bounded curl page check. Original ticket and signed-in hosted lifecycle remain human verification; human review pending.

## 2026-10-11 06:55 IST - Diagnose Next arrival failure

Codex reproduced an unchanged date event clearing extracted timing with a failing UI regression, fixed normalized flight invalidation, and implemented exceptional itinerary-time recovery without guessing arrivals or changing the 30-minute buffer. Added safe flight-network failure handling and regressions, and reviewed existing matching/lifecycle concurrency behavior using diagnose, frontend, code-review and DevOps skills. Agent Reach's Jina reader retrieved official Aviationstack documentation confirming plan limitations. Checks: 140 isolated backend tests, 33 frontend tests, lint/types, Ruff/format, contracts and production build passed; live Groq synthetic PDF extraction returned the expected arrival. No private passenger data was used in live verification. Human review and original-ticket retry pending; hosted deployment recorded after verification.

## 2026-10-11 06:43 IST - Free maps integration and location sharing

Codex researched official Geoapify routing/geocoding documentation, applied engineering/code-review/DevOps guidance, implemented the selected adapter and consented trip location endpoints/UI, and added lifecycle/privacy/provider/frontend regressions. Preserved simultaneous ticket/pickup work; corrected an import conflict and migration-count assertion. The key was added to backend/.env by the user and safely preserved in central configuration. Configured authorized Render settings and applied the additive Supabase migration after schema-only metadata backup. Verified 139 backend tests in a dedicated local test database, 30 frontend tests, lint/types/build and live public-address/route calls. Windows sandbox temporary-file/network restrictions required host execution. Human review and real-device location testing pending; no unlimited service or perfect accuracy claim.

## 2026-10-11 06:42 IST - Recover existing provider keys

- User requested recovery of previously supplied credentials. Codex located the three missing provider keys in the existing Render service and restored ignored local configuration through the existing environment sync utility.
- Checks: all three central/backend values agree, secret destination files are Git-ignored, and provider keys are absent from frontend configuration. No provider API calls or credential values were included in this record.
- Human review: requested by the user; configuration changes have not been separately reviewed.

## 2026-10-11 02:51 IST - Destination grouping and multi-user correctness

Codex applied the user's city-cluster clarification, researched PostgreSQL concurrency/partial uniqueness and PostGIS clustering, and used two scoped agents for request-idempotency and lifecycle fixes. Added database architecture, synthetic 200-arrival and six-passenger tests, locking/expiry/readiness safeguards and migration 004. The isolated release snapshot passed all 100 tests on a dedicated local release-test database; lint/format/contracts passed. Applied migrations 003/004 to authorized Supabase after a schema-only backup and verified runtime access/index/RLS without exporting passenger data. Teammate voice/PDF/frontend working edits were preserved and excluded. Human review pending; no perfect-database or production-capacity claim.

## 2026-10-11 02:51 IST - Ticket autofill and recorded preferences

Codex inspected the existing Groq/Sarvam adapters, researched official provider/PDFium/browser documentation and MDN's public dictaphone pattern, then implemented ticket-first draft filling, scanned-PDF rendering, explicit review reset, microphone recording/WAV conversion and transcript review. No prebuilt application was imported. Added frontend/provider regressions and updated setup/API/research documentation. Applied Agent Reach, code-review, frontend/DevOps and product UI guidance; Exa was unconfigured and Context7 unavailable, so built-in web access supplied primary sources. Frontend lint/typecheck, 20 tests and production build passed; final backend suite passed 116 tests in a separate disposable database and updated provider suite passed 30 tests. A final shared-database run collided with another chat resetting its schema; an isolated rerun passed and the temporary database was removed. Corrected PDF resource management and test harness failures. Local key presence was checked without printing credentials; a synthetic ticket smoke attempt returned the expected missing-configuration error. No private ticket/audio was sent and no successful live call or new deployment is claimed. Human review pending; concurrent teammate changes were preserved.

## 2026-10-11 02:40 IST - Central environment setup

Codex consolidated local configuration at user request without printing or committing keys. Built and verified a scoped sync command with protection against accidentally clearing saved values. Three synthetic tests and Ruff passed; real settings match the central file. Human review pending. No hosting credentials changed during this task.


## 2026-10-11 02:36 IST - Backend research and matching hardening

Codex audited matching/lifecycle/database code, consulted primary technical and competitor sources, used a read-only architecture review agent, and implemented focused matching, queue and schema safeguards. Added a research/architecture report and real PostGIS regression cases. Baseline 53 tests and final 76 tests passed; Ruff lint/format and contract checks passed after correcting one test import-order issue. No frontend or AI-provider changes, production migration, deployment or load-performance claim. Human review remains pending; rollout needs migration-first coordination. Agent Reach's Exa was unconfigured and Context7 offline, so built-in web research and the supported Jina reader supplied primary references; update check was rate-limited.

## 2026-10-11 02:36 IST - Local credential recovery

Codex checked configuration presence without revealing credentials, recovered the available provider values from the user-approved Render environment into ignored backend/.env, and removed obsolete blank Grok entries. Verified all three restored keys remain present. No unrelated in-progress backend changes were modified; no credentials were committed.

## 2026-10-11 02:23 IST - Live authentication review

Codex verified deployed desktop/mobile auth screens and signup/return navigation, captured screenshots, and checked opaque computed form backgrounds and absence of horizontal overflow. CI passed for `4796756`, Vercel READY, Render live. Recorded actual health/readiness and 401 behavior. Human login and full ride test remain pending.

## 2026-10-11 02:20 IST - Authentication usability repair

Codex reproduced the unreadable live Clerk modal, identified missing shadcn surface tokens, and applied Clerk custom appearance and Impeccable product guidance. Added dedicated auth routes, safe workspace return links, readable form surfaces and Clerk name prefill. Ten frontend tests plus lint/typecheck passed; production webpack build passed; browser review in progress. Human review and completed login pending.

## 2026-10-11 02:18 IST - Provider wiring

Codex inspected key presence without displaying values, researched official Groq API capabilities, switched the adapter and consent copy to Groq, and validated synthetic ticket/audio requests. Corrected Aviationstack free-plan live queries while preserving exact date filtering. Regression checks: 53 backend and eight frontend tests passed; local Turbopack build panic remains unresolved. Human review pending. No personal ticket/audio or credential was committed.

## 2026-10-11 02:01 IST - Deployment verification

Codex verified Vercel READY, successful GitHub API/web CI for `17e7aef`, and the live Clerk sign-in modal. Updated README evidence. Human review and completed user-session testing remain pending; provider credentials are still missing. No credentials were committed.

## 2026-10-11 01:56 IST - Authentication and backend hosting

Codex used existing Clerk login and a user-completed Render CLI login to provision the kootu authentication app and free backend service. Automatic review initially blocked uploading the Clerk secret; explicit user approval then authorized Vercel/Render credential storage. Keys/passwords remained outside Git and browser code. Verified Clerk RSA JWKS, authenticated CLI linking, local auth-enabled build, Render blueprint validation and live health/readiness. Preserved a teammate's newly pushed route-grouping commit by fast-forward. Provider dashboards require user login; provider usage and full signed-in rides remain unverified. Human review pending.

## 2026-10-11 01:43 IST - Supabase provisioning

Codex discovered existing CLI authentication, obtained explicit user approval after automatic review blocked initial project creation, then created/linked kootu in the named organization and Mumbai region. Applied existing migrations, configured a dedicated backend database role and stored generated credentials only in ignored local files. Verified remote table/RLS/policy/migration counts, backend-role login and session advisory locks; restarted the local API. Added CLI configuration and truthful setup records. Human review pending. No hosted API or live provider authentication claimed.

## 2026-10-11T01:43:16+05:30 - Group frontend routes by role

At the user's request, Codex moved the driver route into the `(driver_app)` Next.js route group and home, passenger and operator routes into `(user_app)`. Updated setup and structure documentation. Existing route URLs are preserved. Human review pending; verified the resulting paths and ran `git diff --check`; no tests or build checks were run.

## 2026-10-11 01:35 IST - Team navigation and folder move

Codex reorganized the repository into frontend/backend/database/integrations at the user's request, added contributor-facing guides, repaired all current tooling paths and updated the existing Vercel root. Corrected database test relative paths and cleared stale generated Next.js output after moving folders. Human review pending. 53 backend/8 frontend tests, Ruff, frontend lint/typecheck, clean production build and generated contract checks passed. GitHub CI for ee40be9 passed (run 38082348112); the automatic Vercel deployment reached READY using frontend. Both local previews restarted. Provider adapters stay server-side. No credentials committed; Supabase CLI capability was checked against official documentation, without claiming installation or login.

## 2026-10-11 01:26 IST - Vercel setup

At the user's direction, Codex used the existing Vercel CLI account to create/link kootu, deploy the public setup website and connect its GitHub repository. Added a deployment upload exclusion file and documented the deployed URL, disabled booking state and outstanding Supabase/backend work. Verified the upload manifest, Vercel READY build and public homepage/passenger page. Human review pending. No private environment files or credentials were committed.

Use Codex during the hackathon and briefly document its actual contribution here. Add a row after each meaningful task or milestone. Keep summaries concise and omit secrets, private data, and full chat transcripts.

## Event build log

Codex bootstrapped COOTU from the event documentation scaffold. Human review remains pending.

| Date and time with timezone | Tool / model, if known | Task | Assistance and affected files | Human review / corrections | Validation and result |
| --- | --- | --- | --- | --- | --- |
| 2026-10-10T23:53:48+05:30 | Codex | COOTU architecture bootstrap | Next.js shell and Clerk boundary, FastAPI health/settings/tests, PostGIS migration, CI, architecture/setup/validation docs; no full product features | Pending; corrected Next.js links, dependency compatibility and test-client deprecation | Frontend install/lint/typecheck/build; six API tests, Ruff, import and live HTTP; desktop/mobile browser review; production npm audit clean, tooling advisories disclosed. |

## Template preparation

On 10 October 2026, Codex prepared this documentation template from the organizer's supplied rules and checked the linked Luma page for the event name and dates. This covered `README.md`, `RULES.md`, `AGENTS.md`, `CHANGELOG.md`, `AI_USAGE.md`, `SUBMISSION.md`, `.gitignore`, and the pull request checklist. Agent validation covered local links, event consistency, required documents, and diff whitespace; organizer review is pending.

This preparation is separate from participant project implementation and participant AI usage during the event.

## 2026-10-11 00:34 IST - Backend implementation

Codex implemented the persistent ride lifecycle, authentication/authorization, deterministic matching, driver review/availability/offers, provider adapters and polling, collaboration guidance and regression tests. Clarification corrected Serum to Sarvam and ticket exchange to ticket extraction. Human review pending. 45 backend tests passed; live credentials and frontend integration remain.

## 2026-10-11 01:01 IST - Frontend integration, research and verification

Codex connected the passenger, driver and operator screens, implemented reviewed Grok/Sarvam intake, hardened provider budgets/privacy/locking/flight polling, and documented official competitor findings and team workflow. Corrections included transient upload handling in the jsdom harness, preserving existing delays when estimates disappear, withholding exact addresses before assignment, and literal SQL handling during migration/RLS provisioning. Human review pending.53 backend and8 frontend tests passed locally, lint/types/build/contracts passed, production npm audit0. Live account and deployment testing remain pending.

## 2026-10-11 01:05 IST - CI evidence

Codex verified the public GitHub Actions result for the final implementation and recorded its exact SHA/run link. No implementation changed after that validated checkpoint. Human review and live account testing remain pending.

## 2026-10-11 04:01 IST - Simpler booking flow

At the user's direction Codex removed provider/consent and recording-panel clutter, implemented three guided booking steps, inline automatic Sarvam dictation, arrival-time/luggage/drop-off suggestions and a reduced-motion-aware save celebration. Researched official Sarvam API options and GOV.UK question-page patterns, retained bounded REST requests through lossless segmentation, updated contracts/docs and regression coverage. Human review pending. 119 backend and 23 frontend tests passed; lint/types/format/contracts/build passed. Synthetic mobile/desktop browser review found and corrected a Next-click validation race and native date event synchronization. Target-phone multilingual dictation and real signed-in rides remain unverified; temporary synthetic QA code removed.

## 2026-10-11 05:59 IST - Upload failure diagnosis

Codex checked live API health, readiness and CORS preflight; reproduced the upload exception path losing browser CORS headers and fixed its exact-origin error response. Added text-first digital PDF intake, 20 MB file bounds, ten-minute segmented dictation and differentiated timeout errors, then updated tests/contracts/guides. 123 isolated backend and 24 frontend tests passed; production build passed, with lint/types/format/contracts checked before commit. Private Clerk directory lookup was rejected by automatic approval review and not retried; public/synthetic alternatives used. The user's original PDF and authenticated provider reproduction remain unavailable. Human review pending.

## 2026-10-11 06:06 IST - Cross-step autofill consistency

Codex consolidated all ticket-derived passenger inputs into one shared draft so one extraction updates values on every booking step together. Added regressions for next/back persistence, printed destination autofill, zero luggage and stale-field clearing; updated guides. 25 frontend tests, lint/types and production build passed. The original PDF retry remains deferred by the user; previous upload-fix deployment/CI and 123 backend regressions are verified. Human review pending.

## 2026-10-11 06:25 IST - Ticket review experience

Codex implemented honest progress feedback, automatic ticket-shaped review, expanded strictly validated extraction fields and implicit-submit prevention. Replaced confusing readiness input with arrival-driven pickup calculation, preserved shared drafts, and updated contracts/docs. Checks: 123 isolated backend and 27 frontend tests, lint/types/build, Ruff/format and contract consistency; synthetic browser review at desktop and 390px. Temporary preview was removed. Real ticket accuracy/provider E2E still requires human review; human review pending.

## 2026-10-11 06:38 IST - Automatic 30-minute pickup calculation

Codex removed arrival/local-time inputs, changed the landing buffer to 30 minutes, added authenticated flight-arrival fallback and stale-timing invalidation, and updated contracts/tests/guides. Validated this milestone separately from concurrent routing/driver-location edits: 130 isolated backend and 28 frontend tests, style, contracts, lint/types/build. Real flight-provider lookup remains human verification; human review pending.

## 2026-10-11 06:41 IST - Correct concurrent staging contamination

Codex corrected two driver-location references accidentally included while staging the concurrently edited passenger component. Initial frontend CI/deploy failed while backend CI passed. Validated the corrected committed snapshot with 28 tests, lint/types and isolated build; driver work remains locally preserved. No history rewrite; corrective commit and fresh deployment checks. Human review pending.

### 2026-10-11 06:48 IST - Maps rollout follow-up

Codex pushed `220d842`, verified successful CI and Vercel/Render rollout, checked hosted readiness and location endpoints, and added explicit upload exclusions. The signed-out passenger page loads; authenticated phone GPS was not exercised. Environment sync tests passed and production dependency audit returned zero advisories. Human review pending.


## 2026-10-11 07:54 IST — PR #1 integration review

- Task: adopt passenger frontend while protecting image/voice and core backend services.
- Codex inspected PR conflicts and CI failures, retained main's backend/contracts, connected chat to existing ticket/voice integrations, corrected API parameters and eligibility/profile behavior, preserved driver location, repaired lockfile, and added two behavioral chat tests.
- Checks: 142 backend + 42 frontend tests passed; frontend lint/typecheck/build and backend Ruff/contracts passed. Production npm audit: zero vulnerabilities. Signed-out dashboard browser check passed.
- Human review: requested integration authorized; implementation review and real-device signed-in end-to-end validation remain pending. No claim of live media-device testing.


## 2026-10-11 07:56 IST — browser contrast correction

Codex browser inspection caught unreadable dark-mode link buttons and fixed the CSS cascade. Production rebuild passed. GitHub web/API checks and Vercel preview passed for 7e12571. Human review and physical microphone/GPS testing remain pending.


## 2026-10-11 08:12 IST — remaining PR integration and repeated verification

- User requested clearing remaining PRs and two to three verification passes. Codex reviewed PR #2, identified disconnected prototype behavior, resolved conflicts and integrated its visual shell with current driver operations while leaving backend implementation/contracts unchanged.
- Added availability/lifecycle/error/polling UI tests and a media-to-trip API test with real disposable PostGIS, synthetic uploads and stubbed provider boundaries. Local checks: 143 backend tests and 46 frontend tests pass; lint/typecheck/build and backend contracts pass. Clean CI and deployed browser verification pending at this checkpoint.
- Human review: integration requested; changes not yet human-reviewed. No fabricated live-device/provider test claims. Unsupported earnings and online support submission are disclosed rather than simulated.

- Browser testing found driver subpage header sign-in returned to passenger chat. Codex extended the exact internal-route allowlist and tested unknown/traversal paths remain rejected.
