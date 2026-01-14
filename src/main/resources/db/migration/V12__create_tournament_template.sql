-- V12: Create tournament_template table
CREATE TABLE tournament_template (
    template_id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50) NOT NULL,
    min_players INTEGER,
    max_players INTEGER,
    number_of_rounds INTEGER,
    scoring_system VARCHAR(50),
    time_control VARCHAR(255),
    rules TEXT,
    points_for_win INTEGER,
    points_for_draw INTEGER,
    points_for_loss INTEGER,
    allow_tie_breaks BOOLEAN DEFAULT true,
    tie_break_method VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active templates
CREATE INDEX idx_tournament_template_active ON tournament_template(is_active);

-- Insert default templates
INSERT INTO tournament_template (
    template_name, description, tournament_type, min_players, max_players, 
    number_of_rounds, scoring_system, points_for_win, points_for_draw, 
    points_for_loss, allow_tie_breaks, tie_break_method
) VALUES 
(
    'Quick Swiss Tournament',
    'Fast-paced Swiss-system tournament for club members. Perfect for weekly club nights.',
    'SWISS',
    4,
    16,
    5,
    'MATCH_WINS',
    3,
    1,
    0,
    true,
    'BUCHHOLZ'
),
(
    'Round Robin League',
    'Everyone plays everyone. Ideal for smaller groups to determine overall champion.',
    'ROUND_ROBIN',
    4,
    8,
    NULL,
    'MATCH_WINS',
    3,
    1,
    0,
    false,
    NULL
),
(
    'Knockout Championship',
    'Single-elimination tournament. Winner takes all format for competitive events.',
    'KNOCKOUT',
    4,
    32,
    NULL,
    'MATCH_WINS',
    NULL,
    NULL,
    NULL,
    false,
    NULL
),
(
    'Monthly Club Championship',
    'Extended Swiss tournament with higher round count. Perfect for monthly club championships.',
    'SWISS',
    8,
    32,
    7,
    'MATCH_WINS',
    3,
    1,
    0,
    true,
    'MEDIAN_BUCHHOLZ'
);
