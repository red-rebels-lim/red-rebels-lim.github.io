# app/src/data/CLAUDE.md

Rules that apply only inside this directory.

## events.ts is generated AND externally parsed

`events.ts` is the single source of truth for all match data. Two systems write/read it that you must keep in mind together:

1. **The scraper writes it** (`app/scripts/scraper/index.ts`) on every `scrape.yml` workflow run. Hand-edits can be clobbered on the next scraper run unless they survive the scraper's merge step. If you need to fix one match, check the scraper's per-month merge logic before editing.

2. **The cron reminders job parses it as JavaScript** (`.github/scripts/send-reminders.js:60-65`) using a regex + `new Function('return ' + match[1])`. This is TypeScript source but the cron treats it as a JS object literal.

**Implication:** the right-hand side of `export const eventsData: EventsData = { ... }` must remain a plain object literal that JS can `eval`. Specifically, do not introduce:

- `as const`, `satisfies`, type assertions inside the literal
- Spread of imported values
- Computed property keys
- Function calls
- `Date(...)`, `new Date(...)`
- Comments inside the literal (the regex is forgiving on this, but stay safe)

If you need to change the *type* of `EventsData`, do it in `app/src/types/events.ts`. The data file should stay structurally trivial.

CI does not exercise the cron parser. Breakage will only be visible at the next firing of `reminders.yml` (every 30 min). To verify a change manually:

```bash
node -e "const c = require('fs').readFileSync('app/src/data/events.ts','utf8'); const m = c.match(/export const eventsData[^=]*=\\s*({[\\s\\S]*});?\\s*$/); new Function('return ' + m[1])();"
```

## Other files here

- `constants.ts` — `TEAM_NAME`, `NEA_SALAMINA_ID = 8590` (FotMob ID), `SEASON_START_YEAR`, `SEASON_END_YEAR`, `TEAM_LOGOS` (English-name → webp path).
- `sport-config.ts` — sport → `{emoji, name}`. Tiny; safe to edit.
- `month-config.ts` — derives `daysInMonth` and Monday-based `startDay` from the season constants. Avoid touching the JS-Sunday-to-ISO-Monday math.

## Adding a new opponent

There are six places to update. See "skill candidate: add-team" in the audit notes, or simply check that all of these are in sync after your edit:

1. Logo asset at `app/public/images/team_logos/<GREEK_UPPERCASE_NAME>.webp`.
2. `data/constants.ts` `TEAM_LOGOS` (English-name → path).
3. `lib/translate.ts` `GREEK_TO_TEAM_KEY` (Greek-uppercase → English key).
4. `i18n/en.json` and `i18n/el.json` under `fotmob.teams.<key>`.
5. `app/scripts/scraper/index.ts` `DATAPROJECT_TEAM_NAME_MAP` (only if the team appears in volleyball dataproject feeds).
6. `app/scripts/scraper/fotmob-fallback.ts` `FOTMOB_TEAM_NAME_MAP` (only for football teams that may surface via the FotMob fallback).
