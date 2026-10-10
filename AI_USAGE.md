# AI usage record

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
