-- V19__Add_tournament_player_approval.sql
-- Create table to track player approval status for knockout tournaments

CREATE TABLE tournament_player_approval (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,
    club_id BIGINT NOT NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    approved_by BIGINT,
    approved_date TIMESTAMP,
    rejection_reason TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES knockout_tournament(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES player(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(tournament_id, player_id)
);

-- Create indexes
CREATE INDEX idx_tournament_player_approval_tournament ON tournament_player_approval (tournament_id);
CREATE INDEX idx_tournament_player_approval_player ON tournament_player_approval (player_id);
CREATE INDEX idx_tournament_player_approval_status ON tournament_player_approval (tournament_id, approval_status);
