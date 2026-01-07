-- V10__test_data_users_and_players.sql
-- Test data migration for development/testing purposes
-- Creates sample users, clubs, and players for testing all admin roles
-- ALL PASSWORDS ARE: 1234 (BCrypt encoded)

-- BCrypt hash for password "1234"
-- Generated using BCryptPasswordEncoder with default strength (10)
-- Hash: $2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W

-- ============================================
-- 1. CREATE SUPER USERS (2)
-- ============================================
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password)
VALUES 
    ('superuser1', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'superuser1@rispo.test', 'SU001', 'SUPER_USER', true, false),
    ('superuser2', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'superuser2@rispo.test', 'SU002', 'SUPER_USER', true, false);

-- ============================================
-- 2. CREATE RATING ADMINS (2)
-- ============================================
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password)
VALUES 
    ('ratingadmin1', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'ratingadmin1@rispo.test', 'RA001', 'RATING_ADMIN', true, false),
    ('ratingadmin2', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'ratingadmin2@rispo.test', 'RA002', 'RATING_ADMIN', true, false);

-- ============================================
-- 3. CREATE CLUB ADMIN USERS (2) - Clubs will be created next
-- ============================================
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password)
VALUES 
    ('clubadmin1', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'clubadmin1@rispo.test', 'CA001', 'CLUB_ADMIN', true, false),
    ('clubadmin2', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'clubadmin2@rispo.test', 'CA002', 'CLUB_ADMIN', true, false);

-- ============================================
-- 4. CREATE CLUBS (2) - One for each club admin
-- ============================================
INSERT INTO club (name, description, address, city, suburb, contact_email, contact_phone, created_by, status)
VALUES 
    ('Eagles Pool Club', 'Premier pool club in Johannesburg - competitive and recreational', '123 Main Street', 'Johannesburg', 'Sandton', 'eagles@rispo.test', '+27 11 123 4567', 
     (SELECT id FROM users WHERE username = 'clubadmin1'), 'ACTIVE'),
    ('Sharks Cue Sports', 'Cape Town''s finest cue sports venue - professional tables', '456 Beach Road', 'Cape Town', 'Sea Point', 'sharks@rispo.test', '+27 21 987 6543', 
     (SELECT id FROM users WHERE username = 'clubadmin2'), 'ACTIVE');

-- ============================================
-- 5. ASSIGN CLUBS TO CLUB ADMINS
-- ============================================
UPDATE users SET club_id = (SELECT club_id FROM club WHERE name = 'Eagles Pool Club') WHERE username = 'clubadmin1';
UPDATE users SET club_id = (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports') WHERE username = 'clubadmin2';

-- ============================================
-- 6. CREATE PLAYER PROFILES FOR SUPER USERS
-- ============================================
INSERT INTO player (user_id, name, email, phone, rating, is_verified, verified_at)
VALUES 
    ((SELECT id FROM users WHERE username = 'superuser1'), 'Super Admin One', 'superuser1@rispo.test', '+27 82 100 0001', 1200, true, NOW()),
    ((SELECT id FROM users WHERE username = 'superuser2'), 'Super Admin Two', 'superuser2@rispo.test', '+27 82 100 0002', 1200, true, NOW());

-- Set verified_by for super users (verified by themselves)
UPDATE player SET verified_by = (SELECT id FROM users WHERE username = 'superuser1') 
WHERE user_id = (SELECT id FROM users WHERE username = 'superuser1');
UPDATE player SET verified_by = (SELECT id FROM users WHERE username = 'superuser1') 
WHERE user_id = (SELECT id FROM users WHERE username = 'superuser2');

-- ============================================
-- 7. CREATE PLAYER PROFILES FOR RATING ADMINS
-- ============================================
INSERT INTO player (user_id, name, email, phone, rating, is_verified, verified_by, verified_at)
VALUES 
    ((SELECT id FROM users WHERE username = 'ratingadmin1'), 'Rating Admin One', 'ratingadmin1@rispo.test', '+27 82 200 0001', 1200, true, 
     (SELECT id FROM users WHERE username = 'superuser1'), NOW()),
    ((SELECT id FROM users WHERE username = 'ratingadmin2'), 'Rating Admin Two', 'ratingadmin2@rispo.test', '+27 82 200 0002', 1200, true, 
     (SELECT id FROM users WHERE username = 'superuser1'), NOW());

-- ============================================
-- 8. CREATE PLAYER PROFILES FOR CLUB ADMINS (with their clubs)
-- ============================================
INSERT INTO player (user_id, name, email, phone, club_id, rating, is_verified, verified_by, verified_at)
VALUES 
    ((SELECT id FROM users WHERE username = 'clubadmin1'), 'Club Admin Eagles', 'clubadmin1@rispo.test', '+27 82 300 0001', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'superuser1'), NOW()),
    ((SELECT id FROM users WHERE username = 'clubadmin2'), 'Club Admin Sharks', 'clubadmin2@rispo.test', '+27 82 300 0002', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'superuser1'), NOW());

