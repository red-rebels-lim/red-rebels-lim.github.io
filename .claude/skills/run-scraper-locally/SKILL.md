---
name: run-scraper-locally
description: |
  Run the fixtures scraper from a local checkout. Use when:
  - User says "run the scraper", "rescrape", "pull fresh fixtures"
  - A new fixture has been announced and the user wants events.ts updated now (instead of waiting for the GH Actions run)
  - Verifying scraper output after editing name maps, season URLs, or enrichment logic
---

# Run Scraper Locally Skill

Runs the standalone scraper Node project that writes `app/src/data/events.ts`. The scraper is a separate npm project from the app — different `package.json`, different `node_modules`, run from `app/scripts/scraper/`.

## When NOT to Use

- The user only wants to *check* what would change without modifying files. The scraper has no `--dry-run` flag; running it always writes `events.ts` and `changes.json`. If they want a dry-run, suggest making the change in a fresh git working tree and discarding.
- The CI scrape workflow has just run (within the last hour) and the user hasn't pushed any scraper changes. The output will be identical.
- The user wants to add ONE fixture by hand. That's a manual `events.ts` edit (constrained by the JS-eval rule in `app/src/data/CLAUDE.md`), not a scraper run.

## Prerequisites

- Working internet connection — the scraper hits cfa.com.cy, volleyball.org.cy, kop-web.dataproject.com, and www.fotmob.com.
- Node 20+ (matches CI).
- No prior interrupted scraper runs leaving partial output. If `app/src/data/events.ts` is in a half-edited state, `git checkout app/src/data/events.ts` first.

## Workflow

### Step 1: Install dependencies (first run only)

The scraper has its own dependency tree, separate from the app:

```bash
cd app/scripts/scraper
npm install
```

If `node_modules` already exists, skip — the scraper has only one runtime dep (cheerio) and pinned versions.

### Step 2: Run the scraper

```bash
cd app/scripts/scraper
npm run scrape          # = tsx index.ts
```

Expected output is a stream of `🔄 Fetching ...` and `✓` / `✗` lines. Total runtime: 30–90 seconds depending on FotMob enrichment volume. Two artefacts are written:

- `app/src/data/events.ts` — the data file (large, regenerated wholesale).
- `changes.json` (repo root) — diff vs. the previous events.ts; consumed by `send-notifications.js` in CI.

### Step 3: Verify the output is parseable

The cron reminders job parses `events.ts` as a plain JS object literal. Run a quick sanity check before committing:

```bash
node -e "const c = require('fs').readFileSync('app/src/data/events.ts','utf8'); const m = c.match(/export const eventsData[^=]*=\\s*({[\\s\\S]*});?\\s*\$/); const d = new Function('return ' + m[1])(); console.log('months:', Object.keys(d).length, 'total events:', Object.values(d).flat().length);"
```

If this errors, the scraper emitted something the cron can't parse — DO NOT commit. Investigate and fix the scraper's serialisation step.

### Step 4: Verify the app still builds

```bash
cd app
npm run lint
npm test
npm run build
```

`npm run build` regenerates `public/calendar.ics`/`calendar-el.ics` from the new events. Any TypeScript error in `events.ts` shows up in `tsc -b`.

### Step 5: Review the diff

```bash
git diff --stat app/src/data/events.ts changes.json
```

Sanity checks:

- `events.ts` line count is in the same order of magnitude as before (a sudden drop to ~50 lines means the scraper hit an empty source page).
- `changes.json` lists changes that match expectation (no surprise additions of teams that aren't real opponents — those signal a name-map miss).

If `changes.json` shows `unchanged: <total>` and empty arrays for `added` / `scoreUpdated` / `timeUpdated`, the scraper found nothing new — that's normal between match days.

### Step 6: Commit

Standard commit format used by the auto-scraper PR:

```
chore: update events from scraper
```

If the scraper run was triggered by a name-map fix or season bump rather than routine updates, use a more descriptive message and reference the underlying change.

## Common Failures

- **HTTP 403/404 from CFA.** The site rate-limits aggressive User-Agents. The scraper sets a realistic UA but still gets blocked occasionally; retry after a minute. Persistent failure = check whether CFA published the fixture page yet (early-season or championship-phase URLs may not exist).
- **DataProject parsing returns 0 fixtures.** Most often the `ID/PID` tuple in `index.ts` is wrong (season changed, see `bump-season-year`). Visit the URL in a browser and confirm fixtures are visible.
- **FotMob enrichment fails for one match.** The scraper logs the error and continues. If it fails for *all* matches, the FotMob API endpoint shape may have changed — see `fotmob-enrichment.ts` parsers.
- **Scraper writes events but with English team names.** A name-map miss in `DATAPROJECT_TEAM_NAME_MAP` or `FOTMOB_TEAM_NAME_MAP`. Search `events.ts` for non-Greek opponent strings, then add the mapping (see `add-team`).

## Notes

- The scraper is idempotent: running it twice in a row produces no diff (assuming no remote changes between runs).
- Hand edits to `events.ts` between scraper runs may be preserved or clobbered depending on the per-month merge logic — generally, the scraper trusts its own data and overwrites. If preserving a hand edit matters, encode it as a name-map / enrichment fix instead.
- Don't run the scraper from the repo root or any other directory — it resolves `LOGOS_DIR` and `EVENTS_FILE` relative to its own `__dirname`.
