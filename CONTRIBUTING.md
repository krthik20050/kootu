# Working together on kootu

Every developer has their own clone, environment files and feature branch. `main` is the integrated version. Push freely to your own branch; merge to `main` only through a reviewed pull request with passing checks. Git can catch file conflicts, but tests and review are needed to catch incompatible behavior. No process guarantees zero errors.

## First setup

The repository owner invites each person's GitHub account with suitable repository access; never share accounts, tokens or production secrets. For a larger project, prefer a GitHub organization with frontend/backend/database teams. This event's [RULES.md](RULES.md) allows at most four participants in the hackathon team; a 23-person contribution model is for a separate larger project or organizer-approved context.

Follow README setup. Each developer uses a separate database project/schema for migrations and test data. Keep shared production credentials in the deployment secret store, not in chat or Git.

## Daily workflow

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/passenger-request-form
# Make a small, complete change. Run checks. Update relevant docs and changelog.
git add apps/web/src/components/passenger-request-form.tsx
git commit -m "feat: add passenger request form"
git push -u origin feat/passenger-request-form
```

Open a pull request into `main`, describe what changed, link its task and state the checks. The path above is an example for a future component; stage your actual files explicitly. Another person reviews; CI checks the proposed merged code. A maintainer merges after checks/review. Preserve event development commits rather than squashing away the event record. Do not force push or rewrite shared history.

When `main` changes while your branch is active:

```sh
git fetch origin
git merge origin/main
# If conflicts occur, resolve deliberately with the other author. Run checks again.
git push
```

Never choose “keep mine” for every conflict. A conflict means two changes need reconciliation, not that one teammate's work should be deleted.

## Divide work by feature and contract

| Area | Main paths | Coordination needed |
| --- | --- | --- |
| Frontend | `apps/web/src` | API field names, states and errors |
| Backend | `apps/api/app` | OpenAPI contracts, role/ownership rules |
| Database | `supabase/migrations` | Migration IDs, schema compatibility |
| Integration/testing | `apps/api/tests`, CI, docs | End-to-end flows and release checks |

Two developers: one frontend, one backend; agree on the request/response contract first. Three or four: add database/matching and integration/testing owners. Twenty-three outside this event: use small feature teams, an owner per area, short-lived branches, small PRs and one integration/release coordinator. Do not create 23 long-lived personal copies of the architecture.

Frontend and backend communicate through HTTP/OpenAPI, not by sharing source files. For example, agree on `POST /ride-requests` and its required fields; frontend builds the form while backend implements validation/persistence. Generate frontend types from OpenAPI and compile in CI so incompatible changes fail early. Use explicit test fixtures or mocks in frontend tests, never present mock data as production functionality.

Use additive API changes first: add a field/endpoint, update consumers, then remove old fields only in a coordinated change. Migration changes must be uniquely timestamped and reviewed. Never edit a migration already applied to shared databases; add a new one. No developer applies exploratory migrations to production.

## Main-branch settings to enable in GitHub

Under repository Settings → Rules → Rulesets (or branch protection), target `main` and require:

- Pull requests and at least one approving review from someone other than the author.
- Passing `web`, `api` and database checks added by this repository.
- Branch up to date with `main` before merge, or a supported merge queue for a busy larger team.
- Resolved review conversations; dismiss stale approvals after meaningful changes.
- No force push or deletion; apply the rules to maintainers too where supported.

These remote rules must actually be enabled by an authorized repository administrator. Documentation and CI files alone do not protect `main`. See [GitHub protected-branch documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

Assign actual GitHub usernames/teams before enabling CODEOWNERS; no fictional identities are inserted. Keep a backup maintainer so one person's absence does not block the team. Deploy preview branches separately; only verified `main` is released to shared environments.
