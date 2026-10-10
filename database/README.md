# Database

`migrations` contains the ordered PostgreSQL/PostGIS schema. Keep migration filenames unique and never edit an already-applied migration. Coordinate schema changes with the backend and review them before applying to a shared database.

Run `python migrate.py` from `backend` with a migration-owner `DATABASE_URL`. The runner reads this folder, tracks hashes and serializes migration operations. See [database roles and RLS](../docs/database.md) for the dedicated server role.

Supabase has an [official CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). CLI 2.120.0 was run through npx using an existing authenticated account. Project `hsxahwksjlvtrgpbrwvc` (`kootu`, Mumbai) is created and linked. Three migrations and the dedicated server role were provisioned remotely. Database connection, nine tables with RLS, nine backend-only policies and session advisory locks were verified. No paid upgrade was selected.

The tracked `supabase/config.toml` is CLI/local-stack configuration, not a copy of remote secrets. Link metadata in `supabase/.temp` and credentials in `.env.supabase` are ignored. Teammates must authenticate their own account and link again from the repository root:

```powershell
npx supabase@2.120.0 login
npx supabase@2.120.0 projects list
npx supabase@2.120.0 link --project-ref hsxahwksjlvtrgpbrwvc --workdir database
```

Only authorized organization members can link. Enter any required database password directly in the CLI rather than chat or Git. The local backend `.env` contains the dedicated server-role connection; the migration-owner connection stays in ignored `.env.supabase` as `SUPABASE_MIGRATION_DATABASE_URL`. When applying future migrations, load that owner URL securely as `DATABASE_URL` for the migration process only, then unset it. Do not replace the API runtime role with the owner.

This project currently uses its Python migration runner, not Supabase CLI migration tracking. Do not run `supabase db push` against these migrations without first agreeing on a migration-history transition. `supabase start` runs the full local Supabase stack and requires a container runtime; it is unnecessary just to use the hosted database.
