# DATA-06: Parity checker — D1 → legacy JSON contract diff

**Status:** todo
**Batch:** seed (`feat/payload-seed`)
**Depends on:** DATA-04
**Estimated scope:** Small/Medium

## Context

The safety net for every cutover step: regenerate the exact legacy contract
(`events.json` month-bucket shape + `players.json`) from the database and diff
it against the output of the current TS-source generators. Frozen contract =
shipped Flutter builds keep working.

## Implementation notes

- `payload/scripts/parity.ts`: query fixtures/players (current season), reshape
  to the legacy JSON (kickoff → month bucket + `day` + `time` string; timeTbd →
  `""`; **status `live` → `upcoming`**; strip DB-only fields: source, locked,
  eventKey, ids, timestamps), deep-diff against the generators' output
  (`app/scripts/generate-events-json.ts` results or the committed `public/` files).
- Exit non-zero with a readable field-level diff.
- Wire as a CI job on payload/ + app/ changes once DATA-07 exists (the same
  reshape module should be shared with the Worker's serving code — extract it
  to a small package/module both import, or port carefully with fixture tests).

## Acceptance criteria

- [ ] Green run against the DATA-04 seed proves byte-equivalent contract
- [ ] Deliberate mutation (e.g. changed score) produces a clear failing diff
- [ ] Runs in CI
