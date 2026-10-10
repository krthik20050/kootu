# Change log

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
