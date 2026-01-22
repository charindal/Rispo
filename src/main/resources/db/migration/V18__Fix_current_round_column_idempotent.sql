-- V18__Fix_current_round_column_idempotent.sql
-- Idempotent fix: handle the current_round column safely
-- This migration is safe to run even if column already exists

DO $$ 
BEGIN 
    -- Only add current_round column if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knockout_tournament' 
        AND column_name = 'current_round'
    ) THEN 
        ALTER TABLE knockout_tournament 
        ADD COLUMN current_round INT DEFAULT 0;
        
        -- Update existing tournaments to have current_round based on status
        UPDATE knockout_tournament 
        SET current_round = CASE 
            WHEN status = 'IN_PROGRESS' THEN 1
            ELSE 0
        END;
    END IF;
END $$;
