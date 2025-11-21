# Database Reset Instructions

## Steps to Reset and Use the New Consolidated Migration

### 1. Stop the Application
```powershell
docker-compose down
```

### 2. Remove the Database Volume (Complete Reset)
```powershell
docker volume rm rispo_postgres_data
```

Or if you want to keep other data but reset the database:
```powershell
docker-compose down -v
```

### 3. Delete Old Migration Files
Delete all the old migration files EXCEPT V1__init_complete_schema.sql:
- V4__init_schema.sql
- V5__add_user_verification_fields.sql
- V6__add_clubs_and_tokens.sql
- V7__add_club_join_requests.sql
- V8__add_rating_system.sql
- V9__add_challenge_system.sql
- V10__add_club_admin_role.sql
- V11__change_game_result_to_varchar.sql
- V12__add_challenge_name_and_indexes.sql
- V13__remove_acknowledgment_system.sql
- V14__add_club_location_fields.sql
- V15__add_club_change_request_fields.sql
- V16__add_superuser_role_and_password_change.sql

Or use this PowerShell command to delete them:
```powershell
cd src\main\resources\db\migration
Remove-Item V4__*.sql, V5__*.sql, V6__*.sql, V7__*.sql, V8__*.sql, V9__*.sql, V10__*.sql, V11__*.sql, V12__*.sql, V13__*.sql, V14__*.sql, V15__*.sql, V16__*.sql
```

### 4. Rebuild and Start the Application
```powershell
docker-compose up -d --build app
```

### 5. Verify the Setup
- The database will be created with the complete schema from V1
- SuperUser (username: admin, password: admin) will be created automatically
- On first login with admin/admin, you'll be forced to change the password

## What's Included in V1__init_complete_schema.sql

The consolidated migration includes:
- ✅ Users table with all roles (SUPER_USER, SYSTEM_ADMIN, RATING_ADMIN, CLUB_ADMIN, PLAYER)
- ✅ Password change enforcement (must_change_password field)
- ✅ Clubs with location fields (city, suburb)
- ✅ Players with verification and rating system
- ✅ Club join requests with club change support
- ✅ Admin tokens for role-based registration
- ✅ Tournaments and tournament players
- ✅ Challenges between players
- ✅ Matches with rating tracking and admin review
- ✅ Games with multiple result types
- ✅ Player flags for dispute tracking
- ✅ Rating settings for customizable rating calculations
- ✅ All necessary indexes for performance
- ✅ Triggers for automatic timestamp updates

## Default SuperUser Credentials
- **Username:** admin
- **Password:** admin
- **Must change on first login:** Yes
- **Role:** SUPER_USER (can do everything)

## Database Connection
The application will connect to PostgreSQL using the settings in docker-compose.yml:
- Host: db
- Port: 5432
- Database: rispoDb
- User: dbuser
- Password: dbpwd
