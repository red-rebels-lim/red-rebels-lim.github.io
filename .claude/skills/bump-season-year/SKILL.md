---
name: bump-season-year
description: |
  Roll the calendar over to the next season (annual). Use when:
  - User says "bump the season", "new season", "roll to 26/27"
  - It's late summer and the upcoming Cyprus football/volleyball season needs scaffolding
  - SEASON_END_YEAR has passed and the codebase still references the old year
---

# Bump Season Year Skill

Cyprus football + volleyball seasons run September–April/May. Each annual rollover requires touching multiple unrelated files: season constants, scraper URLs, competition IDs, and the events file itself. Forgetting any one place produces invisible failures (scraper writes nothing, calendar shows last season's data, FotMob `nextMatch` returns null).

## Arguments

- `START_YEAR` (required): The new season's start year (e.g. `2026` for the 2026/27 season).
- `END_YEAR` (optional): Defaults to `START_YEAR + 1`.

## When NOT to Use

- A single competition's URL changed mid-season (e.g. CFA migrated the championship-phase fixture page). That's a focused edit on `scripts/scraper/index.ts:48-51`, not a full rollover.
- The user wants to *archive* the previous season. This skill prepares for the new season; archiving is a separate task.

## Workflow

### Step 1: Gather the season's external IDs

This is the human-input-required step. Before touching code, the user must supply:

| ID | Source | How to find |
|---|---|---|
| CFA preliminary-phase fixture URL | cfa.com.cy | Browse the league fixtures page; URL ends in a numeric ID like `/Gr/fixtures/65409603` |
| CFA championship-phase fixture URL | cfa.com.cy | Often only published mid-season — placeholder it and update later |
| Volleyball men `ajax_post=` ID | volleyball.org.cy | Inspect network tab on the all-programs page |
| Volleyball women `ajax_post=` ID | volleyball.org.cy | Same as above |
| DataProject men league `ID` + `PID` (one or two) | kop-web.dataproject.com | URL pattern `CompetitionMatches.aspx?ID=<>&PID=<>` |
| DataProject women league `ID` + `PID` | kop-web.dataproject.com | Same pattern |
| DataProject men cup `ID` + `PID` for QF + SF | kop-web.dataproject.com | Cup pages, separate competition ID |
| DataProject women cup `ID` + `PID` for QF + SF | kop-web.dataproject.com | Cup pages, separate competition ID |

**If any ID isn't yet published, stop and ask.** Don't guess — invented IDs return 200 with empty HTML and the scraper silently writes nothing.

### Step 2: Update season constants

`app/src/data/constants.ts`:

```ts
export const SEASON_START_YEAR = <START_YEAR>;
export const SEASON_END_YEAR = <END_YEAR>;
```

These flow into `month-config.ts` (Sept–Dec → start year, Jan–Aug → end year), `ics-core.ts` (calendar name `Red Rebels Events YY/YY`), and FotMob caching.

### Step 3: Update scraper URLs and IDs

`app/scripts/scraper/index.ts`:

- `CFA_URLS` (line ~48): two strings.
- `VOLLEYBALL_URLS` (line ~53): two strings keyed by sport.
- `DATAPROJECT_URLS` (line ~58): values may be a string or string[] (men's league has two PIDs).
- `DATAPROJECT_CUP_URLS` (line ~67): always string[] for QF + SF.

Don't reorder; the scraper iterates these in declared order and later sources overwrite earlier ones for the same date+opponent.

### Step 4: Reset events.ts

Two options, depending on what the user wants:

1. **Archive previous season:** copy `app/src/data/events.ts` to a sibling backup outside the repo (the file is too large to keep tracked alongside the live one, and the scraper will overwrite). Then reset:

   ```ts
   export const eventsData: EventsData = {};
   ```

2. **Wipe in place:** same reset, no archive. This is the common path — the previous season is preserved in git history.

After the reset, run the scraper to populate the new season (see `run-scraper-locally`). Don't manually scaffold month buckets — the scraper creates them as fixtures appear.

### Step 5: Re-translate scorer / venue maps if needed

Squad changes mean some `GREEK_TO_PLAYER_KEY` entries (`app/src/lib/translate.ts`) may now refer to ex-players. Don't delete; old fixtures still reference them. Add new players as they appear.

If new venues are encountered (rare for league play, common for cup ties), add to `GREEK_TO_VENUE_KEY` and `i18n/{en,el}.json#fotmob.venue`.

### Step 6: Verify

```bash
cd app
npm run lint
npm test
npm run build       # regenerates calendar.ics with the new X-WR-CALNAME year suffix
```

Spot-check `dist/index.html` (or running dev) for the empty-state experience while events.ts is empty.

### Step 7: Run the scraper

Use the `run-scraper-locally` skill, or trigger `scrape.yml` via `workflow_dispatch`. The first run populates September fixtures. Successive runs through the season add championship-phase data once CFA publishes it.

## Common Mistakes

- **Updating `SEASON_*_YEAR` but not the scraper URLs.** The scraper still hits last year's pages, returns nothing, the cron parser reads stale `events.ts`. Calendar looks frozen with no error.
- **Updating CFA URLs but not DataProject IDs.** Football looks fine; volleyball tabs go blank.
- **Bumping mid-season.** The CFA championship-phase URL doesn't exist until ~February. Don't paste a placeholder — leave the old URL until the new one is published, since the FotMob fallback covers football data well enough.
- **Forgetting `events.ts` reset.** If you bump constants but leave last season's events, the calendar shows last year's matches under this year's date headers.

## Notes

- This is an annual flow; the user typically runs it once around late August / early September.
- The rollover is intentionally not automated — the IDs are scraped from external sites that change schemas occasionally.
- If `events.ts` is wiped, push subscribers won't get a flood of "new match" notifications — `send-notifications.js` only fires on a *change*, and an empty-to-populated transition isn't a change in the desired sense. (If this becomes a problem, gate the diff on `if previous events.length > 0`.)
