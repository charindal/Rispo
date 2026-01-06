-- Add tournament format column
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS format VARCHAR(20) NOT NULL DEFAULT 'SWISS';

-- Add check constraint to ensure only valid formats
ALTER TABLE tournament DROP CONSTRAINT IF EXISTS tournament_format_check;
ALTER TABLE tournament ADD CONSTRAINT tournament_format_check CHECK (format IN ('SWISS', 'KNOCKOUT'));
