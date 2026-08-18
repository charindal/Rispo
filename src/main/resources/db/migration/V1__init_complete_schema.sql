-- V1__init_complete_schema.sql
-- Complete database schema for Rispo Rating System (Streamlined)
-- Roles: SYSTEM_ADMIN, PLAYER only.
-- Features: player registration, match upload, ELO rating calculation.
-- Dropped: clubs, tournaments, challenges, admin tokens, player flags.

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id                   BIGSERIAL PRIMARY KEY,
    username             VARCHAR(255) UNIQUE NOT NULL,
    password             VARCHAR(255) NOT NULL,
    email                VARCHAR(255) UNIQUE NOT NULL,
    national_id          VARCHAR(100) UNIQUE NOT NULL,
    role                 VARCHAR(50)  NOT NULL,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('SYSTEM_ADMIN', 'PLAYER'))
);

CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_role        ON users(role);

-- ============================================
-- 2. PLAYER TABLE
-- ============================================
CREATE TABLE player (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255),
    phone          VARCHAR(50),
    rating         INTEGER      NOT NULL DEFAULT 1200,
    matches_played INTEGER      NOT NULL DEFAULT 0,
    games_played   INTEGER      NOT NULL DEFAULT 0,
    wins           INTEGER      NOT NULL DEFAULT 0,
    losses         INTEGER      NOT NULL DEFAULT 0,
    draws          INTEGER      NOT NULL DEFAULT 0,
    is_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    verified_by    BIGINT,
    verified_at    TIMESTAMP,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_player_verified_by FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_player_user_id ON player(user_id);
CREATE INDEX        idx_player_rating   ON player(rating DESC);
CREATE INDEX        idx_player_verified ON player(is_verified);
CREATE INDEX        idx_player_name     ON player(name);

-- ============================================
-- 3. MATCH TABLE
-- ============================================
CREATE TABLE match (
    id                    BIGSERIAL PRIMARY KEY,
    round                 INTEGER     NOT NULL DEFAULT 1,
    player1_id            BIGINT      NOT NULL,
    player2_id            BIGINT      NOT NULL,
    winner_id             BIGINT,
    status                VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
    submitted_by          BIGINT,
    submitted_at          TIMESTAMP,
    reviewed_by           BIGINT,
    reviewed_at           TIMESTAMP,
    review_notes          TEXT,
    is_rated              BOOLEAN     NOT NULL DEFAULT FALSE,
    player1_rating_before INTEGER,
    player2_rating_before INTEGER,
    player1_rating_after  INTEGER,
    player2_rating_after  INTEGER,
    player1_rating_change INTEGER,
    player2_rating_change INTEGER,
    created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_player1      FOREIGN KEY (player1_id)   REFERENCES player(id),
    CONSTRAINT fk_match_player2      FOREIGN KEY (player2_id)   REFERENCES player(id),
    CONSTRAINT fk_match_winner       FOREIGN KEY (winner_id)    REFERENCES player(id),
    CONSTRAINT fk_match_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_match_reviewed_by  FOREIGN KEY (reviewed_by)  REFERENCES users(id),
    CONSTRAINT chk_match_status      CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_match_status       ON match(status);
CREATE INDEX idx_match_player1      ON match(player1_id);
CREATE INDEX idx_match_player2      ON match(player2_id);
CREATE INDEX idx_match_is_rated     ON match(is_rated);
CREATE INDEX idx_match_submitted_by ON match(submitted_by);

-- ============================================
-- 4. GAME TABLE
-- ============================================
CREATE TABLE game (
    id            BIGSERIAL PRIMARY KEY,
    match_id      BIGINT      NOT NULL,
    player1_id    BIGINT      NOT NULL,
    player2_id    BIGINT      NOT NULL,
    result        VARCHAR(50) NOT NULL,
    result_type   VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    player1_score INTEGER     NOT NULL DEFAULT 0,
    player2_score INTEGER     NOT NULL DEFAULT 0,
    winner_id     BIGINT,
    game_number   INTEGER,
    date_played   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_match   FOREIGN KEY (match_id)   REFERENCES match(id)  ON DELETE CASCADE,
    CONSTRAINT fk_game_player1 FOREIGN KEY (player1_id) REFERENCES player(id),
    CONSTRAINT fk_game_player2 FOREIGN KEY (player2_id) REFERENCES player(id),
    CONSTRAINT fk_game_winner  FOREIGN KEY (winner_id)  REFERENCES player(id),
    CONSTRAINT chk_game_result CHECK (result IN ('PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW')),
    CONSTRAINT chk_game_result_winner CHECK (
        (result = 'DRAW'  AND winner_id IS NULL)
     OR (result <> 'DRAW' AND winner_id IS NOT NULL)
    )
);

CREATE INDEX idx_game_match_id    ON game(match_id);
CREATE INDEX idx_game_result_type ON game(result_type);

-- ============================================
-- 5. RATING SETTINGS TABLE
-- ============================================
CREATE TABLE rating_settings (
    id                      BIGSERIAL PRIMARY KEY,
    provisional_games_count INTEGER   NOT NULL DEFAULT 100,
    provisional_k_factor    INTEGER   NOT NULL DEFAULT 40,
    established_k_factor    INTEGER   NOT NULL DEFAULT 20,
    min_rating              INTEGER   NOT NULL DEFAULT 400,
    max_rating              INTEGER   NOT NULL DEFAULT 3000,
    default_rating          INTEGER   NOT NULL DEFAULT 1200,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by              BIGINT,
    CONSTRAINT fk_rating_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Seed default settings
INSERT INTO rating_settings (provisional_games_count, provisional_k_factor, established_k_factor, min_rating, max_rating, default_rating)
VALUES (100, 40, 20, 400, 3000, 1200);

-- ============================================
-- 6. AUTO-UPDATE updated_at TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_player_updated_at
    BEFORE UPDATE ON player
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- END OF SCHEMA
-- Note: The system admin account (admin/admin) is created automatically
-- by DatabaseInitService on first application startup.
-- ============================================
