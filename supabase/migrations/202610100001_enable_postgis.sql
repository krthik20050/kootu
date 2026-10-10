-- Geospatial foundation only. No speculative application tables.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

-- Existing PostGIS installations are left in their current schema.
-- Check pg_extension.extnamespace before schema-qualified queries in later migrations.
