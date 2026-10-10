# PostgreSQL/PostGIS persistence

Apply ordered SQL through `backend/migrate.py` using a migration-owner connection. It serializes migration runs with an advisory transaction lock, records SHA256 hashes and refuses edited applied migrations. No production `create_all`, SQLite or in-memory fallback exists.

Domain tables: profiles, passenger_requests, drivers, vehicles, ride_groups, ride_members, driver_offers, trip_events. `provider_usage` tracks hashed Clerk subjects and hourly provider request budgets; maintenance deletes buckets older than two days. Passenger geography is a stored WGS84 point generated from longitude/latitude with a GiST index. The application search path is `public,extensions`, supporting PostGIS installed in either of those schemas.

Request membership's primary key prevents one request joining multiple groups. Partial unique indexes prevent multiple ASSIGNED/IN_PROGRESS groups using one driver or vehicle. Database checks validate roles, coordinates and capacities; HTTP schemas additionally validate time/flight/needs. Foreign keys keep references consistent. Candidate request versions and `FOR UPDATE` locks prevent stale matching from committing. Completed trips remain durable across engine/process reconnection.

## Server role and RLS

All application tables have RLS enabled and no browser-facing policies. Never put a database password or Supabase service-role credential in the frontend. The migration owner can bypass RLS, which is useful for migrations/tests. For normal deployment create a dedicated **server-only** role, grant schema usage and only application table privileges, and add explicit role policies. Example SQL after the administrator has created `kootu_api` with a password in the secret manager:

```sql
GRANT USAGE ON SCHEMA public, extensions TO kootu_api;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles','passenger_requests','drivers','vehicles','ride_groups',
    'ride_members','driver_offers','trip_events','provider_usage'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO kootu_api', table_name);
    EXECUTE format('CREATE POLICY server_access ON public.%I TO kootu_api USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END $$;
```

Run this role-policy provisioning once per database, with a unique role and administrator review. These policies give the trusted backend role access; HTTP ownership checks enforce individual user boundaries. Anonymous/authenticated browser roles have no policies. Do not grant them this role or BYPASSRLS. `kootu_migrations` stays owned by the migration role, outside API privileges. Set the API's `DATABASE_URL` to the provisioned server role after migrations. Supply the migration-owner URL only to migration operations. The dedicated-role SQL has not been applied to a remote Supabase project.

Use PostgreSQL direct or session-mode pooling: maintenance uses session advisory locks, incompatible with transaction-only pooling. Tests use a disposable PostGIS database and destructive setup only when its name contains `test`. CI supplies one. Database backups, retention and operational access are deployment responsibilities; no cloud project is created by this code.
