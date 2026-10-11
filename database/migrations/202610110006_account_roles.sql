-- Preserve existing account roles; new accounts choose their portal explicitly.
ALTER TABLE profiles DROP CONSTRAINT profile_role;
ALTER TABLE profiles ADD CONSTRAINT profile_role
    CHECK (role IN ('UNASSIGNED', 'PASSENGER', 'DRIVER', 'ADMIN'));
