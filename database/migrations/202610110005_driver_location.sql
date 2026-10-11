-- Keep only the latest consented location. Existing ride_groups RLS and grants apply.
ALTER TABLE public.ride_groups
    ADD COLUMN driver_latitude double precision,
    ADD COLUMN driver_longitude double precision,
    ADD COLUMN driver_accuracy_metres double precision,
    ADD COLUMN driver_location_captured_at timestamptz,
    ADD COLUMN driver_location_updated_at timestamptz,
    ADD CONSTRAINT valid_driver_location CHECK (
        (driver_latitude IS NULL AND driver_longitude IS NULL
         AND driver_accuracy_metres IS NULL AND driver_location_captured_at IS NULL
         AND driver_location_updated_at IS NULL)
        OR (driver_latitude BETWEEN -90 AND 90 AND driver_longitude BETWEEN -180 AND 180
            AND driver_accuracy_metres BETWEEN 0 AND 10000
            AND driver_latitude IS NOT NULL AND driver_longitude IS NOT NULL
            AND driver_accuracy_metres IS NOT NULL AND driver_location_captured_at IS NOT NULL
            AND driver_location_updated_at IS NOT NULL)
    );
