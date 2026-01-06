# User Roles and Permissions Summary

## User Role Hierarchy

1. **SUPER_USER** (Highest Level)
   - Can do everything in the system
   - Default credentials: admin/admin (must change on first login)
   - Created automatically on first application startup

2. **SYSTEM_ADMIN**
   - Generate tokens for SYSTEM_ADMIN, RATING_ADMIN, and CLUB_ADMIN roles
   - Manage clubs and players
   - Manage rating engine settings
   - **CANNOT** process match results

3. **RATING_ADMIN**
   - Process match results (approve/reject)
   - Manage clubs and players
   - Manage rating engine settings
   - **CANNOT** generate admin tokens

4. **CLUB_ADMIN**
   - Create and manage clubs
   - Accept/reject club join requests
   - Process match results
   - Suspend/enable players and clubs
   - Manage rating engine settings
   - **CANNOT** generate admin tokens

5. **PLAYER**
   - Submit match results
   - Challenge other players
   - Request to join clubs or change clubs
   - View their own statistics and rankings

## Key Permission Rules

### Club Management
- ✅ CLUB_ADMIN: Can create and manage clubs
- ✅ CLUB_ADMIN: Accept/reject join requests
- ✅ SYSTEM_ADMIN: Can suspend/enable any club
- ✅ RATING_ADMIN: Can suspend/enable any club
- ✅ RATING_ADMIN: Can create and manage clubs

### Match Result Processing
- ✅ RATING_ADMIN: Review and approve/reject match results
- ✅ CLUB_ADMIN: Review and approve/reject match results (with club scope where applicable)
- ✅ SUPER_USER: Can review matches
- ❌ SYSTEM_ADMIN: Cannot process match results
- ✅ PLAYER: Can submit match results

### Player Management
- ✅ SYSTEM_ADMIN: Can suspend/enable players
- ✅ RATING_ADMIN: Can suspend/enable players
- ✅ CLUB_ADMIN: Can verify and suspend/enable players (with club scope)

### Token Generation
- ✅ SYSTEM_ADMIN: Generate tokens for SYSTEM_ADMIN, RATING_ADMIN, CLUB_ADMIN
- ❌ RATING_ADMIN: Cannot generate tokens
- ❌ CLUB_ADMIN: Cannot generate tokens

### Rating Engine Settings
- ✅ SYSTEM_ADMIN: Can modify rating settings
- ✅ SUPER_USER: Can modify rating settings
- ✅ RATING_ADMIN: Can modify rating settings
- ✅ CLUB_ADMIN: Can modify rating settings

## Club Join/Change Workflow

1. **Player requests to join or change club**
   - Player can request even if already in a club (club change)
   - Request is marked as "club change" if player has existing club
   - Player remains in current club until approved

2. **Club Admin reviews request**
   - CLUB_ADMIN for the target club reviews the request
   - Can approve or reject with notes

3. **On approval**
   - Player is moved from old club (if any) to new club
   - Old club information is preserved in request history

4. **On rejection**
   - Player stays in their current club
   - Rejection reason recorded

## Password Management

- SuperUser (admin) must change password on first login
- Password must be at least 6 characters
- Password change enforced through UI modal on login
- Old password verification required

## Database Schema

The consolidated V1 migration includes:
- All user roles (SUPER_USER → PLAYER hierarchy)
- Club management with location search
- Club join requests with club change support
- Match/game system with rating calculations
- Player verification and flagging system
- Challenge system between players
- Tournament support
- Rating settings configuration
- Admin token system for role-based registration
