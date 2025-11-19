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
    games_played BIGINT DEFAULT 0,
    wins BIGINT DEFAULT 0,
    losses BIGINT DEFAULT 0,
    draws BIGINT DEFAULT 0
);

-- 3. Game Result Enum
CREATE TYPE game_result AS ENUM ('PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW');

-- 4. Tournament Table
CREATE TABLE IF NOT EXISTS tournament (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE
);

-- 5. TournamentPlayer Join Table
CREATE TABLE IF NOT EXISTS tournament_player (
    tournament_id BIGINT REFERENCES tournament(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES player(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, player_id)
);

-- 6. Match Table (each match can have multiple games)
CREATE TABLE IF NOT EXISTS match (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournament(id) ON DELETE CASCADE,
    round INTEGER NOT NULL DEFAULT 1,
    player1_id BIGINT NOT NULL REFERENCES player(id),
    player2_id BIGINT NOT NULL REFERENCES player(id),
    winner_id BIGINT REFERENCES player(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Game Table (can exist with or without a match/tournament)
CREATE TABLE IF NOT EXISTS game (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT REFERENCES match(id) ON DELETE CASCADE,
    tournament_id BIGINT REFERENCES tournament(id) ON DELETE CASCADE,
    player1_id BIGINT NOT NULL REFERENCES player(id),
    player2_id BIGINT NOT NULL REFERENCES player(id),
    result game_result NOT NULL DEFAULT 'PLAYER1_WIN',
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id BIGINT REFERENCES player(id),
    game_number INTEGER,
    date_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_game_result_winner CHECK (
        (result = 'DRAW' AND winner_id IS NULL)
        OR (result <> 'DRAW' AND winner_id IS NOT NULL)
    )
);

-- 8. Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$func$;

-- 9. Trigger for Users Table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
