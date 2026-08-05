# DATA-04: Seed script — current season from TS sources

**Status:** todo
**Batch:** seed (`feat/payload-seed`)
**Depends on:** DATA-02
**Estimated scope:** Medium/Large

## Context

One-shot (but idempotent) importer that turns today's git-based data into rows,
via the **Payload Local API** (runs inside the payload project, so hooks —
eventKey computation — fire for free).

## Implementation notes

- `payload/scripts/seed.ts`, runnable against local or remote D1.
- Sources (read-only, never modify):
  - `app/src/data/events.ts` → fixtures (month bucket + SEASON_*_YEAR constants
    → kickoff Date; `time: ""` → timeTbd; keep dateTbd; meetings included).
  - `app/src/data/players.ts` → players + squad-memberships (active/joined/left/
    shirtNumber move to the membership row; season = 2026-27).
  - `app/src/lib/translate.ts` `GREEK_TO_TEAM_KEY` + `i18n/{en,el}.json`
    `fotmob.teams.*` → teams (slug, nameEl, nameEn); `GREEK_TO_VENUE_KEY` kept
    as venue strings for now (no venue collection this sprint).
  - `app/public/images/team_logos/*` + `app/public/images/players/*` → uploads.
- Upsert semantics: match by unique keys (season.code, team.slug, player.slug,
  fixture.eventKey) — re-running must be a no-op.
- Import order: seasons → teams → players → memberships → fixtures.
- Log unmatched opponent strings / unresolved player names loudly (these reveal
  alias-table gaps — fix data, don't silently skip).

## Acceptance criteria

- [ ] All 35 current events + 69 players + ~55 teams imported; counts logged
- [ ] Second run reports 0 creates / 0 changes
- [ ] Unresolvable names fail the run with a clear list, not silently
