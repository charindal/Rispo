-- V14__Create_knockout_tournament_tables.sql

-- Create knockout_tournament table
CREATE TABLE knockout_tournament (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    tournament_name VARCHAR(255) NOT NULL,
    tournament_year INT NOT NULL,
    week_number INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
    current_round INT DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    winner_player_id BIGINT,
    runner_up_player_id BIGINT,
    semifinalists TEXT,
    quarterfinalists TEXT,
    bracket_data TEXT,
    draw_type VARCHAR(20) NOT NULL DEFAULT 'RANDOM',
    FOREIGN KEY (club_id) REFERENCES club(club_id),
    FOREIGN KEY (winner_player_id) REFERENCES player(id),
    FOREIGN KEY (runner_up_player_id) REFERENCES player(id)
);

-- Create indexes for knockout_tournament
CREATE INDEX idx_knockout_tournament_club_year ON knockout_tournament (club_id, tournament_year);
CREATE INDEX idx_knockout_tournament_club_week ON knockout_tournament (club_id, tournament_year, week_number);
CREATE UNIQUE INDEX unique_knockout_tournament_club_year_week ON knockout_tournament (club_id, tournament_year, week_number);

-- Create tournament_points_config table
CREATE TABLE tournament_points_config (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL UNIQUE,
    winner_points INT NOT NULL DEFAULT 5,
    runner_up_points INT NOT NULL DEFAULT 3,
    semifinalist_points INT NOT NULL DEFAULT 2,
    quarterfinalist_points INT NOT NULL DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES club(club_id)
);

-- Create player_tournament_points table
CREATE TABLE player_tournament_points (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    club_id BIGINT NOT NULL,
    tournament_id BIGINT NOT NULL,
    tournament_year INT NOT NULL,
    points_earned INT NOT NULL,
    position_achieved VARCHAR(50) NOT NULL,
    date_earned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES player(id),
    FOREIGN KEY (club_id) REFERENCES club(club_id),
    FOREIGN KEY (tournament_id) REFERENCES knockout_tournament(id)
);

-- Create indexes for player_tournament_points
CREATE INDEX idx_player_tournament_points_player_club_year ON player_tournament_points (player_id, club_id, tournament_year);
CREATE INDEX idx_player_tournament_points_club_year_points ON player_tournament_points (club_id, tournament_year, points_earned DESC);

-- Insert default point configurations for existing clubs
INSERT INTO tournament_points_config (club_id, winner_points, runner_up_points, semifinalist_points, quarterfinalist_points)
SELECT club_id, 5, 3, 2, 1 
FROM club 
WHERE NOT EXISTS (
    SELECT 1 FROM tournament_points_config WHERE club_id = club.club_id
);