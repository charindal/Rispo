-- Add total_rounds column for Swiss tournaments
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS total_rounds INTEGER;
