# Competitor Analysis: Red Rebels Calendar vs FotMob

## Executive Summary

This analysis compares the Red Rebels Calendar app with FotMob's team statistics page for Nea Salamis, identifying feature gaps and opportunities for improvement. It also evaluates free APIs that could replace or supplement the current CFA scraper.

---

## Feature Comparison Matrix

| Feature | Red Rebels Calendar | FotMob | Gap |
|---------|---------------------|--------|-----|
| **Team Info** |
| Team logo & branding | ✅ | ✅ | - |
| Stadium info (name, capacity, location) | ✅ Via API | ✅ | - |
| Country/league info | ✅ | ✅ | - |
| **Fixtures & Results** |
| Match calendar view | ✅ Monthly grid | ✅ List view | Different UX |
| Past results with scores | ✅ | ✅ | - |
| Upcoming fixtures | ✅ | ✅ | - |
| Kickoff times | ⚠️ Scores only for played | ✅ Full times | **Gap** |
| Match venue | ⚠️ Partial | ✅ | **Gap** |
| Calendar sync (ICS export) | ✅ | ✅ | - |
| **Statistics** |
| Overall record (W/D/L) | ✅ | ✅ | - |
| Goals scored/conceded | ✅ | ✅ | - |
| Goal difference | ✅ | ✅ | - |
| Points | ✅ | ✅ | - |
| Win percentage | ✅ | ✅ | - |
| Home vs Away split | ✅ | ✅ | - |
| Recent form guide | ✅ Last 5 | ✅ Last 5+ | - |
| Head-to-head records | ✅ | ✅ | - |
| Clean sheets | ❌ | ✅ | **Gap** |
| Average goals per game | ❌ | ✅ | **Gap** |
| First/second half goals | ❌ | ✅ | **Gap** |
| Scoring/conceding by time period | ❌ | ✅ | **Gap** |
| **League Table** |
| Current standings | ✅ Via FotMob API | ✅ | - |
| Full table with all teams | ✅ | ✅ | - |
| Promotion/relegation zones | ❌ | ✅ | **Gap** |
| **Player Data** |
| Top scorers | ❌ | ✅ | **Gap** |
| Top assists | ❌ | ✅ | **Gap** |
| Squad list | ❌ | ✅ | **Gap** |
| Player ratings | ❌ | ✅ | **Gap** |
| Market values | ❌ | ✅ | **Gap** |
| Yellow/red cards | ❌ | ✅ | **Gap** |
| **Multi-Sport Support** |
| Football | ✅ | ✅ | - |
| Volleyball | ✅ Men + Women | ❌ | **Advantage** |
| Meetings/Events | ✅ | ❌ | **Advantage** |
| **UX Features** |
| Dark/Light theme | ✅ | ✅ | - |
| Multi-language (EN/GR) | ✅ | ✅ 40+ languages | FotMob wider |
| PWA/Mobile app | ✅ PWA | ✅ Native apps | FotMob better |
| Countdown timers | ✅ | ❌ | **Advantage** |
| Filter by sport/location/status | ✅ | ❌ | **Advantage** |
| Print layout | ✅ | ❌ | **Advantage** |
| Offline support | ⚠️ Static data | ✅ | **Gap** |

---

## Red Rebels Calendar Advantages

### 1. Multi-Sport Calendar
- Unified view of Football, Volleyball (Men & Women), and team meetings
- FotMob only covers football

### 2. Calendar-Focused UX
- Monthly grid view optimized for planning
- Countdown timers for upcoming matches
- ICS export for calendar integration
- Print-optimized layout

### 3. Advanced Filtering
- Filter by sport, location (home/away), status (played/upcoming)
- Search by opponent name
- FotMob has limited filtering options

### 4. Local/Community Focus
- Tailored for Nea Salamis supporters
- Greek language support
- Local branding and colors

---

## FotMob Advantages (Feature Gaps to Address)

### 1. Player Statistics
**Priority: HIGH**
- Top scorers and assist leaders
- Player ratings per match
- Squad information
- Yellow/red card tracking
- Market values

### 2. Advanced Match Statistics
**Priority: MEDIUM**
- Goals by time period (0-15', 16-30', etc.)
- First half vs second half performance
- Clean sheets tracking
- Average goals per game

### 3. Real-Time Data
**Priority: MEDIUM**
- Live scores during matches
- Real-time league table updates
- Push notifications

### 4. Historical Data
**Priority: LOW**
- Season-by-season archives
- Transfer history
- Historical head-to-head

---

## Free API Alternatives

### 1. Live-Score API ⭐ Recommended
**Website:** https://live-score-api.com

