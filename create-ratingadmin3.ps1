# Create ratingadmin3 user

$password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsO5HfzYtQrQzDz1TS'

# The password hash is for "password123"
$sql = @"
INSERT INTO users (username, password, email, national_id, role, is_active, must_change_password, created_at)
SELECT 'ratingadmin3', '$password', 'ratingadmin3@rispo.com', 'RA003', 'RATING_ADMIN', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'ratingadmin3');
"@

Write-Host "Creating ratingadmin3 user..."
$sql | podman exec -i rispo-db psql -U rispo_admin -d rispo

Write-Host ""
Write-Host "Verifying user creation..."
"SELECT id, username, email, role FROM users WHERE username = 'ratingadmin3';" | podman exec -i rispo-db psql -U rispo_admin -d rispo

Write-Host ""
Write-Host "User credentials:"
Write-Host "  Username: ratingadmin3"
Write-Host "  Password: password123"
Write-Host "  Role: RATING_ADMIN"
