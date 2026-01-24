-- Temporary migration to add 24 users for club_id = 3
-- Password for all users is '1234' (BCrypt hashed)
-- Users can change their names later, starting with nickname as name

-- Insert users with BCrypt hashed password for '1234'
-- Hash: $2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi
INSERT INTO users (username, email, password, name, surname, phone, is_verified, is_active, user_role, created_date) VALUES
('Mzaya', 'mzaya@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Mzaya', 'Player', '0000000001', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Monyira', 'monyira@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Monyira', 'Player', '0000000002', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Matemai', 'matemai@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Matemai', 'Player', '0000000003', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Ama2k', 'ama2k@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Ama2k', 'Player', '0000000004', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Lemuel', 'lemuel@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Lemuel', 'Player', '0000000005', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('OKS', 'oks@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'OKS', 'Player', '0000000006', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('D_Trump', 'dtrump@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'D_Trump', 'Player', '0000000007', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Whezha', 'whezha@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Whezha', 'Player', '0000000008', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Stones', 'stones@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Stones', 'Player', '0000000009', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Mandhla', 'mandhla@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Mandhla', 'Player', '0000000010', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Senator', 'senator@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Senator', 'Player', '0000000011', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('B4', 'b4@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'B4', 'Player', '0000000012', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Ferris', 'ferris@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Ferris', 'Player', '0000000013', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Chichena', 'chichena@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Chichena', 'Player', '0000000014', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Igwe', 'igwe@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Igwe', 'Player', '0000000015', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Putin', 'putin@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Putin', 'Player', '0000000016', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Zeto', 'zeto@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Zeto', 'Player', '0000000017', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Taflo', 'taflo@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Taflo', 'Player', '0000000018', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Nyags', 'nyags@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Nyags', 'Player', '0000000019', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Floyd', 'floyd@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Floyd', 'Player', '0000000020', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Izzy', 'izzy@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Izzy', 'Player', '0000000021', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('General', 'general@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'General', 'Player', '0000000022', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Kamuzu', 'kamuzu@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Kamuzu', 'Player', '0000000023', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('OTF', 'otf@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'OTF', 'Player', '0000000024', true, true, 'PLAYER', CURRENT_TIMESTAMP),
('Cde', 'cde@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'Cde', 'Player', '0000000025', true, true, 'PLAYER', CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Create players for each user and join them to club_id = 3 if it exists
-- This will only run if club_id = 3 exists
INSERT INTO player (user_id, club_id, name, surname, phone, is_verified, created_date)
SELECT u.id, 3, u.name, u.surname, u.phone, true, CURRENT_TIMESTAMP
FROM users u
JOIN club c ON c.id = 3
WHERE u.username IN (
    'Mzaya', 'Monyira', 'Matemai', 'Ama2k', 'Lemuel', 'OKS', 'D_Trump', 'Whezha', 'Stones', 'Mandhla',
    'Senator', 'B4', 'Ferris', 'Chichena', 'Igwe', 'Putin', 'Zeto', 'Taflo', 'Nyags', 'Floyd',
    'Izzy', 'General', 'Kamuzu', 'OTF', 'Cde'
)
AND NOT EXISTS (
    SELECT 1 FROM player p WHERE p.user_id = u.id AND p.club_id = 3
);

-- Set initial ELO ratings for new players (1200 is typical starting rating)
INSERT INTO player_rating (player_id, club_id, current_rating, peak_rating, games_played, wins, losses, draws, created_date, updated_date)
SELECT p.id, p.club_id, 1200, 1200, 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM player p
JOIN users u ON u.id = p.user_id
WHERE u.username IN (
    'Mzaya', 'Monyira', 'Matemai', 'Ama2k', 'Lemuel', 'OKS', 'D_Trump', 'Whezha', 'Stones', 'Mandhla',
    'Senator', 'B4', 'Ferris', 'Chichena', 'Igwe', 'Putin', 'Zeto', 'Taflo', 'Nyags', 'Floyd',
    'Izzy', 'General', 'Kamuzu', 'OTF', 'Cde'
)
AND p.club_id = 3
ON CONFLICT (player_id, club_id) DO NOTHING;

COMMENT ON COLUMN users.username IS 'Temporary users created for club_id = 3, password is 1234';