-- ============================================
-- 9. CREATE 20 SAMPLE PLAYER USERS (10 per club)
-- ============================================
-- Eagles Pool Club Players (10)
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, club_id)
VALUES 
    ('eagle_player1', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle1@rispo.test', 'EP001', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player2', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle2@rispo.test', 'EP002', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player3', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle3@rispo.test', 'EP003', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player4', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle4@rispo.test', 'EP004', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player5', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle5@rispo.test', 'EP005', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player6', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle6@rispo.test', 'EP006', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player7', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle7@rispo.test', 'EP007', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player8', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle8@rispo.test', 'EP008', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player9', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle9@rispo.test', 'EP009', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club')),
    ('eagle_player10', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'eagle10@rispo.test', 'EP010', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'));

-- Sharks Cue Sports Players (10)
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, club_id)
VALUES 
    ('shark_player1', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark1@rispo.test', 'SP001', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player2', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark2@rispo.test', 'SP002', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player3', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark3@rispo.test', 'SP003', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player4', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark4@rispo.test', 'SP004', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player5', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark5@rispo.test', 'SP005', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player6', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark6@rispo.test', 'SP006', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player7', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark7@rispo.test', 'SP007', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player8', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark8@rispo.test', 'SP008', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player9', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark9@rispo.test', 'SP009', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports')),
    ('shark_player10', '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 'shark10@rispo.test', 'SP010', 'PLAYER', true, false, (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'));

-- ============================================
-- 10. CREATE PLAYER PROFILES FOR EAGLES CLUB PLAYERS
-- ============================================
INSERT INTO player (user_id, name, email, phone, club_id, rating, is_verified, verified_by, verified_at)
VALUES 
    ((SELECT id FROM users WHERE username = 'eagle_player1'), 'John Eagle', 'eagle1@rispo.test', '+27 82 400 0001', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player2'), 'Peter Wings', 'eagle2@rispo.test', '+27 82 400 0002', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player3'), 'Michael Talon', 'eagle3@rispo.test', '+27 82 400 0003', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player4'), 'David Feather', 'eagle4@rispo.test', '+27 82 400 0004', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player5'), 'James Soar', 'eagle5@rispo.test', '+27 82 400 0005', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player6'), 'Robert Nest', 'eagle6@rispo.test', '+27 82 400 0006', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player7'), 'William Sky', 'eagle7@rispo.test', '+27 82 400 0007', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player8'), 'Thomas Beak', 'eagle8@rispo.test', '+27 82 400 0008', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player9'), 'Charles Flight', 'eagle9@rispo.test', '+27 82 400 0009', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW()),
    ((SELECT id FROM users WHERE username = 'eagle_player10'), 'Daniel Swoop', 'eagle10@rispo.test', '+27 82 400 0010', 
     (SELECT club_id FROM club WHERE name = 'Eagles Pool Club'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin1'), NOW());

-- ============================================
-- 11. CREATE PLAYER PROFILES FOR SHARKS CLUB PLAYERS
-- ============================================
INSERT INTO player (user_id, name, email, phone, club_id, rating, is_verified, verified_by, verified_at)
VALUES 
    ((SELECT id FROM users WHERE username = 'shark_player1'), 'Andrew Fin', 'shark1@rispo.test', '+27 82 500 0001', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player2'), 'Chris Wave', 'shark2@rispo.test', '+27 82 500 0002', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player3'), 'Mark Tide', 'shark3@rispo.test', '+27 82 500 0003', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player4'), 'Steven Deep', 'shark4@rispo.test', '+27 82 500 0004', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player5'), 'Paul Ocean', 'shark5@rispo.test', '+27 82 500 0005', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player6'), 'Kevin Reef', 'shark6@rispo.test', '+27 82 500 0006', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player7'), 'Brian Current', 'shark7@rispo.test', '+27 82 500 0007', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player8'), 'Jason Coral', 'shark8@rispo.test', '+27 82 500 0008', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player9'), 'Eric Shore', 'shark9@rispo.test', '+27 82 500 0009', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW()),
    ((SELECT id FROM users WHERE username = 'shark_player10'), 'Ryan Splash', 'shark10@rispo.test', '+27 82 500 0010', 
     (SELECT club_id FROM club WHERE name = 'Sharks Cue Sports'), 1200, true, 
     (SELECT id FROM users WHERE username = 'clubadmin2'), NOW());

-- ============================================
-- SUMMARY:
-- Total Users Created: 26
--   - 2 Super Users
--   - 2 Rating Admins  
--   - 2 Club Admins
--   - 20 Players (10 per club)
--
-- Total Clubs Created: 2
--   - Eagles Pool Club (Johannesburg)
--   - Sharks Cue Sports (Cape Town)
--
-- All users have password: 1234
-- All players are verified with initial rating: 1200
-- ============================================
