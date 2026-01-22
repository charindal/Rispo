-- V17__Add_system_admin_users.sql
-- Create system admin users with default password: 1234
-- BCrypt hash for "1234": $2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W

-- Insert sysadmin1
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, created_at)
SELECT 'sysadmin1', 
       '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 
       'sysadmin1@rispo.com', 
       'SA001', 
       'SYSTEM_ADMIN', 
       true, 
       false, 
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'sysadmin1');

-- Insert sysadmin2
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, created_at)
SELECT 'sysadmin2', 
       '$2a$10$RXGBzxsmcGQpVsAEk4nOdumrf9.JJShTWDNNSnjgvc5SWtKuEi51W', 
       'sysadmin2@rispo.com', 
       'SA002', 
       'SYSTEM_ADMIN', 
       true, 
       false, 
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'sysadmin2');
