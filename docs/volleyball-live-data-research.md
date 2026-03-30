# Volleyball Live Data Research for Cyprus (OPAP League / KOPE)

Research date: 2026-03-23

## Goal

Find a real-time live score data source for Cyprus volleyball matches (similar to FotMob for football), covering Nea Salamina in the OPAP Championship (men's and women's leagues).

## Sources Investigated

### 1. DataProject (kop-web.dataproject.com) — Already Integrated

- **Coverage**: Official data platform used by KOPE (Cyprus Volleyball Federation)
  - Cyprus League Men (ID=42, PID=71 preliminary, PID=81 playoffs)
  - Cyprus League Women (ID=43, PID=72)
  - OPAP Cup Men/Women, OPAP Super Cup Women
- **API**: No REST API. ASP.NET with Telerik controls, server-side rendering, `__doPostBack` mechanisms. All data is embedded in rendered HTML.
- **Live data**: Has a `LiveScore.aspx` page but it showed "No matches scheduled" when tested (no match was in progress). No WebSocket infrastructure detected. Live scoring may work during active matches via page polling/refresh. **Needs testing during an actual match.**
- **Data depth**: Excellent — set scores (e.g., "25/15 25/23 25/21"), individual player statistics (points, attacks, blocks, serves), standings, head-to-head matrices.
- **Nea Salamina**: Fully covered (scraper already filters for "NEA SALAMINA").
- **Key URLs**:
  - Match list: `CompetitionMatches.aspx?ID=42&PID=71`
  - Match stats: `MatchStatistics.aspx?mID={id}&ID={compId}&CID={cid}&PID={pid}`
  - Live score: `LiveScore.aspx`
- **Feasibility**: Already being scraped via Cheerio in `app/scripts/scraper/dataproject-enrichment.ts`. If LiveScore.aspx works during matches, this is the easiest integration path.

### 2. API-Sports Volleyball API (api-sports.io)

- **Coverage**: Dedicated volleyball API at `v1.volleyball.api-sports.io`
- **API**: Yes, proper REST API with endpoints for leagues, teams, games, standings. Requires API key.
- **Live data**: Likely yes (API-Sports is known for live data across sports).
- **Data depth**: Unknown for Cyprus specifically — needs verification.
- **Pricing**: Free tier (100 requests/day), paid plans available.
- **Nea Salamina**: Needs verification — test `/leagues?country=Cyprus` after signup.
- **Action needed**: Sign up for free account and test Cyprus coverage.
- **Feasibility**: Most promising official API option — cleanest integration if Cyprus is covered.

### 3. FlashScore / FlashLive API (flashscore.com / RapidAPI)

- **Coverage**: Covers Cyprus volleyball under "OPAP Championship" (tournament ID: `EBoYeJOm`, sport ID: 12, country ID: 61). Has 2025/2026 season with Results, Fixtures, Standings.
- **API**: No official public API. Internal data feeds (`d.flashscore.com/x/feed/...`) require browser-like headers. **FlashLive API on RapidAPI** (`flashlive-sports.p.rapidapi.com`) is the official paid route.
- **Live data**: Yes — live scores with set-by-set breakdown (core feature of FlashScore).
- **Data depth**: Match results with set scores, standings. No detailed player stats.
- **Nea Salamina**: Should be listed (league has 6-8 teams).
- **Feasibility**: Viable via FlashLive paid API. Scraping the website is technically possible but legally restricted.

### 4. SofaScore (sofascore.com)

- **Coverage**: Has Cyprus volleyball — tournament ID `8670` ("Cyprus League Men"), Nea Salamina team ID `218685`.
- **API**: Well-structured REST API at `api.sofascore.com/api/v1/` with endpoints like `/unique-tournament/{id}/seasons`, `/team/{id}/events/last/0`. **All requests return 403 Forbidden** — actively blocks non-browser access.
- **Live data**: Yes — live scores with set-by-set breakdown during matches.
- **Data depth**: Match results, set scores, standings, head-to-head. Some player lineups for bigger leagues (uncertain for Cyprus).
- **Key IDs**: Tournament `8670`, Nea Salamina team `218685`.
- **Feasibility**: Difficult — API access restricted. Mobile app API may have different access controls.

### 5. Cyprus Volleyball Federation (volleyball.org.cy)

- **Coverage**: Official KOPE website, WordPress-based with SportPress plugin.
- **API**: No public API. WordPress AJAX endpoints like `?ajax_post=17958` for fixture data (already used by scraper).
- **Live data**: No — publishes results after matches only.
- **Data depth**: Match results, schedules, basic standings. No detailed player stats.
- **Nea Salamina**: Covered (filtered by "ΝΕΑ ΣΑΛΑΜΙΝΑ").
- **Feasibility**: Already integrated for fixture scraping.

### 6. Volleybox (volleybox.net)

