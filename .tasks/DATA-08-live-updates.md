# DATA-08: Live updates — live status flow, /live.json, purge-on-write

**Status:** todo
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

- [ ] Editing a live fixture in the dashboard is visible on /events.json and
      /live.json within ≤60s without any deploy
- [ ] /live.json empty (`[]`) when no live fixture — cheap and cacheable
- [ ] Version bump covered by a payload test; Worker reshape tests green
