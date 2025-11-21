# Rispo User System Guide

**Version 1.0 | November 2025**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Registration](#registration)
   - [Login](#login)
3. [User Roles](#user-roles)
4. [Player Features](#player-features)
   - [Player Dashboard](#player-dashboard)
   - [Profile Management](#profile-management)
   - [Challenge System](#challenge-system)
   - [Match Submission](#match-submission)
   - [Match Acknowledgment](#match-acknowledgment)
5. [Admin Features](#admin-features)
   - [Admin Dashboard](#admin-dashboard)
   - [Club Management](#club-management)
   - [Player Verification](#player-verification)
   - [Match Review](#match-review)
   - [Rating Settings](#rating-settings)
6. [Dual Role Users](#dual-role-users)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

Rispo is a comprehensive table tennis player rating and match management system. It allows players to track their ratings, challenge opponents, submit match results, and participate in competitive play within clubs and leagues.

### Key Features
- **ELO Rating System**: Dynamic player ratings based on match results
- **Challenge System**: Issue and accept challenges between players
- **Match Management**: Submit, acknowledge, and review match results
- **Club Management**: Organize players into clubs with admin oversight
- **Real-time Notifications**: Stay updated on challenges and match results
- **Admin Controls**: Comprehensive tools for league/club administrators

---

## Getting Started

### Registration

**Step 1: Navigate to Registration Page**

1. Open your web browser and go to: `http://localhost:3000`
2. You will be redirected to the Login page
3. Click the **"Don't have an account? Register here"** link

**Step 2: Fill in User Details**

![Registration Form]

The registration form requires:
- **Username**: Unique identifier (3-50 characters)
- **Password**: Secure password (minimum 6 characters)
- **Email**: Valid email address
- **Full Name**: Your complete name
- **Role**: Select your role:
  - **PLAYER**: For regular players
  - **ADMIN**: For club administrators
  - **SUPER_ADMIN**: For system administrators

**Step 3: Create Player Profile**

If you selected **PLAYER** or **ADMIN** role, additional fields appear:

- **Playing Style**: Choose your playing style:
  - Defensive
  - Offensive
  - All-Round
- **Club**: Select your club from the dropdown (if available)

**Step 4: Submit Registration**

1. Review all entered information
2. Click **"Register"** button
3. If successful, you'll be redirected to the login page
4. If there's an error (e.g., username already exists), correct the information and try again

---

### Login

**Step 1: Access Login Page**

Navigate to `http://localhost:3000/login`

![Login Page]

**Step 2: Enter Credentials**

- **Username**: Enter your registered username
- **Password**: Enter your password

**Step 3: Sign In**

1. Click **"Login"** button
2. Upon successful authentication:
   - **Players**: Redirected to Player Dashboard
   - **Admins without player profile**: Redirected to Admin Dashboard
   - **Admins with player profile**: Redirected to Player Dashboard with option to switch to Admin Mode

**Login Errors:**
- "Invalid credentials": Username or password is incorrect
- "Account not found": Username doesn't exist in the system

---

## User Roles

### PLAYER
- Submit match results
- Issue and accept challenges
- View personal statistics
- Update profile information
- Acknowledge match results

### ADMIN
- All PLAYER features (if player profile exists)
- Manage club members
- Verify/unverify players
- Review and approve match results
- Access admin dashboard
- Configure rating settings

### SUPER_ADMIN
- All ADMIN features
- System-wide configuration
- Access to all clubs and players
- Rating system management

---

## Player Features

### Player Dashboard

The Player Dashboard is your central hub for all activities.

![Player Dashboard]

**Dashboard Sections:**

#### 1. Profile Summary Card
- **Profile Picture**: Your avatar or default image
- **Player Name**: Your full name
- **Club**: Current club affiliation
- **Playing Style**: Your selected playing style
- **Current Rating**: Your ELO rating (starts at 1500)
- **Verification Status**: Badge showing if you're verified by admin

#### 2. Navigation Menu
Located at the top of the page:
- **Home**: Returns to dashboard
- **Profile**: View/edit your profile
- **Challenges**: Manage incoming and outgoing challenges
- **Submit Match**: Submit a new match result
- **Logout**: Sign out of the system
- **Admin Mode**: (If you're an admin) Switch to admin dashboard

#### 3. Statistics Overview
Four key metrics displayed as cards:
- **Total Matches Played**: Count of all your completed matches
- **Win Rate**: Percentage of matches won
- **Active Challenges**: Number of pending challenges (incoming + outgoing)
- **Pending Acknowledgments**: Matches awaiting your acknowledgment

#### 4. Recent Matches Table
Shows your last 10 matches with:
- **Date**: When the match was played
- **Opponent**: Name of your opponent
- **Result**: Match outcome (Won/Lost) with game scores
- **Rating Change**: Points gained or lost (+/- number)
- **Status**: Match status (ACKNOWLEDGED, PENDING_ACKNOWLEDGMENT, etc.)

#### 5. Quick Actions
- **Submit New Match**: Button to quickly submit a match result
- **View All Matches**: Link to see complete match history
- **Issue Challenge**: Button to challenge another player

---

### Profile Management

**Accessing Profile:**
Click **"Profile"** in the navigation menu

![Profile Page]

**Profile Information Display:**

**Personal Details**
- Username (non-editable)
- Full Name
- Email address
- Club affiliation
- Playing style

**Player Statistics**
- Current rating
- Total matches played
- Wins / Losses
- Win percentage
- Highest rating achieved
- Verification status

**Editing Profile:**

1. Click **"Edit Profile"** button
2. Update editable fields:
   - Full Name
   - Email
   - Playing Style
   - Club (select from dropdown)
3. Click **"Save Changes"**
4. Confirmation message appears on success

**Password Change:**

1. Click **"Change Password"** button
2. Enter:
   - Current password
   - New password
   - Confirm new password
3. Click **"Update Password"**
4. You'll be logged out and need to sign in with the new password

---

### Challenge System

The challenge system allows players to formally request matches with opponents.

**Accessing Challenges:**
Click **"Challenges"** in the navigation menu

![Challenges Page]

**Challenge Tabs:**

#### 1. Incoming Challenges
Shows challenges sent TO you by other players.

**Challenge Card Details:**
- **Challenger Name**: Who challenged you
- **Challenger Rating**: Their current ELO rating
- **Challenge Date**: When the challenge was issued
- **Message**: Optional message from challenger
- **Status**: Challenge state (PENDING, ACCEPTED, REJECTED, CANCELLED)

**Actions Available:**
- **Accept**: Agree to play the match
  - Changes status to ACCEPTED
  - You can now submit the match result
- **Reject**: Decline the challenge
  - Sends rejection notification to challenger
  - Challenge is closed
- **View Profile**: See challenger's full profile and statistics

#### 2. Outgoing Challenges
Shows challenges YOU sent to other players.

**Challenge Card Details:**
- **Opponent Name**: Who you challenged
- **Opponent Rating**: Their current ELO rating
- **Challenge Date**: When you issued the challenge
- **Your Message**: Message you included
- **Status**: Current challenge state
- **Match Submitted**: Indicator if match result already submitted

**Actions Available:**
- **Cancel**: Withdraw your challenge (only if PENDING)
- **Submit Match Result**: (Only if ACCEPTED and not yet submitted)
- **View Status**: See challenge history

#### 3. Create New Challenge

**Step 1: Click "Issue New Challenge" Button**

![Create Challenge Form]

**Step 2: Fill Challenge Form**
- **Select Opponent**: Dropdown list of all verified players
  - Shows player name, rating, and club
  - Cannot challenge yourself
  - Only verified players are shown
- **Challenge Message** (optional): Add a message or match details
  - Suggested format: "How about Friday 6pm at Main Hall?"
  - Maximum 500 characters

**Step 3: Send Challenge**
1. Click **"Send Challenge"**
2. Opponent receives notification
3. Challenge appears in your "Outgoing Challenges" tab
4. Status: PENDING

**Challenge Notifications:**
- You receive notifications when:
  - Your outgoing challenge is accepted/rejected
  - Someone challenges you (incoming)
  - Match result is submitted for your challenge

**Challenge Rules:**
- Cannot challenge the same person twice while a challenge is PENDING
- Can only submit match result once per challenge
- Challenge expires after 7 days (configurable by admin)
- Both players must be verified to issue challenges

---

### Match Submission

**Accessing Match Submission:**
1. From Player Dashboard: Click **"Submit Match"**
2. From Challenges: Click **"Submit Match Result"** on accepted challenge
3. From Navigation: Click **"Submit Match"**

![Submit Match Page]

**Method 1: Submit from Challenge (Recommended)**

When submitting from an accepted challenge:
- Opponent is pre-selected
- Challenge reference is automatically linked
- Faster submission process

**Method 2: Manual Submission**

**Step 1: Select Match Details**

1. **Opponent**: Select from dropdown
   - Shows all verified players
   - Displays name, rating, and club
   
2. **Match Date**: Select date played
   - Cannot be in the future
   - Defaults to today

**Step 2: Enter Game Scores**

For each game (minimum 1, maximum 7):

- **Your Score**: Enter your points (0-99)
- **Opponent Score**: Enter opponent's points (0-99)
- **Add Game**: Button to add another game
- **Remove Game**: Delete the last game

**Game Score Validation:**
- Each game must have a winner (no ties)
- Valid table tennis scores (11+ points to win)
- Must win by 2 points after 10-10

**Step 3: Match Summary**

The system automatically displays:
- **Total Games Won**: Your games vs opponent's games
- **Match Winner**: Determined by best-of format
- **Projected Rating Change**: Estimated +/- based on:
  - Your current rating
  - Opponent's rating
  - Match outcome

**Step 4: Submit Match**

1. Review all entered data
2. Click **"Submit Match Result"**
3. Confirmation dialog appears
4. Click **"Confirm"** to finalize

**After Submission:**
- Match status: PENDING_ACKNOWLEDGMENT
- Opponent receives notification
- Appears in "Pending Acknowledgments" for opponent
- You cannot edit or delete the match
- Rating not updated until acknowledged

**Submission Errors:**
- "Match already submitted": Can't submit duplicate results for same challenge
- "Invalid game scores": Check score validation rules
- "Opponent not found": Select a valid opponent
- "Future date not allowed": Match date cannot be in the future

---

### Match Acknowledgment

When an opponent submits a match result, you must acknowledge it.

**Accessing Acknowledgments:**
1. Dashboard shows count in "Pending Acknowledgments" card
2. Click card or navigate to **"Challenges"** tab
3. Look for matches with status: PENDING_ACKNOWLEDGMENT

![Match Acknowledgment]

**Acknowledgment Card Shows:**
- **Match Date**: When match was played
- **Opponent Name**: Who submitted the result
- **Game Scores**: All games with your score vs opponent score
- **Match Result**: Overall outcome (Won/Lost)
- **Your Score**: Total games you won
- **Opponent Score**: Total games opponent won
- **Rating Impact**: Projected rating change

**Actions:**

#### 1. Acknowledge (Accept)
Use when match result is accurate.

**Steps:**
1. Review all game scores carefully
2. Click **"Acknowledge"** button
3. Confirmation dialog appears
4. Click **"Confirm"**

**What Happens:**
- Match status changes to ACKNOWLEDGED
- Ratings are updated for both players
- Match appears in match history
- Cannot be changed after acknowledgment
- Both players receive confirmation

#### 2. Reject (Dispute)
Use when match result is incorrect.

**Steps:**
1. Click **"Reject"** button
2. Enter reason for rejection (required)
3. Suggested reasons:
   - "Score incorrect - should be 3-2 not 3-1"
   - "Wrong opponent listed"
   - "Date is incorrect"
   - "Match never happened"
4. Click **"Submit Rejection"**

**What Happens:**
- Match status changes to DISPUTED
- Admin receives notification
- Match sent to admin review queue
- No rating changes until resolved
- Submitter notified of rejection

**Important Notes:**
- You have 48 hours to acknowledge/reject (configurable)
- After 48 hours, auto-acknowledged by system
- Cannot acknowledge if you submitted the match
- Only opponent can acknowledge your submissions

---

## Admin Features

### Admin Dashboard

Administrators have access to comprehensive management tools.

**Accessing Admin Dashboard:**
- Login as ADMIN or SUPER_ADMIN
- If you have a player profile, click **"Admin Mode"** button in navigation

![Admin Dashboard]

**Dashboard Sections:**

#### 1. System Overview Cards
- **Total Players**: Count of all registered players
- **Active Clubs**: Number of clubs in the system
- **Pending Verifications**: Players awaiting verification
- **Disputed Matches**: Matches requiring admin review

#### 2. Recent Activity Feed
Shows latest system activities:
- New player registrations
- Match submissions
- Challenge activities
- Rating changes

#### 3. Admin Actions Menu
- **Club Management**: Create and manage clubs
- **Player Verification**: Approve/reject player accounts
- **Match Review**: Review disputed matches
- **Rating Settings**: Configure ELO system parameters
- **System Reports**: Generate statistics and reports

#### 4. Quick Links
- **Player Mode**: (If you have player profile) Switch to player dashboard
- **User Management**: Add/edit users
- **System Logs**: View application logs
- **Settings**: Configure system preferences

---

### Club Management

Clubs organize players into groups for league play and tournaments.

**Accessing Club Management:**
Admin Dashboard → **"Club Management"**

![Club Management Page]

**Club List View:**

Each club card shows:
- **Club Name**
- **Total Members**: Number of players
- **Admin**: Club administrator name
- **Status**: Active/Inactive
- **Average Rating**: Mean rating of all members
- **Actions**: Edit, Delete, View Members

**Creating a New Club:**

**Step 1: Click "Create New Club"**

![Create Club Form]

**Step 2: Fill Club Details**
- **Club Name**: Unique name (required)
- **Location**: Club address or venue
- **Description**: About the club (optional)
- **Contact Email**: Club contact information
- **Club Admin**: Select from user list (must be ADMIN role)
- **Maximum Members**: Player limit (optional, default: unlimited)

**Step 3: Submit**
1. Click **"Create Club"**
2. Confirmation message appears
3. Club added to list

**Editing a Club:**

1. Click **"Edit"** on club card
2. Update any club details
3. Click **"Save Changes"**

**Managing Club Members:**

1. Click **"View Members"** on club card

![Club Members View]

2. See list of all members with:
   - Player name
   - Current rating
   - Join date
   - Verification status
   - Win rate

**Member Actions:**
- **Remove Member**: Remove player from club
- **Transfer**: Move player to different club
- **View Profile**: See full player details

**Adding Members to Club:**

1. In Club Members view, click **"Add Member"**
2. Select player from dropdown (shows unaffiliated players)
3. Click **"Add to Club"**
4. Player receives notification

**Deleting a Club:**

1. Click **"Delete"** on club card
2. Warning message appears
3. Confirm deletion
4. **Note**: All members become unaffiliated (not deleted)

---

### Player Verification

New players must be verified by admin before participating in rated matches.

**Accessing Verification Queue:**
Admin Dashboard → **"Player Verification"** or **"Pending Verifications"** card

![Player Verification]

**Verification Queue Shows:**

For each unverified player:
- **Player Name**
- **Username**
- **Email**
- **Registration Date**
- **Requested Club**
- **Playing Style**
- **Profile Completeness**: Percentage

**Verification Actions:**

#### Verify Player

**Step 1: Review Player Information**
1. Click **"View Details"** on player card
2. Check all provided information
3. Verify identity if possible (email, club membership)

**Step 2: Approve**
1. Click **"Verify"** button
2. Confirmation dialog appears
3. Optional: Add admin note
4. Click **"Confirm Verification"**

**What Happens:**
- Player marked as VERIFIED
- Verification badge added to profile
- Player can now:
  - Issue and accept challenges
  - Have matches count toward rating
  - Appear in opponent selection lists
- Player receives verification email

#### Reject/Unverify Player

**Step 1: Select Reject**
1. Click **"Reject"** button
2. Enter reason (required):
   - "Insufficient information provided"
   - "Unable to verify identity"
   - "Invalid club membership"
   - "Duplicate account"

**Step 2: Confirm Rejection**
1. Click **"Confirm Rejection"**
2. Player receives rejection email with reason
3. Player can update profile and reapply

**Unverifying Existing Player:**
1. Search for player in verified list
2. Click **"Unverify"**
3. Enter reason (required)
4. Confirm action
5. Player's active challenges cancelled
6. New matches not allowed until re-verified

**Bulk Verification:**

For multiple players:
1. Select checkboxes on player cards
2. Click **"Verify Selected"**
3. All selected players verified simultaneously
4. Individual notifications sent

---

### Match Review

Admins review disputed matches and resolve conflicts.

**Accessing Match Review:**
Admin Dashboard → **"Match Review"** or **"Review Matches"** in navigation

![Match Review Page]

**Match Review Queue:**

Shows matches requiring review:
- **DISPUTED**: Rejected by opponent
- **PENDING_REVIEW**: Flagged by system
- **REPORTED**: Reported by users

**Match Review Card Shows:**
- **Match ID**: Unique identifier
- **Date Played**
- **Player 1**: First player name and rating
- **Player 2**: Second player name and rating
- **Submitted By**: Who submitted the result
- **Game Scores**: All games with scores
- **Match Result**: Overall winner
- **Dispute Reason**: Why match was disputed (if applicable)
- **Submission Date**: When result was submitted
- **Status**: Current state

**Review Actions:**

#### 1. Approve Match

When match result is correct:

**Step 1: Verify Details**
1. Check game scores
2. Verify players and date
3. Review any supporting evidence

**Step 2: Approve**
1. Click **"Approve"** button
2. Optional: Add admin comment
3. Click **"Confirm Approval"**

**What Happens:**
- Match status: ACKNOWLEDGED
- Ratings updated for both players
- Both players notified
- Match appears in history

#### 2. Modify Match

When scores need correction:

**Step 1: Click "Edit"**

![Edit Match Form]

**Step 2: Correct Scores**
- Update game scores
- Change winner if needed
- Add admin notes explaining changes

**Step 3: Save**
1. Click **"Save Changes"**
2. Recalculates ratings based on corrected scores
3. Both players notified of changes
4. Original scores logged for audit

#### 3. Reject Match

When match should not count:

**Step 1: Click "Reject"**
1. Select rejection reason:
   - "Insufficient evidence"
   - "Fraudulent submission"
   - "Match never occurred"
   - "Duplicate submission"
2. Enter detailed explanation

**Step 2: Confirm**
1. Click **"Confirm Rejection"**
2. Match deleted from records
3. No rating impact
4. Both players notified
5. Submitter may receive warning

**Match Filters:**
- **Status**: Filter by DISPUTED, PENDING, ACKNOWLEDGED
- **Date Range**: Show matches within date range
- **Player**: Search by player name
- **Club**: Filter by club affiliation

**Match History Log:**
- Click **"View History"** on match card
- Shows all changes:
  - Original submission
  - Disputes/rejections
  - Admin modifications
  - Final resolution

---

### Rating Settings

Configure the ELO rating system parameters.

**Accessing Rating Settings:**
Admin Dashboard → **"Rating Settings"**

![Rating Settings Page]

**Configuration Options:**

#### 1. Initial Rating
- **Default**: 1500
- **Range**: 1000-2000
- **Description**: Starting rating for new players

#### 2. K-Factor
- **Default**: 32
- **Range**: 16-64
- **Description**: Rating change multiplier
- **Higher K**: More volatile ratings (faster changes)
- **Lower K**: More stable ratings (slower changes)

**K-Factor by Rating Tier:**
You can set different K-factors for rating ranges:
- **Beginner** (< 1400): K=40 (fast improvement)
- **Intermediate** (1400-1800): K=32 (moderate change)
- **Advanced** (1800-2200): K=24 (stable ratings)
- **Expert** (2200+): K=16 (very stable)

#### 3. Rating Floor
- **Default**: 100
- **Range**: 0-1000
- **Description**: Minimum rating a player can have

#### 4. Rating Ceiling
- **Default**: 3000
- **Range**: 2500-4000
- **Description**: Maximum rating (theoretical)

#### 5. Provisional Period
- **Default**: 20 matches
- **Description**: Matches before rating is considered stable
- **Effect**: Higher K-factor during provisional period

#### 6. Bonus Points
- **Upset Win Bonus**: Extra points for beating higher-rated opponent
  - Default: 10% of rating difference
- **Streak Bonus**: Bonus for winning streaks
  - 3 wins: +5 points
  - 5 wins: +10 points
  - 10 wins: +25 points

**Applying Changes:**

1. Modify desired settings
2. Click **"Save Settings"**
3. Confirmation dialog shows affected players
4. Click **"Apply Changes"**
5. **Note**: Changes only affect new matches, not historical ratings

**Reset to Defaults:**
1. Click **"Reset to System Defaults"**
2. All settings return to recommended values
3. Confirm action

**Rating Recalculation:**

For major changes:
1. Click **"Recalculate All Ratings"**
2. **Warning**: This recalculates entire rating history
3. May take several minutes
4. All players' ratings adjusted
5. System generates report

**Preview Changes:**
Before applying, click **"Preview Impact"** to see:
- How many players affected
- Example rating changes
- Statistical distribution

---

## Dual Role Users

If you're an admin with a player profile, you can switch between roles.

**Switching to Admin Mode:**

From Player Dashboard:
1. Look for **"Admin Mode"** button in navigation bar
2. Click button
3. Redirected to Admin Dashboard
4. All admin features available

**Switching to Player Mode:**

From Admin Dashboard:
1. Look for **"Player Mode"** button in navigation bar
2. Click button
3. Redirected to Player Dashboard
4. All player features available

**Benefits:**
- Test player experience firsthand
- Participate in matches as a player
- Manage system as an admin
- Single login for both roles
- Seamless switching

**Your Statistics:**
- Player statistics independent of admin actions
- Admin actions don't affect your player rating
- Can't verify or review your own matches
- System prevents conflicts of interest

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Can't Log In

**Symptoms:** "Invalid credentials" or "User not found"

**Solutions:**
1. **Check username/password**: Ensure correct spelling, check caps lock
2. **Reset password**: Click "Forgot Password" link (if implemented)
3. **Contact admin**: Your account may need activation
4. **Browser cache**: Clear cookies and try again

#### Issue: Can't Issue Challenges

**Symptoms:** "You are not verified" or opponent list empty

**Solutions:**
1. **Verification required**: Wait for admin to verify your account
2. **No opponents available**: Other players may be unverified
3. **Duplicate challenge**: Can't challenge same person twice while pending
4. **Check club**: Ensure you're in a club (if required)

#### Issue: Match Result Not Saving

**Symptoms:** Error message or form doesn't submit

**Solutions:**
1. **Validate scores**: Check all game scores are valid (11+ to win)
2. **Check date**: Date cannot be in future
3. **Opponent selected**: Ensure opponent is chosen
4. **Browser console**: Check for JavaScript errors
5. **Try again**: Refresh page and resubmit

#### Issue: Acknowledgment Not Showing

**Symptoms:** Can't see match to acknowledge

**Solutions:**
1. **Check status**: Match must be PENDING_ACKNOWLEDGMENT
2. **Refresh page**: Click refresh or reload browser
3. **Correct user**: Ensure you're logged in as the opponent
4. **Time delay**: Allow a few seconds for system to update
5. **Already acknowledged**: Check if you already confirmed

#### Issue: Rating Not Updating

**Symptoms:** Rating stays same after match

**Solutions:**
1. **Match acknowledgment**: Both players must acknowledge
2. **Admin review**: Disputed matches don't update ratings
3. **Verification**: Unverified players don't get rated
4. **System lag**: Ratings may take a few minutes to update
5. **Check history**: Verify match appears as ACKNOWLEDGED

#### Issue: Can't Switch to Admin Mode

**Symptoms:** "Admin Mode" button not visible

**Solutions:**
1. **Check role**: You must have ADMIN or SUPER_ADMIN role
2. **Player profile exists**: Admins need a player profile to see player mode
3. **Refresh login**: Log out and log back in
4. **Contact support**: Your account may need configuration

#### Issue: Grafana Dashboards Not Loading

**Symptoms:** Blank dashboards or "No data"

**Solutions:**
1. **Check services**: Ensure all Docker containers running: `docker-compose ps`
2. **Verify datasources**: Go to Configuration → Data Sources in Grafana
3. **Prometheus scraping**: Check Prometheus at `http://localhost:9090/targets`
4. **Wait for data**: New installation needs ~5 minutes for metrics to appear
5. **Check logs**: Run `docker logs rispo-app` for errors

---

## System Access URLs

### Application
- **Main Application**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health

### Observability (Monitoring)
- **Grafana Dashboards**: http://localhost:3000 (admin/admin)
- **Prometheus Metrics**: http://localhost:9090
- **Loki Logs**: http://localhost:3100
- **Tempo Traces**: http://localhost:3200
- **RabbitMQ Management**: http://localhost:15672 (rispo_admin/R!#po123##)

---

## Best Practices

### For Players
1. **Verify information**: Always double-check match scores before submission
2. **Timely acknowledgment**: Acknowledge matches within 24 hours
3. **Clear challenges**: Accept or reject challenges promptly
4. **Profile updates**: Keep contact info and playing style current
5. **Sportsmanship**: Use challenge messages professionally

### For Admins
1. **Prompt verification**: Review player applications within 48 hours
2. **Match disputes**: Investigate disputes thoroughly before ruling
3. **Regular backups**: Ensure system data is backed up
4. **Monitor metrics**: Check Grafana dashboards weekly
5. **Communication**: Notify players of policy changes

---

## Keyboard Shortcuts

### Navigation
- `Alt + H`: Home/Dashboard
- `Alt + P`: Profile
- `Alt + C`: Challenges
- `Alt + M`: Submit Match
- `Alt + L`: Logout

### Forms
- `Ctrl + Enter`: Submit current form
- `Esc`: Cancel/Close modal
- `Tab`: Navigate between fields

---

## Support and Contact

### Getting Help
1. **In-app help**: Click "?" icon for context-sensitive help
2. **User guide**: Reference this document
3. **Admin support**: Contact your club admin
4. **Technical issues**: Check application logs

### Reporting Bugs
1. Note what you were doing when issue occurred
2. Take screenshot if possible
3. Check browser console for errors (F12)
4. Report to system administrator with details

---

## Appendix

### Glossary

**ELO Rating**: Mathematical rating system for calculating relative skill levels

**K-Factor**: Determines maximum rating change per match

**Provisional Period**: Initial matches where rating is less stable

**Verification**: Admin approval process for new players

**Acknowledgment**: Opponent confirmation of match result

**Challenge**: Formal request for a match between two players

**Dispute**: Rejection of a submitted match result

**Club**: Group of players organized together

---

### Version History

**Version 1.0** (November 2025)
- Initial release
- Player registration and profiles
- Challenge system
- Match submission and acknowledgment
- Admin dashboard and management tools
- ELO rating system
- OpenTelemetry observability stack
- Redis caching
- RabbitMQ message queue

---

### Screenshots Note

*Note: This guide references screenshots marked as [Screenshot Name]. To capture actual screenshots:*

1. Start the application: `docker-compose up -d`
2. Navigate to each page described
3. Take screenshots using print screen or snipping tool
4. Save with descriptive names matching guide references
5. Store in `/docs/screenshots/` directory

---

**End of User Guide**

For technical documentation, see: `telemetry/README.md`  
For setup instructions, see: `README.md`
