-- Add min_participants and everyone_plays_everyone columns for tournament
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS min_participants INTEGER;
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS everyone_plays_everyone BOOLEAN DEFAULT false;
