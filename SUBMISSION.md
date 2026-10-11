# kootu — hackathon submission

## The idea

**Land together. Leave together.** kootu turns compatible airport arrivals into coordinated shared rides. Passengers confirm ticket-derived flight details, destination and travel needs; an approved driver accepts the group and manages pickup through completion. Voice instructions and flight updates reduce repetitive entry while deterministic matching keeps capacity and timing rules explicit.

- **Repository:** https://github.com/krthik20050/kootu
- **Working demo:** https://kootu-five.vercel.app
- **API health:** https://kootu-api-k5eh.onrender.com/health
- **Setup and demo steps:** [README](README.md#run-locally) and [short demo](README.md#a-short-demo)
- **Final submitted implementation SHA:** Not recorded. The team must enter the actual commit submitted through the organizer's process.
- **Verified deployed implementation:** `256a97888e9b81dd7d0b01534a2e7f994819d589`; [passing CI](https://github.com/krthik20050/kootu/actions/runs/38107237139). The actual event submission remains a team action.

## Participants

The organizer permits solo participation or a team of at most four. Actual participant attribution requires the team's confirmation; no names or contribution claims are fabricated.

| Participant name | GitHub handle | Contribution |
| --- | --- | --- |
| To be confirmed by team | To be confirmed by team | To be confirmed by team |

## Demonstrate the MVP

1. Open the homepage and show the passenger and driver registration choices.
2. Use distinct accounts to show separate persisted roles and workspaces.
3. Register a driver/vehicle and have the designated operator approve them; set them available.
4. Submit two compatible passenger requests using ticket/manual intake and optional voice instructions. Review all extracted fields before saving.
5. Find a group, accept it as the driver, inspect the assigned manifest, optionally share location, then start and complete the trip within its timing rules.
6. Show persisted passenger/driver history. Explain direct payment to the driver: this MVP has no fare quote, checkout, payment ledger, receipt or payout.

A successful live match requires enabled provider accounts, upcoming compatible requests and approved available fleet. Waiting or provider failure is an honest outcome; do not substitute fabricated journeys. Browser location/microphone access needs permission and a supported secure browser.

## Technical delivery

- **Stack:** Next.js/React/TypeScript, Clerk, FastAPI/SQLAlchemy, PostgreSQL/PostGIS; Geoapify, Groq, Sarvam and Aviationstack.
- **Prerequisites:** Node 22.12+, Python 3.13 recommended and PostgreSQL/PostGIS. Locked setup commands and environment names are in README; no secrets belong here.
- **Persistence:** Accounts, ride requests, groups, offers, fleet and lifecycle events are database-backed. Apply every reviewed migration before running the corresponding code.
- **Validation:** Frontend lint/types/unit tests/build; backend Ruff, generated-contract checks and unit/database integration tests. Two local passes and CI passed 50 frontend and 148 backend tests, with lint/types/build/contracts. Live provider checks passed using an isolated database; hosted passenger role redirects, request intake and synthetic ticket extraction passed. See [CHANGELOG](CHANGELOG.md) for scope and limits.
- **Combined regression:** Ticket and voice input through completed ride uses real disposable PostGIS with stubbed external providers. It does not establish a full live multi-account journey or device microphone/GPS reliability.
- **Deployment:** Vercel frontend, Render API, Supabase database. The hackathon uses Clerk development keys and a sleeping free backend; this is a deployed demo, not a commercial service readiness claim.
- **Known limits:** No payment processing/fare engine/emergency dispatch/automatic government-document verification. Real-account hosted end-to-end and physical-device checks must be reported separately when performed.
- **Sources:** [README source list](README.md#sources-and-research); no bundled external dataset.
- **Actual Codex contribution:** [AI_USAGE.md](AI_USAGE.md); implementation history in [CHANGELOG.md](CHANGELOG.md).

## Team confirmation before submission

- [ ] Confirm implementation started from scratch at the event and team size is compliant.
- [ ] Fill actual participant names, handles and contributions.
- [ ] Verify the deployed demo matches the intended submitted code.
- [ ] Record the actual submitted implementation SHA and its check results.
- [ ] Confirm no credentials or private participant data are committed.
- [ ] Submit the repository, description and working demo using the organizer's announced method.

[DevDay Exchange Community: Kochi](https://luma.com/z10nz8gp) runs 10–11 October 2026, ending by **10:00 AM IST on 11 October**. These checkboxes record human submission responsibilities, not completed actions. No published scoring rubric or winning outcome is assumed.
