# Bootstrap validation record

Date: 10 October 2026 IST. Local machine: Windows PowerShell, Node 22.21.1, npm 11.15.0, Python 3.13.9. This record distinguishes observed local checks from planned remote integrations.

## Results

| Check | Observed result |
| --- | --- |
| Existing work | Repository initially clean, documentation scaffold only; all tracked files inspected before editing |
| Frontend install | `npm install` and subsequent clean `npm ci` succeeded |
| Frontend lint | Initial internal-link errors corrected; final lint passed |
| TypeScript | Passed |
| Production build | Passed; `/` and not-found prerendered, Clerk proxy compiled |
| Configuration failures | Actual builds rejected empty API URL and enabled Clerk without keys with clear messages |
| Backend install/import | Editable pip install succeeded; `from app.main import app` returned COOTU API |
| API tests | Six passed, no warnings: health/OpenAPI, CORS, three invalid origins, production HTTPS configuration |
| Ruff | Lint and format checks passed |
| Python environment | `pip check`: no broken requirements; lockfile dry-run resolved installed versions |
| Live HTTP | Uvicorn startup succeeded; `/health` returned 200/documented JSON; OpenAPI contained only `/health` |
| Browser | 1440x1000 and 390x844 checked; no horizontal overflow; correct preview labels; concept anchor navigated; no captured console errors/warnings |
| Production npm audit | Zero advisories |
| Full npm audit | Five high tooling advisories from unpatched `braces` dependency chain; unresolved upstream |
| Secrets | Sanitized examples; local `.env.local`, dependencies/build outputs ignored; no real credentials created |

Health returned:

```json
{"status":"ok","service":"cootu-api","version":"0.1.0","environment":"development"}
```

Browser DOM measurements: desktop `innerWidth=1440`, document scroll width 1425; mobile `innerWidth=390`, scroll width 375. The difference is the scrollbar; neither view had horizontal overflow. Rendered copy contained no em dash. The illustration is marked CONCEPT and explicitly says there is no live map or ride availability.

## Executed development and validation commands

Commands below were run in PowerShell. Repeated checks are listed once unless a variant matters. File inspection used `Get-Content`, `Get-ChildItem` and `rg --files --hidden -g '!.git'`, including all initial tracked documentation, ignore rules and PR template. The attachment and relevant skill files were read before implementation. Source files were written with `apply_patch`.

Repository root:

```powershell
git status --short
git ls-remote https://github.com/krthik20050/kootu.git HEAD
git clone https://github.com/krthik20050/kootu.git .
git remote -v
git branch --show-current
git log -1 --format='%h %s'
git diff --stat
git diff -- .gitignore
git diff --check
git diff --cached --check
git diff --cached --stat
git check-ignore apps/web/.env.local apps/web/node_modules apps/api/.venv
gh auth status
node --version
npm --version
python --version
python 'C:\Users\DELL\.codex\skills\code-reviewer\scripts\code_quality_checker.py' apps/api/app --language python --json
python 'C:\Users\DELL\.codex\skills\code-reviewer\scripts\code_quality_checker.py' apps/web/src --language typescript --json
```

The first restricted `git ls-remote` failed with a network/thread error; cloning with permitted network/process access succeeded. Initial remote was `https://github.com/krthik20050/kootu.git`, branch `main`, starting commit `ed3e837`. `gh auth status` reported invalid CLI credentials. Git transport access is checked separately when publishing the final commit.

From `apps/web`:

```powershell
npm view next version
npm view @clerk/nextjs version
npm view react version
npm view tailwindcss version
npm view braces version
npm view eslint-config-next@16.4.0 peerDependencies --json
npm view eslint version
Copy-Item .env.example .env.local
npm install
npm audit --json
npm install --save-dev --save-exact eslint@10.12.0
npm ls eslint --depth=1
npm install --package-lock-only
npm install --save-dev --save-exact eslint@9.39.5
npm ci
npm install --save-exact @clerk/ui
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
npm run start -- --hostname 127.0.0.1 --port 3000
```

Exact direct frontend dependencies were pinned from the resolved lockfile using:

```powershell
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json'));const l=JSON.parse(fs.readFileSync('package-lock.json'));for(const section of ['dependencies','devDependencies'])for(const name of Object.keys(p[section]))p[section][name]=l.packages['node_modules/'+name].version;fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
```

Expected configuration failures were exercised in a separate shell process (did not change `.env.local`):

```powershell
$env:NEXT_PUBLIC_API_URL = ''
npm run build
$env:NEXT_PUBLIC_API_URL = 'http://localhost:8000'
$env:NEXT_PUBLIC_AUTH_ENABLED = 'true'
npm run build
```

Both builds intentionally exited with errors. A normal configured build was rerun successfully after those checks. ESLint 10 was trialled, produced plugin peer incompatibilities, and was reverted to compatible ESLint 9. Full audit has no patched `braces` version available; `npm audit fix --force` was not used because it proposed an incompatible Next.js lint-tool downgrade. Production audit was clean. The first restricted audit could not resolve the npm registry; rerunning with network access succeeded.

