-- V21__Add_round_status_tracking.sql
-- Add fields to track round generation status for tournament management

ALTER TABLE knockout_tournament ADD COLUMN IF NOT EXISTS round_1_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE knockout_tournament ADD COLUMN IF NOT EXISTS round_1_started BOOLEAN DEFAULT FALSE;
ALTER TABLE knockout_tournament ADD COLUMN IF NOT EXISTS allow_round_1_regenerate BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_knockout_tournament_round1_status 
ON knockout_tournament(id, round_1_generated, round_1_started);
