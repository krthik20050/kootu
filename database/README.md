# Database

`migrations` contains the ordered PostgreSQL/PostGIS schema. Keep migration filenames unique and never edit an already-applied migration. Coordinate schema changes with the backend and review them before applying to a shared database.

Run `python migrate.py` from `backend` with a migration-owner `DATABASE_URL`. The runner reads this folder, tracks hashes and serializes migration operations. See [database roles and RLS](../docs/database.md) for the dedicated server role.

Supabase has an [official CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). With Node 20+ you can use `npx supabase --help`, `npx supabase login` and `npx supabase projects list`. Remote account access is separate from Vercel login. The CLI has not been installed or authenticated by this folder change.

This project currently uses its Python migration runner, not Supabase CLI migration tracking. Do not run `supabase db push` against these migrations without first agreeing on a migration-history transition. `supabase start` runs the full local Supabase stack and requires a container runtime; it is unnecessary just to use the hosted database.
