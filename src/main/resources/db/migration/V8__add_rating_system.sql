-- Create rating settings table
CREATE TABLE rating_settings (
    id BIGSERIAL PRIMARY KEY,
    provisional_games_count INTEGER DEFAULT 100,
    provisional_k_factor INTEGER DEFAULT 40,
    established_k_factor INTEGER DEFAULT 20,
    min_rating INTEGER DEFAULT 400,
    max_rating INTEGER DEFAULT 3000,
    default_rating INTEGER DEFAULT 1200,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    CONSTRAINT fk_rating_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default rating settings
INSERT INTO rating_settings (provisional_games_count, provisional_k_factor, established_k_factor, min_rating, max_rating, default_rating)
VALUES (100, 40, 20, 400, 3000, 1200);

-- Update match table to support individual matches (non-tournament)
ALTER TABLE match 
    ALTER COLUMN tournament_id DROP NOT NULL,
    ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING',
    ADD COLUMN submitted_by BIGINT,
    ADD COLUMN submitted_at TIMESTAMP,
    ADD COLUMN reviewed_by BIGINT,
    ADD COLUMN reviewed_at TIMESTAMP,
    ADD COLUMN review_notes TEXT,
    ADD COLUMN is_rated BOOLEAN DEFAULT FALSE,
    ADD COLUMN player1_rating_before INTEGER,
    ADD COLUMN player2_rating_before INTEGER,
    ADD COLUMN player1_rating_after INTEGER,
    ADD COLUMN player2_rating_after INTEGER,
    ADD COLUMN player1_rating_change INTEGER,
    ADD COLUMN player2_rating_change INTEGER;

-- Add foreign keys for match submission workflow
ALTER TABLE match
    ADD CONSTRAINT fk_match_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id),
    ADD CONSTRAINT fk_match_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- Update game table to support result types
ALTER TABLE game
    ADD COLUMN result_type VARCHAR(50) DEFAULT 'COMPLETED';

-- Create indexes for performance
CREATE INDEX idx_match_status ON match(status);
CREATE INDEX idx_match_submitted_by ON match(submitted_by);
CREATE INDEX idx_match_reviewed_by ON match(reviewed_by);
CREATE INDEX idx_match_is_rated ON match(is_rated);
CREATE INDEX idx_game_result_type ON game(result_type);

-- Add comments
COMMENT ON TABLE rating_settings IS 'System-wide rating calculation settings';
COMMENT ON COLUMN match.status IS 'Status: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN match.is_rated IS 'Whether ratings have been calculated and applied';
COMMENT ON COLUMN game.result_type IS 'Result type: COMPLETED, NO_RESULT, ABANDONED, CANCELLED';

