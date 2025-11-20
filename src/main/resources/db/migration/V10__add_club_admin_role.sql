-- Add CLUB_ADMIN to the users role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('PLAYER', 'RATING_ADMIN', 'SYSTEM_ADMIN', 'CLUB_ADMIN'));
