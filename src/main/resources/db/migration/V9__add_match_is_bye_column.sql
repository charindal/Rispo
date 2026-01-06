-- Add is_bye column to match table for bye tracking in Swiss tournaments
ALTER TABLE match ADD COLUMN IF NOT EXISTS is_bye BOOLEAN DEFAULT FALSE NOT NULL;
