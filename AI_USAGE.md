# AI usage record

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
