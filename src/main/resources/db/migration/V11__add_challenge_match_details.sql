-- Add new fields to challenge table for match details
ALTER TABLE challenge
ADD COLUMN format VARCHAR(100),
ADD COLUMN date_of_match TIMESTAMP,
ADD COLUMN time_of_match VARCHAR(20),
ADD COLUMN pot DECIMAL(10, 2),
ADD COLUMN venue VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN challenge.format IS 'Type of game format, e.g., Race to 7, Race to 9, Best of 5';
COMMENT ON COLUMN challenge.date_of_match IS 'Scheduled date and time for the match';
COMMENT ON COLUMN challenge.time_of_match IS 'Display time for the match, e.g., 14:00 or 7:00 PM';
COMMENT ON COLUMN challenge.pot IS 'Total prize money/amount to be won';
COMMENT ON COLUMN challenge.venue IS 'Physical location where the match will take place';
