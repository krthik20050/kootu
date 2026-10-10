# Project submission

Complete this file during the hackathon and use it to prepare your submission through the method announced by the organizers. Do not submit your project to the template repository.

## Project

- **Project name:** kootu
- **Short description:** Airport shared-cab coordination around compatible arrival times and small destination clusters. Includes connected passenger/driver/operator screens, persistent PostgreSQL/PostGIS matching and confirmed ticket/voice intake. Live provider configuration is pending.
- **Code repository URL:** https://github.com/krthik20050/kootu
- **Final submitted implementation commit SHA:** TODO (team must identify the actual organizer submission)
- **Latest validated implementation checkpoint:** `3a03e7ce8cf957b783bd9a954f951a59060e21f8`; [passing CI](https://github.com/krthik20050/kootu/actions/runs/38080277973). Subsequent documentation commits do not change this implementation.
- **Working demo URL or local demo steps:** Local configuration/demo walkthrough in [README.md](README.md#hackathon-demo); no deployed demo yet.
- **Demo access requirements:** Node 22.12+, Python 3.13 recommended. Public preview needs no credentials; real Clerk mode requires team-configured keys.

## Participants

Participate solo or in a team of up to 4. Remove unused rows.

| Participant name | GitHub handle | Contribution |
| --- | --- | --- |
| TODO | TODO | TODO |

## Run and demonstrate

- **Prerequisites and versions:** Node 22.12+, npm, Python 3.13 recommended; see README.
- **Install command:** Web: `npm ci` in `frontend`; API: pip/venv locked installation in README.
- **Required environment variable names:** Web Clerk keys, API database/Clerk issuer/Google/Grok/Sarvam/Aviationstack settings; complete list and sanitized examples in README.
- **Start command:** Web: `npm run dev`; API: `python -m uvicorn app.main:app --reload --no-access-log` inside the configured venv and `backend`.
- **Demo walkthrough:** Follow the configured multi-account booking/approval/offer/trip walkthrough in README; keyless mode demonstrates setup and regression checks only.
- **Checks performed and results:** Frontend lint/typecheck/build and 8 interaction tests; 53 backend tests using real PostgreSQL/PostGIS, Ruff and contract checks. Details: [validation](docs/backend-validation.md).
- **Known limitations or incomplete features:** Live Clerk/provider accounts and deployment remain unverified. No fares/payments, GPS/emergency dispatch or automatic document verification. Dev-tool advisories are disclosed in validation. Participant names and final submitted SHA remain for the team.
- **Libraries, APIs, and public datasets used:** Library/source links in README; no external dataset or live credentials are bundled.
- **AI usage record:** [AI_USAGE.md](AI_USAGE.md)
- **Development change log:** [CHANGELOG.md](CHANGELOG.md)

## Submission checklist

- [ ] The project implementation started from scratch at the event.
- [ ] I participated solo or with no more than 4 team members in total.
- [ ] Codex was used during development and its usage is documented.
- [ ] The code repository URL, short description, and working demo are provided.
- [ ] README setup and demo instructions match the submitted code.
- [ ] Actual checks and known limitations are documented.
- [ ] Meaningful changes are documented and committed throughout development.
- [ ] The final implementation is committed and pushed, and its SHA is recorded above.
- [ ] No credentials or private data are included in the repository or demo instructions.
- [ ] The organizers' announced submission method and timing have been followed.

Event reference: [DevDay Exchange Community: Kochi on Luma](https://luma.com/z10nz8gp). The event wraps up by **10:00 AM IST on 11 October 2026**.
