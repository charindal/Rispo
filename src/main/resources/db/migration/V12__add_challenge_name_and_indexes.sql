-- Add challenge_name column to challenge table
ALTER TABLE challenge ADD COLUMN IF NOT EXISTS challenge_name VARCHAR(255);

-- Create indexes for fast club-based player search
CREATE INDEX IF NOT EXISTS idx_player_club_id ON player(club_id);
CREATE INDEX IF NOT EXISTS idx_player_club_verified ON player(club_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_player_name ON player(name);

-- Add comment
COMMENT ON COLUMN challenge.challenge_name IS 'Friendly name for the challenge (e.g., "Friday Night Match")';
