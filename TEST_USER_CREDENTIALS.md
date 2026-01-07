# Test User Credentials

This document contains login credentials for all test users created by the migration `V10__test_data_users_and_players.sql`.

> ⚠️ **WARNING**: These credentials are for development/testing purposes only. Do NOT use in production!

---

## 🔐 Default Password for ALL Users

```
Password: 1234
```

---

## 👑 Super Users

| Username | Email | Role | Club | Player Profile |
|----------|-------|------|------|----------------|
| `superuser1` | superuser1@rispo.test | SUPER_USER | None | ✅ Yes |
| `superuser2` | superuser2@rispo.test | SUPER_USER | None | ✅ Yes |

**Capabilities:**
- Full system access
- Can verify any player
- Can manage all clubs
- Can create/manage tournaments
- Can review all matches

---

## ⭐ Rating Admins

| Username | Email | Role | Club | Player Profile |
|----------|-------|------|------|----------------|
| `ratingadmin1` | ratingadmin1@rispo.test | RATING_ADMIN | None | ✅ Yes |
| `ratingadmin2` | ratingadmin2@rispo.test | RATING_ADMIN | None | ✅ Yes |

**Capabilities:**
- Can verify players (own club + unaffiliated)
- Can review matches
- Can manage rating settings
- Has player profile

---

## 🏛️ Club Admins

| Username | Email | Role | Club | Player Profile |
|----------|-------|------|------|----------------|
| `clubadmin1` | clubadmin1@rispo.test | CLUB_ADMIN | Eagles Pool Club | ✅ Yes |
| `clubadmin2` | clubadmin2@rispo.test | CLUB_ADMIN | Sharks Cue Sports | ✅ Yes |

**Capabilities:**
- Can verify players (own club only)
- Can review matches (involving club members)
- Can manage club settings
- Can manage club tournaments
- Has player profile

---

## 🏆 Clubs

| Club Name | City | Suburb | Admin |
|-----------|------|--------|-------|
| Eagles Pool Club | Johannesburg | Sandton | clubadmin1 |
| Sharks Cue Sports | Cape Town | Sea Point | clubadmin2 |

---

## 🎱 Eagles Pool Club Players (10 players)

| Username | Player Name | Email | Rating | Verified |
|----------|-------------|-------|--------|----------|
| `eagle_player1` | John Eagle | eagle1@rispo.test | 1200 | ✅ |
| `eagle_player2` | Peter Wings | eagle2@rispo.test | 1200 | ✅ |
| `eagle_player3` | Michael Talon | eagle3@rispo.test | 1200 | ✅ |
| `eagle_player4` | David Feather | eagle4@rispo.test | 1200 | ✅ |
| `eagle_player5` | James Soar | eagle5@rispo.test | 1200 | ✅ |
| `eagle_player6` | Robert Nest | eagle6@rispo.test | 1200 | ✅ |
| `eagle_player7` | William Sky | eagle7@rispo.test | 1200 | ✅ |
| `eagle_player8` | Thomas Beak | eagle8@rispo.test | 1200 | ✅ |
| `eagle_player9` | Charles Flight | eagle9@rispo.test | 1200 | ✅ |
| `eagle_player10` | Daniel Swoop | eagle10@rispo.test | 1200 | ✅ |

---

## 🦈 Sharks Cue Sports Players (10 players)

| Username | Player Name | Email | Rating | Verified |
|----------|-------------|-------|--------|----------|
| `shark_player1` | Andrew Fin | shark1@rispo.test | 1200 | ✅ |
| `shark_player2` | Chris Wave | shark2@rispo.test | 1200 | ✅ |
| `shark_player3` | Mark Tide | shark3@rispo.test | 1200 | ✅ |
| `shark_player4` | Steven Deep | shark4@rispo.test | 1200 | ✅ |
| `shark_player5` | Paul Ocean | shark5@rispo.test | 1200 | ✅ |
| `shark_player6` | Kevin Reef | shark6@rispo.test | 1200 | ✅ |
| `shark_player7` | Brian Current | shark7@rispo.test | 1200 | ✅ |
| `shark_player8` | Jason Coral | shark8@rispo.test | 1200 | ✅ |
| `shark_player9` | Eric Shore | shark9@rispo.test | 1200 | ✅ |
| `shark_player10` | Ryan Splash | shark10@rispo.test | 1200 | ✅ |

---

## 📊 Summary

| Category | Count |
|----------|-------|
| Super Users | 2 |
| Rating Admins | 2 |
| Club Admins | 2 |
| Clubs | 2 |
| Regular Players | 20 |
| **Total Users** | **26** |
| **Total Player Profiles** | **26** |

---

## 🧪 Testing Scenarios

### Quick Login Tests
1. **Super User Access**: Login as `superuser1` / `1234`
2. **Club Admin Access**: Login as `clubadmin1` / `1234`
3. **Rating Admin Access**: Login as `ratingadmin1` / `1234`
4. **Player Access**: Login as `eagle_player1` / `1234`

### Cross-Club Testing
- Eagles Club players: `eagle_player1` through `eagle_player10`
- Sharks Club players: `shark_player1` through `shark_player10`

### Tournament Testing
- All 26 player profiles are verified and ready for tournament registration
- Initial rating of 1200 for all players ensures balanced matchmaking
