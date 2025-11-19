-- Create clubs table
CREATE TABLE club (
    club_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_by BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_club_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Create admin tokens table for club admin registration
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
    CONSTRAINT fk_admin_token_generated_by FOREIGN KEY (generated_by) REFERENCES users(user_id),
    CONSTRAINT fk_admin_token_used_by FOREIGN KEY (used_by) REFERENCES users(user_id)
);

-- Add club_id to users table
ALTER TABLE users ADD COLUMN club_id BIGINT;
ALTER TABLE users ADD CONSTRAINT fk_users_club FOREIGN KEY (club_id) REFERENCES club(club_id);

-- Add club_id to player table
ALTER TABLE player ADD COLUMN club_id BIGINT;
ALTER TABLE player ADD CONSTRAINT fk_player_club FOREIGN KEY (club_id) REFERENCES club(club_id);

-- Create index for better query performance
CREATE INDEX idx_users_club_id ON users(club_id);
CREATE INDEX idx_player_club_id ON player(club_id);
CREATE INDEX idx_admin_token_token ON admin_token(token);
CREATE INDEX idx_admin_token_club_id ON admin_token(club_id);
CREATE INDEX idx_club_status ON club(status);

-- Add comments
COMMENT ON TABLE club IS 'Clubs/Hosts - venues, bars, recreational centers, entertainment centers';
COMMENT ON TABLE admin_token IS 'Tokens for registering club admins with specific permissions';
COMMENT ON COLUMN club.status IS 'Status: ACTIVE, INACTIVE, SUSPENDED';
COMMENT ON COLUMN admin_token.role IS 'Role to be assigned: CLUB_ADMIN or RATING_ADMIN';
