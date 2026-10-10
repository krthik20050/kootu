-- Persistent ride domain. Apply with the migration owner; API uses a separate server-only role.

SET search_path = public, extensions;


CREATE TABLE profiles (
	id VARCHAR(36) NOT NULL, 
	clerk_subject VARCHAR(255) NOT NULL, 
	role VARCHAR(20) NOT NULL, 
	display_name VARCHAR(80) NOT NULL, 
	women_only_eligible BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (clerk_subject)
)

;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


CREATE TABLE drivers (
	id VARCHAR(36) NOT NULL, 
	profile_id VARCHAR(36) NOT NULL, 
	licence_reference VARCHAR(120) NOT NULL, 
	verification_status VARCHAR(20) NOT NULL, 
	available BOOLEAN NOT NULL, 
	women_only_eligible BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (profile_id), 
	FOREIGN KEY(profile_id) REFERENCES profiles (id)
)

;

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;


CREATE TABLE passenger_requests (
	id VARCHAR(36) NOT NULL, 
	profile_id VARCHAR(36) NOT NULL, 
	airport VARCHAR(3) NOT NULL, 
	flight_number VARCHAR(10) NOT NULL, 
	flight_date DATE NOT NULL, 
	ready_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	baseline_ready_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	max_wait_minutes INTEGER NOT NULL, 
	destination_name VARCHAR(160) NOT NULL, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	passengers INTEGER NOT NULL, 
	luggage INTEGER NOT NULL, 
	women_only BOOLEAN NOT NULL, 
	wheelchair_spaces INTEGER NOT NULL, 
	child_seats INTEGER NOT NULL, 
	pet_friendly BOOLEAN NOT NULL, 
	notes TEXT NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	flight_status VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	version INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(profile_id) REFERENCES profiles (id)
)

;

CREATE INDEX ix_passenger_requests_status ON passenger_requests (status);

CREATE INDEX ix_passenger_requests_airport ON passenger_requests (airport);

CREATE INDEX ix_passenger_requests_profile_id ON passenger_requests (profile_id);

ALTER TABLE passenger_requests ENABLE ROW LEVEL SECURITY;


CREATE TABLE vehicles (
	id VARCHAR(36) NOT NULL, 
	driver_id VARCHAR(36) NOT NULL, 
	registration VARCHAR(24) NOT NULL, 
	seats INTEGER NOT NULL, 
	luggage_capacity INTEGER NOT NULL, 
	wheelchair_spaces INTEGER NOT NULL, 
	child_seats INTEGER NOT NULL, 
	pet_friendly BOOLEAN NOT NULL, 
	approved BOOLEAN NOT NULL, 
	available BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(driver_id) REFERENCES drivers (id), 
	UNIQUE (registration)
)

;

CREATE INDEX ix_vehicles_driver_id ON vehicles (driver_id);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;


CREATE TABLE ride_groups (
	id VARCHAR(36) NOT NULL, 
	airport VARCHAR(3) NOT NULL, 
	departure_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	driver_id VARCHAR(36), 
	vehicle_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(driver_id) REFERENCES drivers (id), 
	FOREIGN KEY(vehicle_id) REFERENCES vehicles (id)
)

;

ALTER TABLE ride_groups ENABLE ROW LEVEL SECURITY;


CREATE TABLE driver_offers (
	id VARCHAR(36) NOT NULL, 
	group_id VARCHAR(36) NOT NULL, 
	driver_id VARCHAR(36) NOT NULL, 
	vehicle_id VARCHAR(36) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(group_id) REFERENCES ride_groups (id), 
	FOREIGN KEY(driver_id) REFERENCES drivers (id), 
	FOREIGN KEY(vehicle_id) REFERENCES vehicles (id)
)

;

CREATE INDEX ix_driver_offers_group_id ON driver_offers (group_id);

CREATE INDEX ix_driver_offers_driver_id ON driver_offers (driver_id);

ALTER TABLE driver_offers ENABLE ROW LEVEL SECURITY;


CREATE TABLE ride_members (
	request_id VARCHAR(36) NOT NULL, 
	group_id VARCHAR(36) NOT NULL, 
	PRIMARY KEY (request_id), 
	FOREIGN KEY(request_id) REFERENCES passenger_requests (id), 
	FOREIGN KEY(group_id) REFERENCES ride_groups (id)
)

;

CREATE INDEX ix_ride_members_group_id ON ride_members (group_id);

ALTER TABLE ride_members ENABLE ROW LEVEL SECURITY;


CREATE TABLE trip_events (
	id VARCHAR(36) NOT NULL, 
	group_id VARCHAR(36) NOT NULL, 
	kind VARCHAR(40) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	payload JSON NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(group_id) REFERENCES ride_groups (id)
)

;

CREATE INDEX ix_trip_events_group_id ON trip_events (group_id);

ALTER TABLE trip_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE profiles ADD CONSTRAINT profile_role CHECK (role IN ('PASSENGER','DRIVER','ADMIN'));

ALTER TABLE passenger_requests ADD CONSTRAINT request_capacity CHECK (passengers BETWEEN 1 AND 8 AND luggage BETWEEN 0 AND 12 AND wheelchair_spaces BETWEEN 0 AND passengers AND child_seats BETWEEN 0 AND passengers AND max_wait_minutes BETWEEN 5 AND 120);

ALTER TABLE passenger_requests ADD CONSTRAINT request_coordinates CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180);

ALTER TABLE passenger_requests ADD COLUMN destination_geo geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude,latitude),4326)::geography) STORED;

CREATE INDEX ix_requests_destination_geo ON passenger_requests USING gist(destination_geo);

CREATE UNIQUE INDEX one_active_trip_per_driver ON ride_groups(driver_id) WHERE status IN ('ASSIGNED','IN_PROGRESS');

CREATE UNIQUE INDEX one_active_trip_per_vehicle ON ride_groups(vehicle_id) WHERE status IN ('ASSIGNED','IN_PROGRESS');

ALTER TABLE vehicles ADD CONSTRAINT vehicle_capacity CHECK (seats BETWEEN 1 AND 8 AND luggage_capacity BETWEEN 0 AND 12 AND wheelchair_spaces BETWEEN 0 AND 2 AND child_seats BETWEEN 0 AND 4);

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- No browser-facing RLS policies: access is exclusively through authenticated API ownership checks.
