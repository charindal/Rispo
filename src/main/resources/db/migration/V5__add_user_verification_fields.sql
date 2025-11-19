-- V5__add_user_verification_fields.sql
-- Add national ID/passport, email, and verification fields

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(100) UNIQUE NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add columns to player table
ALTER TABLE player ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE player ADD COLUMN IF NOT EXISTS verified_by BIGINT REFERENCES users(id);
ALTER TABLE player ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE player ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE player ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
CREATE INDEX IF NOT EXISTS idx_player_verified ON player(is_verified);

-- Update trigger for player table
CREATE TRIGGER update_player_updated_at
BEFORE UPDATE ON player
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column to player table if it doesn't exist
ALTER TABLE player ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE player ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
