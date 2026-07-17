---
name: gather-season-schedule
description: |
  Wire the scraper to the new season's external sources and run the first scrape. Use when:
  - User says "gather the schedule", "hook up the new season's fixtures", "the CFA published the programme"
  - bump-season-year has already run and the calendar shows only friendlies
  - A competition's source URL/ID changed mid-season (run the relevant step alone)
  Requires IDs from external sites — if any isn't published yet, STOP AND ASK, never guess.
---

# Gather Season Schedule Skill

The second half of the annual rollover (the first is `bump-season-year`, which needs no
external input). This one is blocked on external sites publishing the season's
competition pages — typically late August for Cyprus. Every ID below is scraped from a
site that occasionally changes schema; that's why this is deliberately not automated.

## Step 1: Gather the season's external IDs (human-input step)

The user supplies these — browser + network-tab work:

| ID | Source | How to find |
|---|---|---|
| CFA fixture URL — **check the division!** (First Division since 26/27) | cfa.com.cy | League fixtures page; URL ends in a numeric ID like `/Gr/fixtures/65409603` |
| CFA championship/relegation-phase URL | cfa.com.cy | Published mid-season (~Feb); leave the old URL until then |
| Volleyball men `ajax_post=` ID | volleyball.org.cy | Network tab on the all-programs page |
| Volleyball women `ajax_post=` ID | volleyball.org.cy | Same |
| DataProject men league `ID` + `PID` (may be two PIDs) | kop-web.dataproject.com | `CompetitionMatches.aspx?ID=<>&PID=<>` |
| DataProject women league `ID` + `PID` | kop-web.dataproject.com | Same pattern |
| DataProject men cup `ID` + `PID` (QF + SF) | kop-web.dataproject.com | Cup pages, separate competition ID |
| DataProject women cup `ID` + `PID` (QF + SF) | kop-web.dataproject.com | Same |

**If any ID isn't published yet, stop and ask.** Invented IDs return HTTP 200 with empty
HTML — the scraper "succeeds" and silently writes nothing.

## Step 2: Update scraper constants

`app/scripts/scraper/index.ts` (~lines 48–77):

- `CFA_URLS` — two strings (preliminary + championship phase).
- `VOLLEYBALL_URLS` — two strings keyed by sport.
- `DATAPROJECT_URLS` — string or string[] per key (men's league has two PIDs).
- `DATAPROJECT_CUP_URLS` — always string[] (QF + SF).

Don't reorder the constants: the scraper iterates in declared order and later sources
overwrite earlier ones for the same date+opponent.

Promotion note (26/27+): the CFA First Division page may format team names differently
from the old Second Division page (e.g. full club names). Expect new unmapped opponent
strings on the first scrape — each is an `add-team` flow (six-edit sync). First Division
opponents' crests were pre-fetched 2026-07-17 (ΑΡΗΣ_ΛΕΜΕΣΟΥ, ΕΘΝΙΚΟΣ_ΑΧΝΑΣ,
ΟΜΟΝΟΙΑ_ΑΡΑΔΙΠΠΟΥ, ΠΑΦΟΣ_FC + existing ones); wire them via `translate.ts` when the
scraper reveals the CFA name forms. Beware department-specific crests: `ΑΝΟΡΘΩΣΙΣ.webp`
is the VOLLEYBALL badge, football uses `ΑΝΟΡΘΩΣΙΣ_FC.webp` — when in doubt about a
club's crest or departments, ask the stakeholder, don't guess.

## Step 3: First scrape

Run via the `run-scraper-locally` skill (preferred for the first run — you can inspect
the diff before committing) or `scrape.yml` workflow_dispatch.

- The friendlies already in `events.ts` are manual entries; the scraper preserves events
  it can't match (`updateCalendarData` keeps unmatched existing events).
- Bootstrap: from a near-empty file the scraper suppresses `added` notifications.
- Check the scrape log for unmapped teams/venues; run `add-team` per new opponent, add
  venues to `GREEK_TO_VENUE_KEY` + `i18n/*.json#fotmob.venue`.

## Step 4: Ship

```bash
cd app && npm run lint && npm test && npm run build
node ../flutter/tool/generate_events_json.mjs   # regenerate the bundled asset
cd ../flutter && flutter analyze && flutter test
```

PR through main (Cloudflare deploys the web app); ship a Flutter release so installed
apps get the fixtures — the bundle is a compile-time copy, though installed apps also
pull the live feed on launch.

## Common Mistakes

- Guessing an unpublished ID (see step 1 — silent empty scrapes).
- Updating CFA but not DataProject: football fine, volleyball tabs blank.
- Pointing CFA at the old division's fixtures page after promotion/relegation.
- Forgetting that new CFA name forms need `translate.ts` mappings before English mode
  and logos work — the scrape "succeeds" but cards show raw Greek strings.
