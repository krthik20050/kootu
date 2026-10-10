-- One booking account represents one travelling party for an airport arrival day.
-- Existing duplicate active bookings fail validation and require operator review.
CREATE UNIQUE INDEX one_active_arrival_booking
    ON passenger_requests (profile_id, airport, flight_date)
    WHERE status IN ('WAITING','MATCHED','ASSIGNED','IN_PROGRESS');

CREATE INDEX ix_pending_offer_expiry ON driver_offers (expires_at, group_id)
    WHERE status='PENDING';
CREATE INDEX ix_assigned_groups_departure ON ride_groups (departure_at, id)
    WHERE status='ASSIGNED';