| Aspect | Details |
|--------|---------|
| Cyprus Coverage | ✅ 1st Division, **2nd Division**, 3rd Division, Cup, Super Cup |
| Data Available | Fixtures, results, standings, match events, lineups |
| Free Tier | Limited requests (check pricing page) |
| Format | JSON API |

**Pros:**
- Explicitly covers Cyprus 2nd Division (Competition ID: 144)
- Real-time scores and events
- Match lineups available

**Cons:**
- Free tier limitations unclear
- May require paid plan for full access

### 2. API-Football
**Website:** https://www.api-football.com

| Aspect | Details |
|--------|---------|
| Coverage | 1,200+ leagues worldwide |
| Free Tier | 50 requests/day |
| Data | Fixtures, standings, events, lineups, players, statistics |

**Pros:**
- Comprehensive data including player stats
- Well-documented API
- Wide coverage

**Cons:**
- Cyprus 2nd Division coverage needs verification
- 50 requests/day may be limiting

### 3. Football-Data.org
**Website:** https://www.football-data.org

| Aspect | Details |
|--------|---------|
| Cyprus Coverage | ❌ Not covered in free tier |
| Free Tier | 10 requests/minute, 12 major leagues only |

**Not recommended** - No Cyprus league coverage in free tier.

### 4. Statorium
**Website:** https://statorium.com

| Aspect | Details |
|--------|---------|
| Cyprus Coverage | ✅ 1st Division, 2nd Division, Cup, Super Cup |
| Data | Fixtures, results, standings |

**Pros:**
- Covers Cyprus 2nd Division
- Football-focused

**Cons:**
- Limited documentation
- Pricing unclear

### 5. Current Approach: CFA Scraper + FotMob API
**Status:** Currently implemented

| Aspect | Details |
|--------|---------|
| CFA Scraper | Fixtures, results (no player stats) |
| FotMob API | League table, stadium info, fixtures |

**Pros:**
- Free (no API costs)
- Direct from official source (CFA)
- Already working

**Cons:**
- Fragile (website structure changes break scraper)
- No player statistics
- No real-time updates
- Relies on unofficial FotMob API

---

## Recommended Improvements

### Phase 1: Quick Wins (Low Effort)
1. **Add clean sheets tracking** - Calculate from existing score data
2. **Add average goals per game** - Calculate from existing data
3. **Add goals conceded tracking** - Already have data, just display it
4. **Improve time display** - Show TBD for matches without kickoff times

### Phase 2: Enhanced Statistics (Medium Effort)
1. **Goal distribution by match** - Visual chart showing goals per game
2. **Form streak tracking** - Current winning/unbeaten streak
3. **Best/worst results** - Biggest win, heaviest defeat
4. **Season progress chart** - Points accumulation over time

### Phase 3: API Integration (Higher Effort)
1. **Evaluate Live-Score API** for Cyprus 2nd Division
   - Test free tier limits
   - Compare data quality with CFA scraper
   - Assess player statistics availability

2. **Hybrid approach:**
   - Keep CFA scraper as primary (free, official)
   - Use API for supplementary data (player stats, real-time)
   - FotMob API for league table (already working)

### Phase 4: Player Statistics (Requires API)
1. **Top scorers widget** on stats page
2. **Squad page** with player list
3. **Player cards** with basic stats

---

## Data Sources Summary

| Data Type | Current Source | Alternative |
|-----------|---------------|-------------|
| Fixtures/Results | CFA Scraper | Live-Score API |
| League Table | FotMob API | Live-Score API |
| Stadium Info | FotMob API | Static data |
| Player Stats | ❌ None | API-Football or Live-Score API |
| Volleyball | Manual entry | None available |

---

## Conclusion

The Red Rebels Calendar has a **unique value proposition** as a multi-sport, calendar-focused app with filtering capabilities that FotMob doesn't offer. The main gaps are:

1. **Player statistics** - Requires API integration
2. **Advanced match stats** - Partially achievable with current data
3. **Real-time updates** - Requires API with live data

**Recommended strategy:**
1. Maximize value from current data (clean sheets, averages, streaks)
2. Evaluate Live-Score API for Cyprus 2nd Division coverage
3. Consider hybrid approach: scraper + API for comprehensive data
4. Maintain multi-sport advantage as differentiator

---

## Resources

- [FotMob Nea Salamis Page](https://www.fotmob.com/teams/8590/overview/nea-salamis)
- [Live-Score API - Cyprus](https://live-score-api.com/leagues/league/49/Cyprus)
- [API-Football](https://www.api-football.com/)
- [Football-Data.org](https://www.football-data.org/)
- [Statorium Coverage](https://statorium.com/soccer-api-leagues-coverage)
- [CFA Cyprus](https://cfa.com.cy/) - Current scraper source
