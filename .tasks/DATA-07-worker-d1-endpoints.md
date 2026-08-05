# DATA-07: rrcalendar — bind D1, dynamic /events.json + /players.json

**Status:** todo
**Batch:** read-path (`feat/worker-d1-api`)
**Depends on:** DATA-03, DATA-06
**Estimated scope:** Medium/Large

## Context

The read cutover. The same D1 database is bound into the existing `rrcalendar`
Worker (`app/src/_worker.ts`), which starts serving the two JSON endpoints
dynamically instead of as static build artifacts. Contract identical → every
shipped Flutter build gets DB-backed data with zero app update. Payload stays
off the read path entirely.

## Implementation notes

- `app/wrangler.jsonc`: add the D1 binding (database ID from DATA-03). Note the
  CLAUDE.md warning about wrangler.jsonc — only add the binding, touch nothing
  else. Dashboard git-integration deploys must pick the binding up (verify in
  preview first).
- Routes in `_worker.ts` before the ASSETS fallthrough: `GET /events.json`,
  `GET /players.json` — query D1, reshape via the DATA-06 shared module
  (`live` → `upcoming` here), serve with `Cache-Control` + Cache API.
- Cache strategy (architecture doc §11 "real-time" section): cache key includes
  a version from a `meta` (key,value) D1 row that Payload bumps on write
  (DATA-08 adds the bump); until then a modest TTL (60s) is fine.
- **Resilience**: on D1 error, fall through to the static ASSETS copies (they
  still exist until DATA-15) — the endpoints must never 500 for shipped apps.
- Delete nothing yet: `generate-events-json.ts` build step keeps producing the
  static files as the fallback + parity reference.
- Tests: vitest for the reshape (shared with parity), plus a `wrangler dev`
  smoke check documented in the PR.

## Acceptance criteria

- [ ] Both endpoints serve DB data byte-identical to the static files (parity CI)
- [ ] D1 outage → static fallback, not an error response
- [ ] Existing routes (telegram webhook, SPA assets) untouched; app CI green
