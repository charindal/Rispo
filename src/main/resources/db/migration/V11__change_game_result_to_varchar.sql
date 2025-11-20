-- Change game.result from ENUM type to VARCHAR to match JPA @Enumerated(EnumType.STRING)
-- First, drop the constraint that depends on the enum
ALTER TABLE game DROP CONSTRAINT IF EXISTS chk_game_result_winner;

-- Change the column type to VARCHAR
ALTER TABLE game ALTER COLUMN result TYPE VARCHAR(50) USING result::text;

-- Remove the default value since it references the old enum
ALTER TABLE game ALTER COLUMN result DROP DEFAULT;

-- Drop the enum type (only if no other tables use it)
DROP TYPE IF EXISTS game_result;

-- Recreate the check constraint with the new VARCHAR type
ALTER TABLE game ADD CONSTRAINT chk_game_result_winner CHECK (
    (result = 'DRAW' AND winner_id IS NULL)
    OR (result <> 'DRAW' AND winner_id IS NOT NULL)
);
