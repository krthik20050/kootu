# Project submission

Complete this file during the hackathon and use it to prepare your submission through the method announced by the organizers. Do not submit your project to the template repository.

## Project

- **Project name:** COOTU
- **Short description:** Airport shared-cab coordination around compatible arrival times and small destination clusters. Current implementation is a public concept shell and API architecture bootstrap; working matching/booking is planned.
- **Code repository URL:** https://github.com/krthik20050/kootu
- **Final submitted implementation commit SHA:** TODO
- **Working demo URL or local demo steps:** Local bootstrap walkthrough in [README.md](README.md#hackathon-demo); no deployed demo yet.
- **Demo access requirements:** Node 22+, Python 3.13 recommended. Public preview needs no credentials; real Clerk mode requires team-configured keys.

## Participants

Participate solo or in a team of up to 4. Remove unused rows.

| Participant name | GitHub handle | Contribution |
| --- | --- | --- |
| TODO | TODO | TODO |

## Run and demonstrate

- **Prerequisites and versions:** Node 22+, npm, Python 3.13 recommended; see README.
- **Install command:** Web: `npm ci` in `apps/web`; API: pip/venv locked installation in README.
- **Required environment variable names:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AUTH_ENABLED`; Clerk keys only for enabled auth. API `APP_ENV`, `FRONTEND_URL`; sanitized examples in each app.
- **Start command:** Web: `npm run dev`; API: `python -m uvicorn app.main:app --reload --no-access-log` inside the configured venv and `apps/api`.
- **Demo walkthrough:** Show public concept landing and `/health` plus `/docs`. Explain planned deterministic matching separately.
- **Checks performed and results:** Frontend lint/typecheck/build, six backend tests, Ruff, imports and live HTTP passed; desktop/mobile checked. Details: [validation](docs/bootstrap-validation.md).
- **Known limitations or incomplete features:** Bootstrap only. No working booking/matching, live Clerk/DB/provider integration or deployment. Dev-tool security advisories disclosed in README. Participant names and final submitted SHA remain pending.
- **Libraries, APIs, and public datasets used:** Library/source links in README; no external dataset or live provider is used.
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
