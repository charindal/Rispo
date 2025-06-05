-- V1__init_schema_with_draw_support.sql

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('PLAYER', 'RATING_ADMIN', 'SYSTEM_ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Player Table
CREATE TABLE player (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rating INT DEFAULT 1200,
    matches_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0
);

-- 3. Match Result Enum
CREATE TYPE match_result AS ENUM ('PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW');

-- 4. Match Table with draw support
CREATE TABLE match (
    id SERIAL PRIMARY KEY,
    player1_id INT NOT NULL REFERENCES player(id),
    player2_id INT NOT NULL REFERENCES player(id),
    winner_id INT REFERENCES player(id), -- nullable for draws
    result match_result NOT NULL DEFAULT 'PLAYER1_WIN',
    date_played TIMESTAMP NOT NULL,
    player1_rating_change INT,
    player2_rating_change INT,
    CONSTRAINT chk_match_result_winner CHECK (
        (result = 'DRAW' AND winner_id IS NULL)
        OR (result <> 'DRAW' AND winner_id IS NOT NULL)
    )
);

-- 5. Tournament Table
CREATE TABLE tournament (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE
);

-- 6. TournamentPlayer Join Table
CREATE TABLE tournament_player (
    tournament_id INT REFERENCES tournament(id) ON DELETE CASCADE,
    player_id INT REFERENCES player(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, player_id)
);

-- 7. Trigger for users.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
