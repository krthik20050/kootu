-- Additive rollout: apply before starting the matching-hardening backend.
-- CHECK validation deliberately fails on invalid historical data; never silently repair it.
ALTER TABLE passenger_requests
    ADD COLUMN match_attempted_at TIMESTAMPTZ,
    ADD COLUMN flight_attempted_at TIMESTAMPTZ,
    ADD CONSTRAINT request_status_valid CHECK (
        status IN ('WAITING','MATCHED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED','FLIGHT_CANCELLED')
    ),
    ADD CONSTRAINT request_version_positive CHECK (version > 0);

ALTER TABLE ride_groups
    ADD CONSTRAINT group_status_valid CHECK (
        status IN ('PROPOSED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')
    ),
    ADD CONSTRAINT group_assignment_pair CHECK ((driver_id IS NULL) = (vehicle_id IS NULL)),
    ADD CONSTRAINT group_assignment_required CHECK (
        status NOT IN ('ASSIGNED','IN_PROGRESS','COMPLETED')
        OR (driver_id IS NOT NULL AND vehicle_id IS NOT NULL)
    );

ALTER TABLE drivers
    ADD CONSTRAINT driver_verification_valid CHECK (
        verification_status IN ('PENDING','APPROVED','REJECTED')
    ),
    ADD CONSTRAINT available_driver_approved CHECK (NOT available OR verification_status='APPROVED');

ALTER TABLE vehicles
    ADD CONSTRAINT available_vehicle_approved CHECK (NOT available OR approved),
    ADD CONSTRAINT vehicle_owner_pair UNIQUE (id, driver_id);

-- Individual FKs alone allow an offer/assignment to reference someone else's vehicle.
ALTER TABLE ride_groups ADD CONSTRAINT group_vehicle_owner
    FOREIGN KEY (vehicle_id, driver_id) REFERENCES vehicles (id, driver_id);
ALTER TABLE driver_offers
    ADD CONSTRAINT offer_status_valid CHECK (
        status IN ('PENDING','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN')
    ),
    ADD CONSTRAINT offer_vehicle_owner
        FOREIGN KEY (vehicle_id, driver_id) REFERENCES vehicles (id, driver_id);

CREATE INDEX ix_waiting_airport_policy_created
    ON passenger_requests (airport, women_only, created_at, id) WHERE status='WAITING';
CREATE INDEX ix_waiting_match_attempt
    ON passenger_requests (match_attempted_at NULLS FIRST, created_at, id) WHERE status='WAITING';
CREATE INDEX ix_active_flight_attempt
    ON passenger_requests (flight_attempted_at NULLS FIRST, created_at, id)
    WHERE status IN ('WAITING','MATCHED','ASSIGNED');
CREATE INDEX ix_proposed_group_created
    ON ride_groups (created_at, id) WHERE status='PROPOSED';
