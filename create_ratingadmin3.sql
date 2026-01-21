-- Create ratingadmin3 user without player profile
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, created_at)
SELECT 'ratingadmin3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsO5HfzYtQrQzDz1TS', 'ratingadmin3@rispo.com', 'RA003', 'RATING_ADMIN', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'ratingadmin3');

SELECT id, username, email, role FROM users WHERE username = 'ratingadmin3';
