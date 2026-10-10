# Database design targets

Supabase-hosted PostgreSQL with PostGIS is the geospatial foundation. Passwords remain with Clerk. Database development is migration-first.

## Implemented

`supabase/migrations/202610100001_enable_postgis.sql` prepares an `extensions` schema and enables PostGIS if absent. No application tables or database connection exist. This migration has not been applied to a Supabase project or live-validated. An existing PostGIS installation is not moved; inspect `pg_extension` for its actual schema before later schema-qualified queries. See [Supabase PostGIS guidance](https://supabase.com/docs/guides/database/extensions/postgis).

## Planned relationships

| Entity | Intended data and relationships |
| --- | --- |
| `profiles` | UUID, unique Clerk subject, server-managed role, minimal display/contact data |
| `passenger_requests` | Profile, airport, flight/date, ready window, destination geography, party/luggage capacity, wait limit, women-only preference, status |
| `drivers` | Profile, independent verification status and availability; document metadata with restricted access |
| `vehicles` | Driver, approved seat and luggage capacity, availability |
| `ride_groups` | Airport, destination cluster, ready/departure windows, assigned vehicle/driver, status and version |
| `ride_members` | Group/request relation, party allocation, joined/left timestamps and membership state |
| `driver_offers` | Group and driver/vehicle, expiration, offer state and response timestamps |
| `trip_events` | Group, actor and minimal state transitions, event/creation timestamps |

One profile may own many requests; requests can have membership history but only one active group. One driver may have multiple vehicles, while each actual trip has one assigned approved vehicle. Capacity must sum party sizes and luggage units across active members. Constraints and transactions must prevent duplicate active membership, double assignment and oversubscription.

Destinations should use `geography(Point, 4326)` with a GiST index; store longitude then latitude when constructing points. Geographic `ST_DWithin` distances are metres. Keep the airport identity explicit and normalized; flight identity includes date and arrival airport, not just a repeated daily flight number. Use separate ready-window bounds and request expiry, with UTC timestamps (`timestamptz`). Establish indexes for active requests/airport/window based on actual queries.

Destination compatibility is a small bounded cluster. Do not form a long chain by accepting each next neighbour without checking group diameter and each member's deviation. Road detour validation comes through the routing adapter. Radius, wait limit, luggage units and minimum viable occupancy require product-approved policies; none are invented as deployed defaults here.

Women-only preference must be retained in requests and groups. Define voluntary eligibility and driver eligibility policy before implementing enforcement. Do not infer gender from a name, identity document or Clerk authentication.

Cancellation, delay and cancellation of flights require request/group states and timestamped history. Avoid destroying historical records needed to explain a re-match. Keep sensitive payloads out of events and logs.

## Migration and access workflow

Create sequential timestamped SQL migrations in `supabase/migrations`; agree names across workstreams. Review and test against a disposable PostgreSQL/PostGIS or Supabase development database before production. With a Supabase CLI installed and the correct project explicitly selected, link the project and use `supabase db push`; this affects that project and is not run by bootstrap CI. No Docker prerequisite is imposed.

Enable RLS and least privilege with each table. FastAPI may use a restricted database role; a Supabase service-role key bypasses RLS and must remain server-only. Realtime/browser access needs a tested Clerk-compatible authorization policy. Storage documents require private buckets, narrowly scoped signed access and deletion/retention rules. Store only confirmed flight metadata needed for matching, not unnecessary ticket contents. No passwords, real keys or passenger data belong in migrations.
