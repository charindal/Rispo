-- V20__Update_tournament_creation_process.sql
-- This migration adds a stored procedure and trigger to handle player approvals when tournaments are created
-- Note: The actual auto-enrollment of players will be handled in the service layer

-- For now, this migration is a placeholder for tracking version updates
-- The application code will handle creating tournament_player_approval records with PENDING status
-- when a new knockout tournament is created
