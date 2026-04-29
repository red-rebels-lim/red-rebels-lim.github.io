# app/scripts/scraper/CLAUDE.md

Standalone Node project. Not part of the app bundle.

## Setup

This directory has its own `package.json` and its own `node_modules`. Don't pull these deps into the main app. CI installs them separately:

```yaml
# .github/workflows/scrape.yml
- run: npm install        # in app/scripts/scraper
- run: npm run scrape     # = tsx index.ts
```

Locally: `cd app/scripts/scraper && npm install && npm run scrape` writes `app/src/data/events.ts`.

## Imports

Sibling TS files are imported with the `.ts` extension (`moduleResolution: "bundler"` in `tsconfig.scripts.json`). Don't switch to `.js`.

```ts
import { enrichWithFotMob } from './fotmob-enrichment.ts';   // correct
import { enrichWithFotMob } from './fotmob-enrichment.js';   // wrong
```

## Data sources and ordering

`index.ts` orchestrates these in order:

1. CFA football fixtures (two URLs: preliminary phase + championship phase).
2. FotMob team-page fallback (used only when CFA HTML is unreachable; parses `__NEXT_DATA__`).
3. volleyball.org.cy senior fixtures (men + women, separate AJAX URLs).
4. DataProject league fixtures (men: 2 PIDs, women: 1 PID) — provides set scores and top scorers.
5. DataProject cup fixtures (men + women, QF + SF separately).
6. FotMob enrichment (lineups, scorers, bookings) for football matches.
7. Per-sport CFA / DataProject enrichment for played matches.

Each step merges into the in-memory month buckets keyed by `september..august`. Reordering changes which source wins on a conflict.

## Three name maps — keep them in sync

| Map | File | Keys → values |
|---|---|---|
| `DATAPROJECT_TEAM_NAME_MAP` | `index.ts` | English DataProject names → Greek uppercase |
| `FOTMOB_TEAM_NAME_MAP` | `fotmob-fallback.ts` | English FotMob names (lowercased lookup) → Greek uppercase |
| `GREEK_MONTHS` | `index.ts` | Greek month genitive → 1..12 |

Plus the *app-side* maps (`GREEK_TO_TEAM_KEY` / `GREEK_TO_VENUE_KEY` / `GREEK_TO_PLAYER_KEY` in `app/src/lib/translate.ts`) consume the Greek strings the scraper emits. If you add a team here, you almost certainly need to add it on the app side too — see `app/src/data/CLAUDE.md`.

## Season-specific URLs and IDs

These URLs are **season-scoped** and will return 404 / empty when the season rolls (≈ September each year):

- `index.ts:48-51` — CFA fixture URLs (`65409603`, `66686780`).
- `index.ts:53-56` — volleyball.org.cy `ajax_post=` IDs.
- `index.ts:58-77` — DataProject competition `ID=` and `PID=` tuples (league + cup).

When the new season starts, all of the above plus `SEASON_START_YEAR` / `SEASON_END_YEAR` in `app/src/data/constants.ts` need updating, and `events.ts` typically needs to be cleared (or archived elsewhere) so the scraper writes a fresh season.

## Don't

- Don't write to `events.ts` directly — go through the scraper's serializer at the end of `index.ts` so the formatting matches what the cron parser expects.
- Don't add TypeScript-only constructs to the emitted output (see `app/src/data/CLAUDE.md`).
- Don't introduce a third-party HTTP library; the scraper uses native `fetch` + `cheerio` only.