- **Coverage**: Has Cyprus men's volleyball ("Cyprus Men's First Division", league ID d197).
- **API**: No public API. Community-driven volleyball database.
- **Live data**: No — results-oriented only.
- **Data depth**: Season results, team rosters, player profiles, transfer history.
- **Feasibility**: Not useful for live data. Good for historical/roster data.

### 7. BetExplorer (betexplorer.com)

- **Coverage**: Covers OPAP Championship from 2009/2010 through 2025/2026.
- **API**: No public API.
- **Live data**: Partial — odds and some live score tracking (betting-focused).
- **Data depth**: Match results, odds history, league tables. No player stats or set scores confirmed.
- **Feasibility**: Scraping only, ToS likely prohibits it.

### 8. LiveScore.in / LiveScore.com

- **Coverage**: Lists OPAP Championship under Cyprus volleyball. Has `stats_live_enable = 1` flag.
- **API**: Public API at `prod-public-api.livescore.com` but Cyprus volleyball endpoint returned 404.
- **Live data**: Likely yes during matches.
- **Data depth**: Basic scores only.
- **Feasibility**: Not reliable enough for Cyprus volleyball.

### 9. Volleyball World / FIVB (volleyballworld.com)

- **Coverage**: International FIVB competitions only. API at `/api/v1/globalschedule/`.
- **Live data**: Yes, for international matches.
- **Nea Salamina**: Not covered — domestic leagues outside FIVB scope.
- **Feasibility**: Not useful.

### 10. CEV (cev.eu)

- **Coverage**: European club competitions (Champions League, CEV Cup) only.
- **Feasibility**: Not useful unless Nea Salamina qualifies for European competitions.

### 11. Sportradar

- **Coverage**: Major commercial provider. Covers volleyball including smaller leagues.
- **API**: Enterprise-grade pricing (thousands $/month). FlashScore and SofaScore source from Sportradar.
- **Feasibility**: Too expensive.

## Summary Table

| Source | API? | Live Scores? | Cyprus Coverage | Data Depth | Cost |
|--------|------|-------------|-----------------|------------|------|
| **DataProject** | No (HTML scraping) | Maybe (LiveScore.aspx untested) | Full | Excellent (sets, player stats) | Free |
| **API-Sports** | Yes (REST) | Likely | Needs verification | Unknown | Free tier (100 req/day) |
| **FlashScore/FlashLive** | Paid (RapidAPI) | Yes | Yes (OPAP Champ.) | Sets, standings | Paid |
| **SofaScore** | Blocked (403) | Yes | Yes (team 218685) | Sets, standings | N/A (blocked) |
| **volleyball.org.cy** | No (WordPress AJAX) | No | Full | Basic results | Free |
| **Volleybox** | No | No | Yes | Historical/roster | Free |
| **BetExplorer** | No | Partial | Yes | Odds + results | Free |
| **LiveScore** | Unreliable | Yes | Partial | Basic scores | Free |

## Recommendations (Priority Order)

### 1. Test DataProject LiveScore.aspx During a Live Match (Immediate)

Since we already scrape DataProject, testing `LiveScore.aspx` during an actual match is the fastest path. If it serves real-time set/point data, we can build a proxy (Back4App Cloud Function or Cloudflare Worker) to poll it and expose the data to the client.

**Next match opportunities:**
- March 20 — Volleyball Men vs ΑΝΟΡΘΩΣΙΣ (Cup, 20:30, Αγίου Αθανασίου)
- March 21 — Volleyball Women vs ΑΝΟΡΘΩΣΙΣ (18:00, Γυμνάσιο Αγίου Νεοφύτου)
- March 27 — Volleyball Men vs ΑΝΟΡΘΩΣΙΣ (Cup, 20:30, away)

### 2. Verify API-Sports Cyprus Coverage (Quick Check)

Sign up for a free account at [api-sports.io](https://api-sports.io) and test:
```
GET https://v1.volleyball.api-sports.io/leagues?country=Cyprus
```
If Cyprus OPAP Championship is listed, this becomes the cleanest solution with proper REST API, similar to how FotMob works for football.

### 3. Evaluate FlashLive API (Paid Fallback)

If neither DataProject nor API-Sports work, the FlashLive API on RapidAPI is the most reliable option. Test with tournament ID `EBoYeJOm` for OPAP Championship.

## Implementation Architecture (Once Source is Chosen)

Regardless of the data source, the implementation pattern would be:

1. **Server-side proxy** (Back4App Cloud Function or Cloudflare Worker) to avoid CORS and scraping from the browser
2. **Client-side hook** (`useVolleyballLive`) that polls during match hours, similar to `fotmob.ts` FotMob integration
3. **Smart polling**: Only active within a time window around scheduled matches (e.g., match time -15min to +3 hours), poll every 30-60 seconds
4. **No GitHub Actions needed** for live data — Actions should only be used for the periodic full scraper (every 6 hours)
