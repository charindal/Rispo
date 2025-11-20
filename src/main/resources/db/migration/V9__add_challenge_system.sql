-- Create challenge table
CREATE TABLE challenge (
    challenge_id BIGSERIAL PRIMARY KEY,
    challenger_id BIGINT NOT NULL,
    challenged_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT fk_challenge_challenger FOREIGN KEY (challenger_id) REFERENCES player(id),
    CONSTRAINT fk_challenge_challenged FOREIGN KEY (challenged_id) REFERENCES player(id),
    CONSTRAINT check_different_players CHECK (challenger_id != challenged_id)
);

-- Add challenge_id to match table
ALTER TABLE match 
    ADD COLUMN challenge_id BIGINT,
    ADD COLUMN admin_created BOOLEAN DEFAULT FALSE,
    ADD COLUMN acknowledgment_status VARCHAR(50) DEFAULT 'NOT_REQUIRED',
    ADD COLUMN result_recorded_by BIGINT,
    ADD COLUMN result_recorded_at TIMESTAMP,
    ADD COLUMN acknowledged_by BIGINT,
    ADD COLUMN acknowledged_at TIMESTAMP,
    ADD COLUMN acknowledgment_deadline TIMESTAMP,
    ADD CONSTRAINT fk_match_challenge FOREIGN KEY (challenge_id) REFERENCES challenge(challenge_id),
    ADD CONSTRAINT fk_match_result_recorded_by FOREIGN KEY (result_recorded_by) REFERENCES users(id),
    ADD CONSTRAINT fk_match_acknowledged_by FOREIGN KEY (acknowledged_by) REFERENCES users(id);

-- Create player flags table for tracking disputes
CREATE TABLE player_flag (
    flag_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    match_id BIGINT NOT NULL,
    flag_type VARCHAR(50) NOT NULL,
    description TEXT,
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    flagged_by BIGINT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by BIGINT,
    resolution_notes TEXT,
    CONSTRAINT fk_flag_player FOREIGN KEY (player_id) REFERENCES player(id),
    CONSTRAINT fk_flag_match FOREIGN KEY (match_id) REFERENCES match(id),
    CONSTRAINT fk_flag_flagged_by FOREIGN KEY (flagged_by) REFERENCES users(id),
    CONSTRAINT fk_flag_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Add flag counter to player table
ALTER TABLE player
    ADD COLUMN unresolved_flags_count INTEGER DEFAULT 0,
    ADD COLUMN total_flags_count INTEGER DEFAULT 0,
    ADD COLUMN is_tournament_eligible BOOLEAN DEFAULT TRUE;

-- Create indexes for performance
CREATE INDEX idx_challenge_challenger ON challenge(challenger_id);
CREATE INDEX idx_challenge_challenged ON challenge(challenged_id);
CREATE INDEX idx_challenge_status ON challenge(status);
CREATE INDEX idx_match_challenge ON match(challenge_id);
CREATE INDEX idx_match_acknowledgment_status ON match(acknowledgment_status);
CREATE INDEX idx_player_flag_player ON player_flag(player_id);
CREATE INDEX idx_player_flag_resolved ON player_flag(resolved);

-- Add comments
COMMENT ON TABLE challenge IS 'Player challenges for matches';
COMMENT ON COLUMN challenge.status IS 'Status: PENDING, ACCEPTED, REJECTED, EXPIRED';
COMMENT ON COLUMN match.acknowledgment_status IS 'Status: NOT_REQUIRED, PENDING_ACKNOWLEDGMENT, ACKNOWLEDGED, DISPUTED, ACKNOWLEDGED_BY_ADMIN';
COMMENT ON COLUMN match.admin_created IS 'TRUE if match was created by rating admin (no acknowledgment needed)';
COMMENT ON TABLE player_flag IS 'Flags for players who refuse to acknowledge match results';
COMMENT ON COLUMN player_flag.flag_type IS 'Type: NO_ACKNOWLEDGMENT, FALSE_RESULT, DISPUTE, OTHER';

