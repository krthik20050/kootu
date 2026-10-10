# Environment files

Edit **`.environment/.env`** for all local app credentials and configuration. It contains backend providers, Clerk frontend settings and Supabase migration credentials. The real file is ignored by Git. `.env.example` contains only empty secrets and safe defaults.

After editing, run from the repository root:

```powershell
.\backend\.venv\Scripts\python scripts/sync_env.py
```

The command generates `backend/.env`, `frontend/.env.local` and `database/.env.supabase` with only the variables each component needs. It does not print values and refuses to overwrite a saved value with an empty central entry. Duplicate and missing variable names are rejected before writing. Restart local apps after syncing; frontend public settings are embedded during builds.

Production credentials remain privately stored in Vercel and Render. Editing this file does not update hosting environments automatically. Test-only credentials remain in `backend/.env.test`; never use the shared Supabase database for destructive tests.
