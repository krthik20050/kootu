# Backend

The FastAPI server lives here. `app/api` handles HTTP routes, `app/core` authentication/configuration/database sessions, `app/models` persistence, `app/schemas` input/output validation and `app/services` matching, ride lifecycle and external API adapters.

Use the Python venv and locked installation commands in [root setup](../README.md). Copy `.env.example` to `.env`, configure server-only credentials, apply reviewed migrations with `python migrate.py`, and run `python -m uvicorn app.main:app --reload --no-access-log`.

Checks: `python -m ruff check .`, `python -m ruff format --check .`, `python -m pytest`, `python export_contracts.py --check`. Run from this folder. Database tests require a disposable test database; they reset its schema. Never point tests at the shared Supabase project.

The matching hardening release requires migration `202610110003_matching_integrity.sql` before startup. Optional `DISPATCH_HORIZON_MINUTES` defaults to 30; advance requests remain waiting outside it. See the [matching research and risk register](../docs/backend-research-and-plan.md). Public response types are unchanged.

After changing API contracts, run `python export_contracts.py` and commit the generated frontend types and OpenAPI snapshot together. External API configuration is indexed in [integrations](../integrations/README.md).
