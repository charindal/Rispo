-- V2__add_tournament_columns.sql
-- Add missing columns to tournament and tournament_player tables

-- Add new columns to tournament table
ALTER TABLE tournament 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS created_by BIGINT,
ADD COLUMN IF NOT EXISTS club_id BIGINT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS venue VARCHAR(255),
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tournament_created_by') THEN
        ALTER TABLE tournament ADD CONSTRAINT fk_tournament_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tournament_club') THEN
        ALTER TABLE tournament ADD CONSTRAINT fk_tournament_club FOREIGN KEY (club_id) REFERENCES club(club_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tournament_status') THEN
        ALTER TABLE tournament ADD CONSTRAINT chk_tournament_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'));
    END IF;
END $$;

-- Add indexes for tournament
CREATE INDEX IF NOT EXISTS idx_tournament_status ON tournament(status);
CREATE INDEX IF NOT EXISTS idx_tournament_created_by ON tournament(created_by);
CREATE INDEX IF NOT EXISTS idx_tournament_club ON tournament(club_id);

-- Add new columns to tournament_player table
ALTER TABLE tournament_player
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS responded_by BIGINT;

-- Add foreign key and constraint for tournament_player
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tournament_player_responded_by') THEN
        ALTER TABLE tournament_player ADD CONSTRAINT fk_tournament_player_responded_by FOREIGN KEY (responded_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tournament_player_status') THEN
        ALTER TABLE tournament_player ADD CONSTRAINT chk_tournament_player_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

-- Add index for tournament_player status
CREATE INDEX IF NOT EXISTS idx_tournament_player_status ON tournament_player(status);

-- Add comments
COMMENT ON TABLE tournament IS 'Tournaments organized by administrators';
COMMENT ON COLUMN tournament.status IS 'Status: DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED';
COMMENT ON TABLE tournament_player IS 'Tournament join requests and approved participants';
COMMENT ON COLUMN tournament_player.status IS 'Status: PENDING, APPROVED, REJECTED';
