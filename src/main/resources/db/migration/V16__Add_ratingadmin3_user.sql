-- V16__Add_ratingadmin3_user.sql
-- Create ratingadmin3 user without player profile
-- Password: password123 (BCrypt hashed)

INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, created_at)
SELECT 'ratingadmin3', 
       '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 
       'ratingadmin3@rispo.com', 
       'RA003', 
       'RATING_ADMIN', 
       true, 
       false, 
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'ratingadmin3');
