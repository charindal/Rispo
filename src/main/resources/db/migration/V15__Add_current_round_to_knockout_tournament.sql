-- V15__Add_current_round_to_knockout_tournament.sql
-- Add missing current_round column to existing knockout_tournament table

ALTER TABLE knockout_tournament 
ADD COLUMN current_round INT DEFAULT 0;

-- Update existing tournaments to have current_round = 0 for UPCOMING, 1 for IN_PROGRESS
UPDATE knockout_tournament 
SET current_round = CASE 
    WHEN status = 'IN_PROGRESS' THEN 1
    ELSE 0
END;