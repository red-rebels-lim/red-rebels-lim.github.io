# DATA-08: Live updates — live status flow, /live.json, purge-on-write

**Status:** in review (PR #123)
**Batch:** read-path (`feat/worker-d1-api`)
**Depends on:** DATA-07
**Estimated scope:** Medium

## Context

The real-time editorial loop: admin edits a live score in the Payload dashboard
→ apps see it within seconds. Architecture doc §11 "Real-time match updates".

## Implementation notes

- Payload (payload/): `afterChange`/`afterDelete` hook on fixtures (+ teams/
  players) bumps the `meta.dataVersion` row in D1 — same DB, same transaction
  scope, no external calls needed. Optionally also Cache API purge via CF API
  token; version-bump alone is sufficient given DATA-07's versioned cache key.
- Worker (app/): `GET /live.json` → fixtures with `status = 'live'` (id,
  eventKey, sport, opponentName, score, sets, kickoff, minute-ish fields),
  `Cache-Control: max-age=30`. Tiny payload, no month-bucket reshape.
- Version lookup cost control: cache the meta-row read itself for ~10s so a
  poll storm costs O(1) D1 reads.
- Dashboard flow doc (payload/README): kickoff → set `live`; edit score during
  match; full time → set `played` + final score. Scraper rules (DATA-09) treat
  `played` as final.

## Acceptance criteria

- [x] Editing a live fixture in the dashboard is visible on /events.json and
      /live.json within ≤60s without any deploy — hooks bump `payload_kv
      dataVersion`; Worker keys its edge cache on it with a 10s version memo,
      so worst-case staleness ≈ memo + rebuild, well under 60s. Full e2e needs
      the payload Worker redeployed (`payload: npm run deploy`) after merge —
      then verify: edit a fixture in the dashboard, curl /events.json.
- [x] /live.json empty (`[]`) when no live fixture — cheap and cacheable; on
      D1 outage it degrades to `[]` too (the SPA fallthrough would serve HTML)
- [x] Version bump covered by a payload test (first int test in
      `payload/tests/int/`); Worker reshape tests green (18 in
      `app/src/__tests__/worker/feeds.test.ts`, suite 820/820)

Found & worked around: the pinned `@payloadcms/db-d1-sqlite` aliases `upsert`
to `updateOne`, making `payload.kv.set` a silent no-op for missing keys —
`bumpDataVersion` db-creates the row on first bump.
