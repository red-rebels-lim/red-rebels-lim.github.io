---
name: bump-season-year
description: |
  Roll the calendar over to the next season (annual, mechanical — needs NO external IDs). Use when:
  - User says "bump the season", "new season", "roll to 27/28"
  - The pre-season friendlies are being announced and last season's data should reset
  Does NOT wire the scraper to the new season's sources — that is `gather-season-schedule`.
---

# Bump Season Year Skill

The season window is **July → June** (changed from Sept–Aug for 26/27, so pre-season
friendlies belong to the season they precede). This skill is the *mechanical* half of the
rollover: constants, labels, events reset, zero-state stats. It is runnable the day the
first friendly is announced — no external competition IDs needed. The scraper half
(CFA/volleyball/DataProject IDs, first scrape) is the separate `gather-season-schedule`
skill, typically run weeks later when the sites publish.

## Arguments

- `START_YEAR` (required): the new season's start year (e.g. `2027` for 2027/28).
  July–December belong to START_YEAR; January–June to START_YEAR + 1.

## When NOT to Use

- Last season's final matches (incl. cup finals, ~May) haven't been played — the reset
  wipes them from the live calendar.
- You want to change scraper URLs / competition IDs → `gather-season-schedule`.

## Workflow

### Step 1: Season constants and labels

| File | Edit |
|---|---|
| `app/src/data/constants.ts` | `SEASON_START_YEAR` / `SEASON_END_YEAR` |
| `app/index.html` | `<title>Red Rebels Calendar YY/YY</title>` |
| `app/src/i18n/{en,el}.json` | `brandText: "Red Rebels YY/YY"` |
| `flutter/lib/data/constants.dart` | `seasonStartYear`, `seasonEndYear`, `seasonLabel` |

The `.ics` calendar name and download filename derive from `constants.ts` — no edit.
The reminder cron regex-parses `SEASON_*_YEAR` from `constants.ts` at runtime — keep the
exact `export const SEASON_START_YEAR = NNNN;` shape or all reminders silently die.

### Step 2: Verify the July→June month mapping (should already hold)

One-time migration done for 26/27 — verify, don't re-edit. July–Dec must map to
START_YEAR, Jan–June to END_YEAR, in ALL of:

- `app/src/data/month-config.ts` — `MONTH_ORDER` starts `'july'`; the year map.
- `app/src/hooks/useCalendar.ts` — the fallback month is `'july'` (was `'september'`).
- `.github/scripts/send-reminders.js` — `seasonYearByMonth` month→year table.
- `app/scripts/scraper/index.ts` — `isEventInPast` year boundary (`monthNum >= 7`),
  and `allMonths` in `updateCalendarData` ordered july…june.
- `flutter/lib/data/constants.dart` — `monthOrder` and `monthInfo` (`month >= 7`).

If any still shows a September-start pattern, fix it and add a regression test.

### Step 3: Reset events.ts — but keep the new season's friendlies

`events.ts` is generated data; last season is preserved in git history (no file archive).
Keep any month buckets that already hold the NEW season's events (pre-season friendlies
live in `july`/`august`), wipe the rest to `[]`. Don't scaffold empty buckets beyond the
12 keys — the scraper fills them.

Bootstrap note: on the first scrape after a near-empty file the scraper suppresses
`added` entries in `changes.json`, so subscribers don't get one push per fixture.

### Step 4: Zero-state stats (FotMob-style)

With no played matches, stats must render **zeroed tables** (0 W/D/L, 0-0 GD), not
"no data" placeholders — decided by the stakeholder 2026-07-17, mirroring FotMob's
season-start look. Season Summary and Performance Split render zeros; list sections
(Recent Form, Top Scorers, Goal Distribution) keep graceful empty states. Applies to all
three sport tabs, web and Flutter. If a component breaks on empty data, fix it as part of
the bump and cover it with a test.

### Step 5: Promotion/relegation-sensitive strings (ask, don't guess)

Only when the team changed division (confirm with the stakeholder):

- `app/src/i18n/{en,el}.json#popover.competition` — e.g. "Cyprus 1st Division" /
  "Κύπρος Α' Κατηγορία" (26/27 values; Greek copy needs stakeholder sign-off).
- `#fotmob.leagues` — FotMob sends a new league name key after a division change;
  add its Greek translation when it first appears.
- `lib/fotmob.ts` is team-scoped (`teams?id=`) — standings follow the team automatically.

### Step 6: Squad & translate maps

Squad turnover is its own flow (see the 2026-07-17 session: Transfermarkt squad +
transfers pages → departures get `active: false`, never deleted; new players get entries
+ portraits). Don't delete `GREEK_TO_PLAYER_KEY` entries — old fixtures reference them.

### Step 7: Verify and ship

```bash
cd app && npm run lint && npm test && npm run build
cd ../flutter && node tool/generate_events_json.mjs && node tool/generate_players_json.mjs
flutter analyze && flutter test
```

Tests that assert non-empty stats will need their premises updated to the zero-state
(see Step 4). Spot-check the dev server (`npm run dev`) for: friendlies present under
July/August, stats page zeroed, calendar navigation starting at July. Ship a new Flutter
release so installed apps pick up the season — the bundled assets are compile-time copies.

## Common Mistakes

- Bumping constants but leaving September-start month math somewhere (step 2 list) —
  events silently shift a year.
- Wiping the friendlies in the events reset — they are the new season's data.
- Editing `constants.ts` into a shape the cron regex can't parse — reminders die silently.
- Forgetting the Flutter release: web updates instantly, installed apps stay frozen.
- Doing scraper URLs "while you're at it" with guessed IDs — that's the other skill,
  and invented IDs return empty 200s that look like success.
