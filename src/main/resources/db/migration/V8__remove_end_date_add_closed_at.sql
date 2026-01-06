-- Remove end_date column and add closed_at column to tournament table
-- Note: This migration handles legacy databases that may have end_date
ALTER TABLE tournament DROP COLUMN IF EXISTS end_date;
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
