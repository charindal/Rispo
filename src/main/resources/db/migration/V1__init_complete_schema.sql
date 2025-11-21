-- V1__init_complete_schema.sql
-- Complete database schema for Rispo Rating System
-- Consolidated from all previous migrations

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    national_id VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE NOT NULL,
    club_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('SUPER_USER', 'SYSTEM_ADMIN', 'RATING_ADMIN', 'CLUB_ADMIN', 'PLAYER'))
);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_club_id ON users(club_id);

-- ============================================
-- 2. CLUB TABLE
-- ============================================
CREATE TABLE club (
    club_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(500),
    city VARCHAR(100),
    suburb VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_by BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_club_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Club indexes
CREATE INDEX idx_club_status ON club(status);

COMMENT ON TABLE club IS 'Clubs/Hosts - venues, bars, recreational centers, entertainment centers';
COMMENT ON COLUMN club.status IS 'Status: ACTIVE, INACTIVE, SUSPENDED';

-- ============================================
-- 3. ADD CLUB FOREIGN KEY TO USERS
-- ============================================
ALTER TABLE users ADD CONSTRAINT fk_users_club FOREIGN KEY (club_id) REFERENCES club(club_id);

-- ============================================
-- 4. PLAYER TABLE
-- ============================================
CREATE TABLE player (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    club_id BIGINT,
    rating INTEGER DEFAULT 1200,
    matches_played INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    unresolved_flags_count INTEGER DEFAULT 0,
    total_flags_count INTEGER DEFAULT 0,
    is_tournament_eligible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_player_club FOREIGN KEY (club_id) REFERENCES club(club_id),
    CONSTRAINT fk_player_verified_by FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Player indexes
CREATE INDEX idx_player_club_id ON player(club_id);
CREATE INDEX idx_player_club_verified ON player(club_id, is_verified);
CREATE INDEX idx_player_name ON player(name);
CREATE INDEX idx_player_verified ON player(is_verified);

-- ============================================
-- 5. ADMIN TOKENS TABLE
-- ============================================
CREATE TABLE admin_token (
    token_id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    club_id BIGINT,
    role VARCHAR(50) NOT NULL,
    generated_by BIGINT NOT NULL,
    used_by BIGINT,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    CONSTRAINT fk_admin_token_club FOREIGN KEY (club_id) REFERENCES club(club_id),
    CONSTRAINT fk_admin_token_generated_by FOREIGN KEY (generated_by) REFERENCES users(id),
    CONSTRAINT fk_admin_token_used_by FOREIGN KEY (used_by) REFERENCES users(id)
);

-- Admin token indexes
CREATE INDEX idx_admin_token_token ON admin_token(token);
CREATE INDEX idx_admin_token_generated_by ON admin_token(generated_by);

COMMENT ON TABLE admin_token IS 'Tokens for admin registration. SUPER_USER creates SYSTEM_ADMIN tokens (no club), SYSTEM_ADMIN creates CLUB_ADMIN/RATING_ADMIN tokens (with club)';
COMMENT ON COLUMN admin_token.role IS 'Role to be assigned: SYSTEM_ADMIN, CLUB_ADMIN, or RATING_ADMIN';

-- ============================================
-- 6. CLUB JOIN REQUESTS TABLE
-- ============================================
CREATE TABLE club_join_request (
    request_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    club_id BIGINT NOT NULL,
    previous_club_id BIGINT,
    is_club_change BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'PENDING',
    message TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    CONSTRAINT fk_join_request_player FOREIGN KEY (player_id) REFERENCES player(id),
    CONSTRAINT fk_join_request_club FOREIGN KEY (club_id) REFERENCES club(club_id),
    CONSTRAINT fk_join_request_previous_club FOREIGN KEY (previous_club_id) REFERENCES club(club_id),
    CONSTRAINT fk_join_request_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id),
    CONSTRAINT unique_pending_request UNIQUE (player_id, club_id, status)
);

-- Club join request indexes
CREATE INDEX idx_join_request_club_id ON club_join_request(club_id);
CREATE INDEX idx_join_request_player_id ON club_join_request(player_id);
CREATE INDEX idx_join_request_status ON club_join_request(status);
CREATE INDEX idx_join_request_previous_club ON club_join_request(previous_club_id);

COMMENT ON TABLE club_join_request IS 'Players requests to join or change clubs';
COMMENT ON COLUMN club_join_request.status IS 'Status: PENDING, APPROVED, REJECTED';

-- ============================================
-- 7. TOURNAMENT TABLE
-- ============================================
CREATE TABLE tournament (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE
);

-- ============================================
-- 8. TOURNAMENT PLAYER JOIN TABLE
-- ============================================
CREATE TABLE tournament_player (
    tournament_id BIGINT REFERENCES tournament(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES player(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, player_id)
);

-- ============================================
-- 9. CHALLENGE TABLE
-- ============================================
CREATE TABLE challenge (
    challenge_id BIGSERIAL PRIMARY KEY,
    challenge_name VARCHAR(255),
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

-- Challenge indexes
CREATE INDEX idx_challenge_challenger ON challenge(challenger_id);
CREATE INDEX idx_challenge_challenged ON challenge(challenged_id);
CREATE INDEX idx_challenge_status ON challenge(status);

COMMENT ON TABLE challenge IS 'Player challenges for matches';
COMMENT ON COLUMN challenge.status IS 'Status: PENDING, ACCEPTED, REJECTED, EXPIRED';
COMMENT ON COLUMN challenge.challenge_name IS 'Friendly name for the challenge (e.g., "Friday Night Match")';

-- ============================================
-- 10. MATCH TABLE
-- ============================================
CREATE TABLE match (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT,
    challenge_id BIGINT,
    round INTEGER NOT NULL DEFAULT 1,
    player1_id BIGINT NOT NULL,
    player2_id BIGINT NOT NULL,
    winner_id BIGINT,
    status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
    admin_created BOOLEAN DEFAULT FALSE,
    submitted_by BIGINT,
    submitted_at TIMESTAMP,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    is_rated BOOLEAN DEFAULT FALSE,
    player1_rating_before INTEGER,
    player2_rating_before INTEGER,
    player1_rating_after INTEGER,
    player2_rating_after INTEGER,
    player1_rating_change INTEGER,
    player2_rating_change INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_tournament FOREIGN KEY (tournament_id) REFERENCES tournament(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_challenge FOREIGN KEY (challenge_id) REFERENCES challenge(challenge_id),
    CONSTRAINT fk_match_player1 FOREIGN KEY (player1_id) REFERENCES player(id),
    CONSTRAINT fk_match_player2 FOREIGN KEY (player2_id) REFERENCES player(id),
    CONSTRAINT fk_match_winner FOREIGN KEY (winner_id) REFERENCES player(id),
    CONSTRAINT fk_match_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_match_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Match indexes
CREATE INDEX idx_match_status ON match(status);
CREATE INDEX idx_match_submitted_by ON match(submitted_by);
CREATE INDEX idx_match_reviewed_by ON match(reviewed_by);
CREATE INDEX idx_match_is_rated ON match(is_rated);
CREATE INDEX idx_match_challenge ON match(challenge_id);

COMMENT ON COLUMN match.status IS 'Status: PENDING_REVIEW, APPROVED, REJECTED';
COMMENT ON COLUMN match.is_rated IS 'Whether ratings have been calculated and applied';
COMMENT ON COLUMN match.admin_created IS 'TRUE if match was created by rating admin (no acknowledgment needed)';

-- ============================================
-- 11. GAME TABLE
-- ============================================
CREATE TABLE game (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT,
    tournament_id BIGINT,
    player1_id BIGINT NOT NULL,
    player2_id BIGINT NOT NULL,
    result VARCHAR(50) NOT NULL,
    result_type VARCHAR(50) DEFAULT 'COMPLETED',
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id BIGINT,
    game_number INTEGER,
    date_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_match FOREIGN KEY (match_id) REFERENCES match(id) ON DELETE CASCADE,
    CONSTRAINT fk_game_tournament FOREIGN KEY (tournament_id) REFERENCES tournament(id) ON DELETE CASCADE,
    CONSTRAINT fk_game_player1 FOREIGN KEY (player1_id) REFERENCES player(id),
    CONSTRAINT fk_game_player2 FOREIGN KEY (player2_id) REFERENCES player(id),
    CONSTRAINT fk_game_winner FOREIGN KEY (winner_id) REFERENCES player(id),
    CONSTRAINT chk_game_result_winner CHECK (
        (result = 'DRAW' AND winner_id IS NULL)
        OR (result <> 'DRAW' AND winner_id IS NOT NULL)
    )
);

-- Game indexes
CREATE INDEX idx_game_result_type ON game(result_type);

COMMENT ON COLUMN game.result_type IS 'Result type: COMPLETED, NO_RESULT, ABANDONED, CANCELLED';

-- ============================================
-- 12. PLAYER FLAG TABLE
-- ============================================
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

-- Player flag indexes
CREATE INDEX idx_player_flag_player ON player_flag(player_id);
CREATE INDEX idx_player_flag_resolved ON player_flag(resolved);

COMMENT ON TABLE player_flag IS 'Flags for players who refuse to acknowledge match results or other issues';
COMMENT ON COLUMN player_flag.flag_type IS 'Type: NO_ACKNOWLEDGMENT, FALSE_RESULT, DISPUTE, OTHER';

-- ============================================
-- 13. RATING SETTINGS TABLE
-- ============================================
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

COMMENT ON TABLE rating_settings IS 'System-wide rating calculation settings';

-- ============================================
-- 14. TRIGGER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$func$;

-- Apply triggers
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_updated_at
BEFORE UPDATE ON player
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_updated_at
BEFORE UPDATE ON club
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- END OF SCHEMA
-- ============================================
-- Note: SuperUser (admin/admin) will be created automatically
-- by DatabaseInitService on first application startup
