---
name: add-team
description: |
  Add a new opponent team to the calendar with all six required edits in sync. Use when:
  - User says "add a new team", "add an opponent", "we're playing X for the first time"
  - A scraper run produces an unmapped Greek opponent name
  - A team appears in events.ts but English mode shows the raw Greek string
---

# Add Team Skill

Adds a new opponent team across all the places that need to know about it. The codebase splits team identity across six files; missing any one produces a silently-degraded UI (raw Greek leaking into English mode, scraper dropping fixtures, missing logo).

## Arguments

- `GREEK_NAME` (required): Team name as it appears in CFA / volleyball.org.cy fixture HTML, in Greek-uppercase form (e.g. `ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ`).
- `ENGLISH_KEY` (required): Camel/space English key used everywhere on the app side (e.g. `Doxa Katokopia`). This becomes the i18n key under `fotmob.teams.*` and the `TEAM_LOGOS` key.
- `SPORT` (optional): One of `football-men`, `volleyball-men`, `volleyball-women`. Determines whether DataProject and FotMob-fallback maps are touched. Default: infer from where the team appears in `events.ts`.

## When NOT to Use

- The team already has a row in `data/constants.ts#TEAM_LOGOS`. Just verify all six places are consistent — most likely a single map entry is missing, not a full add.
- The user is editing one fixture by hand and the opponent is incidental. That's a `fix-stale-fixture` flow, not a new team.
- The "team" is a meeting / non-match calendar entry (`sport: 'meeting'`). Meetings don't go through `translate.ts`.

## Workflow

### Step 1: Confirm the team is genuinely new

```bash
# in repo root
grep -i "<ENGLISH_KEY>" app/src/data/constants.ts app/src/lib/translate.ts app/src/i18n/en.json
grep "<GREEK_NAME>" app/src/lib/translate.ts app/scripts/scraper/index.ts app/scripts/scraper/fotmob-fallback.ts
```

If any hit comes back, switch to "verify and patch missing places" mode rather than adding fresh.

### Step 2: Logo asset

Filename convention is Greek-uppercase with underscores instead of spaces, `.webp` extension:

```
app/public/images/team_logos/<GREEK_NAME_WITH_UNDERSCORES>.webp
```

If the user can't supply a logo, the scraper auto-downloads from CFA/DataProject on the next run — proceed without a logo, but flag this so the user knows the first scrape will populate it.

### Step 3: Six-place edit checklist

| # | File | What to add |
|---|---|---|
| 1 | `app/src/data/constants.ts` | `TEAM_LOGOS['<ENGLISH_KEY>']: 'images/team_logos/<GREEK_FILENAME>.webp'` |
| 2 | `app/src/lib/translate.ts` | `GREEK_TO_TEAM_KEY['<GREEK_NAME>']: '<ENGLISH_KEY>'` (uppercase form). Add a mixed-case form too if the team appears as `'Mixed Case'` anywhere. |
| 3 | `app/src/i18n/en.json` | Under `fotmob.teams.<ENGLISH_KEY>`, value = English display name |
| 4 | `app/src/i18n/el.json` | Under `fotmob.teams.<ENGLISH_KEY>`, value = Greek display name (mixed-case, NOT uppercase) — flag this for the user to review tone |
| 5 | `app/scripts/scraper/index.ts` `DATAPROJECT_TEAM_NAME_MAP` | English DataProject name → Greek uppercase. **Skip for football-only teams.** Volleyball cup teams sometimes appear under multiple English variants — add all forms. |
| 6 | `app/scripts/scraper/fotmob-fallback.ts` `FOTMOB_TEAM_NAME_MAP` | Lowercased FotMob name → Greek uppercase. **Skip for volleyball-only teams.** |

### Step 4: Verify

```bash
cd app
npm run lint
npm test                     # catches missing key references in tests
npm run build                # confirms tsc + ics generation pass
```

Then a sanity grep for the new Greek name across the repo to confirm there are no other references:

```bash
grep -rn "<GREEK_NAME>" app/src app/scripts --include="*.ts" --include="*.tsx" --include="*.json"
```

### Step 5: Optional — run the scraper

If the team has matches scheduled imminently, follow up with the `run-scraper-locally` skill so `events.ts` picks up the fixtures with the new mappings already in place.

## Common Mistakes

- **Adding to `i18n/en.json` only.** The Greek file has the same key set; both must include the new entry or `el` mode crashes on the new opponent.
- **Mixing uppercase and mixed-case in `GREEK_TO_TEAM_KEY`.** `events.ts` stores Greek-uppercase from the scraper, but i18n display names should be mixed-case. The map maps both to the same English key — add both rows when needed.
- **Forgetting the FotMob fallback map.** It's only used when CFA is unreachable, so the bug only surfaces on the day CFA is down. Don't assume "we don't need it."
- **Logo filename mismatch.** The scraper writes filenames with underscores (`makeSafeFilename` in `scripts/scraper/index.ts`). If you hand-name a logo, match that convention exactly.

## Notes

- Greek text in `i18n/el.json` is reviewed for tone by the user. Don't auto-translate — propose a value and flag for review.
- This skill does NOT modify `events.ts` directly. The team becomes visible in the calendar only after the scraper runs (or a fixture is added by hand).
