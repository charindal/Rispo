-- V1__init_schema.sql

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('PLAYER', 'RATING_ADMIN', 'SYSTEM_ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Player Table
CREATE TABLE IF NOT EXISTS player (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rating BIGINT DEFAULT 1200,
    matches_played BIGINT DEFAULT 0,
    wins BIGINT DEFAULT 0,
    losses BIGINT DEFAULT 0,
    draws BIGINT DEFAULT 0
);

-- 3. Match Result Enum (NO IF NOT EXISTS!)
CREATE TYPE match_result AS ENUM ('PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW');

-- 4. Match Table
CREATE TABLE IF NOT EXISTS match (
    id BIGSERIAL PRIMARY KEY,
    player1_id BIGINT NOT NULL REFERENCES player(id),
    player2_id BIGINT NOT NULL REFERENCES player(id),
    winner_id BIGINT REFERENCES player(id),
    result match_result NOT NULL DEFAULT 'PLAYER1_WIN',
    date_played TIMESTAMP NOT NULL,
    player1_rating_change BIGINT,
    player2_rating_change BIGINT,
    CONSTRAINT chk_match_result_winner CHECK (
        (result = 'DRAW' AND winner_id IS NULL)
        OR (result <> 'DRAW' AND winner_id IS NOT NULL)
    )
);

-- 5. Tournament Table
CREATE TABLE IF NOT EXISTS tournament (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE
);

-- 6. TournamentPlayer Join Table
CREATE TABLE IF NOT EXISTS tournament_player (
    tournament_id BIGINT REFERENCES tournament(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES player(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, player_id)
);

-- 7. Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$func$;

-- 8. Trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
