-- Temporary migration to add 24 users for club_id = 3
-- Password for all users is '1234' (BCrypt hashed)
-- Users can change their names later, starting with nickname as name

-- Insert users with BCrypt hashed password for '1234'
-- Hash: $2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi
INSERT INTO users (username, email, password, national_id, role, is_active, must_change_password, created_at) VALUES
('Mzaya', 'mzaya@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID001', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Monyira', 'monyira@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID002', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Matemai', 'matemai@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID003', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Ama2k', 'ama2k@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID004', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Lemuel', 'lemuel@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID005', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('OKS', 'oks@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID006', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('D_Trump', 'dtrump@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID007', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Whezha', 'whezha@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID008', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Stones', 'stones@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID009', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Mandhla', 'mandhla@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID010', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Senator', 'senator@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID011', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('B4', 'b4@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID012', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Ferris', 'ferris@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID013', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Chichena', 'chichena@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID014', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Igwe', 'igwe@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID015', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Putin', 'putin@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID016', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Zeto', 'zeto@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID017', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Taflo', 'taflo@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID018', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Nyags', 'nyags@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID019', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Floyd', 'floyd@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID020', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Izzy', 'izzy@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID021', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('General', 'general@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID022', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Kamuzu', 'kamuzu@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID023', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('OTF', 'otf@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID024', 'PLAYER', true, false, CURRENT_TIMESTAMP),
('Cde', 'cde@blueroof.co.zw', '$2a$10$N.zmdr9k7uOkMBpQy2kqUOeJJYEQ6/m.PUOt8N9/Xo.JpT/gGZhFi', 'NID025', 'PLAYER', true, false, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Create players for each user and join them to club_id = 3 if it exists
-- This will only run if club_id = 3 exists
INSERT INTO player (user_id, club_id, name, email, phone, is_verified, created_at)
SELECT u.id, 3, u.username, u.email, '0000000000', true, CURRENT_TIMESTAMP
FROM users u
JOIN club c ON c.club_id = 3
WHERE u.username IN (
    'Mzaya', 'Monyira', 'Matemai', 'Ama2k', 'Lemuel', 'OKS', 'D_Trump', 'Whezha', 'Stones', 'Mandhla',
    'Senator', 'B4', 'Ferris', 'Chichena', 'Igwe', 'Putin', 'Zeto', 'Taflo', 'Nyags', 'Floyd',
    'Izzy', 'General', 'Kamuzu', 'OTF', 'Cde'
)
AND NOT EXISTS (
    SELECT 1 FROM player p WHERE p.user_id = u.id AND p.club_id = 3
);

COMMENT ON COLUMN users.username IS 'Temporary users created for club_id = 3, password is 1234';