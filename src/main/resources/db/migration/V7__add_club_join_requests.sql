-- Create club join requests table
CREATE TABLE club_join_request (
    request_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    club_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    message TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    CONSTRAINT fk_join_request_player FOREIGN KEY (player_id) REFERENCES player(id),
    CONSTRAINT fk_join_request_club FOREIGN KEY (club_id) REFERENCES club(club_id),
    CONSTRAINT fk_join_request_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id),
    CONSTRAINT unique_pending_request UNIQUE (player_id, club_id, status)
);

-- Create index for better query performance
CREATE INDEX idx_join_request_club_id ON club_join_request(club_id);
CREATE INDEX idx_join_request_player_id ON club_join_request(player_id);
CREATE INDEX idx_join_request_status ON club_join_request(status);

-- Add comments
COMMENT ON TABLE club_join_request IS 'Players requests to join clubs';
COMMENT ON COLUMN club_join_request.status IS 'Status: PENDING, APPROVED, REJECTED';