From `apps/api`:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e '.[dev]'
.\.venv\Scripts\python -m ruff check . --fix
.\.venv\Scripts\python -m ruff format .
.\.venv\Scripts\python -m ruff check .
.\.venv\Scripts\python -m ruff format --check .
.\.venv\Scripts\python -m pytest
.\.venv\Scripts\python -m pytest -v
.\.venv\Scripts\python -c "from app.main import app; print(app.title)"
.\.venv\Scripts\python -m pip check
.\.venv\Scripts\python -m pip install --dry-run -r requirements-dev.lock
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Lockfiles were generated using Python's installed distribution metadata and `packaging.requirements.Requirement`: traverse base dependencies, account for Windows/Linux markers, write exact runtime pins and development-only pins. This excludes the editable application's absolute path. Python tooling remains pip/venv only. The initial httpx test-client deprecation was fixed by switching to Starlette's supported httpx2 dependency. Restricted TestClient execution stalled; tests rerun with normal thread/process access passed. No test pass is inferred from the stalled run.

Live HTTP checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health | ConvertTo-Json -Compress
(Invoke-RestMethod http://127.0.0.1:8000/openapi.json).paths.PSObject.Properties.Name
```

Browser checks used the Codex browser tool, not a claimed automated Playwright suite: screenshot/DOM review, viewport overrides at the sizes above, concept-link click and console-log inspection. Temporary viewport overrides were reset afterward.

Code-reviewer scripts and manual diff review covered application code, integration boundaries, secrets/config and CI. The heuristic script's medium health-validator complexity finding was simplified into a typed predicate with strict environment validation. Low findings around HTTP codes, coordinate limits, port and SVG dimensions were reviewed as conventional literals; a false unimplemented-interface warning on enum vocabulary is not a working feature claim. Local Markdown file links and staged whitespace checks passed. RULES.md and AGENTS.md are unchanged.

## Not verified

Live Clerk authentication and configured keys, private API authorization, real database/PostGIS migration execution, matching, routing, uploads/OCR, Realtime, Vercel/Render deployment, remote GitHub Actions execution, Linux environment installation and performance/accessibility scores. The migration is prepared SQL, not an applied database. No users or provider accounts were created.

Human review is pending. See CHANGELOG and AI_USAGE for the final milestone and Git history for the resulting commit; push status is reported in the handoff.

## File inventory

| Change | File |
| --- | --- |
| Created | `.github/workflows/ci.yml` |
| Modified | `.gitignore` |
| Modified | `AI_USAGE.md` |
| Modified | `CHANGELOG.md` |
| Modified | `README.md` |
| Modified | `SUBMISSION.md` |
| Created | `apps/api/.env.example` |
| Created | `apps/api/app/__init__.py` |
| Created | `apps/api/app/api/__init__.py` |
| Created | `apps/api/app/api/health.py` |
| Created | `apps/api/app/core/__init__.py` |
| Created | `apps/api/app/core/config.py` |
| Created | `apps/api/app/main.py` |
| Created | `apps/api/app/models/__init__.py` |
| Created | `apps/api/app/models/identity.py` |
| Created | `apps/api/app/schemas/__init__.py` |
| Created | `apps/api/app/schemas/integrations.py` |
| Created | `apps/api/app/services/__init__.py` |
| Created | `apps/api/app/services/integrations.py` |
| Created | `apps/api/pyproject.toml` |
| Created | `apps/api/requirements-dev.lock` |
| Created | `apps/api/requirements.lock` |
| Created | `apps/api/tests/test_health.py` |
| Created | `apps/web/.env.example` |
| Created | `apps/web/components.json` |
| Created | `apps/web/eslint.config.mjs` |
| Created | `apps/web/next-env.d.ts` |
| Created | `apps/web/next.config.ts` |
| Created | `apps/web/package-lock.json` |
| Created | `apps/web/package.json` |
| Created | `apps/web/postcss.config.mjs` |
| Created | `apps/web/src/app/globals.css` |
| Created | `apps/web/src/app/layout.tsx` |
| Created | `apps/web/src/app/page.tsx` |
| Created | `apps/web/src/components/auth-controls.tsx` |
| Created | `apps/web/src/components/auth-provider.tsx` |
| Created | `apps/web/src/lib/api/client.ts` |
| Created | `apps/web/src/lib/utils.ts` |
| Created | `apps/web/src/proxy.ts` |
| Created | `apps/web/tsconfig.json` |
| Created | `docs/api-contracts.md` |
| Created | `docs/architecture.md` |
| Created | `docs/bootstrap-validation.md` |
| Created | `docs/database.md` |
| Created | `docs/matching-engine.md` |
| Created | `supabase/migrations/202610100001_enable_postgis.sql` |
