# DATA-09: Scraper → Payload REST writes (merge rules, dual-write)

**Status:** in review (PR #127)
**Batch:** write-path (`feat/scraper-payload`)
**Depends on:** DATA-03
**Estimated scope:** Large

## Context

The scraper becomes a Payload API client. Its battle-tested merge rules
(`app/scripts/scraper/index.ts` `updateCalendarData`, `mergeExistingWithScraped`,
`confirmTbdDates`) port to query-then-upsert against the fixtures collection.
Dual-write initially: events.ts keeps being written until DATA-15.

## Implementation notes

- New `app/scripts/scraper/payload-sync.ts`: after the existing events.ts write,
  sync the merged result to Payload REST (auth: `PAYLOAD_API_KEY` GH secret from
  DATA-03). Match rows by eventKey, with the ±10-day `sport|opponent` window for
  dateTbd confirmation (mirrors `DATE_TBD_TOLERANCE_MS` logic).
- Port the protection rules exactly:
  - `status: 'played'` → never change result fields; enrichment may only FILL
    empty detail arrays (scorers/lineups/subs/sets/vbScorers), never replace.
  - `locked: true` or `source: 'manual'` → skip entirely.
  - `status: 'live'` → do not touch (a match being live-edited mid-scrape).
  - New fixtures → create with `source: 'scraper'`.
- Team resolution: opponent string → teams.slug via aliases; unknown team =
  loud failure (same rule as seeding).
- `changes.json` continues to be produced unchanged (send-notifications.js
  depends on it).
- `scrape.yml`: add the sync + a parity step (DATA-06) after it; workflow fails
  on drift.
- Soak: at least one manual `workflow_dispatch` run reviewed before relying on it.

## Acceptance criteria

- [ ] Scrape run updates D1 and events.ts identically (parity green in workflow)
      — implemented (`feed-parity.ts` + scrape.yml step); pending the soak
      `workflow_dispatch` run. NOTE the parity is a **subset** check by design:
      the DB legitimately knows more than events.ts during the transition
      (admins enter friendly results/venues the CFA never publishes — observed
      live with the Aug 5 friendly result). Feed-ahead drift logs as warnings;
      missing fixtures or contradicting values fail the run.
- [x] Played/locked/live fixtures provably untouched (18 unit tests on the
      merge port, `payload-sync.test.ts`), incl. fill-only detail on played,
      never-replace, ±10-day dateTbd adoption, and no-churn preservation of
      admin-enriched fields the scrape lacks
- [x] Unknown opponent aborts with a clear error before any write (plan phase
      collects unknowns; executor throws before any POST/PATCH)

## Soak run record (2026-08-06, run 31114619957)

The soak caught a real design flaw. The scraper's season URLs still pointed at
25/26 sources (gather-season-schedule pending), so the run planned 78 junk
creations + 2 dateTbd adoptions onto last season's dates — and because the
sync ran inside the scrape, it wrote them straight to production D1,
bypassing the events.ts PR review gate. All 25/26 opponents exist in the
teams registry (historical backfill), so the unknown-opponent guard passed.

Cleanup: junk PR #128 closed; 80 fixtures + 1,479 child rows deleted from D1
(backed up to session scratchpad first); the 2 corrupted draw fixtures
restored via remote seed; the admin-entered Aug 5 result re-applied
(the seed has no protection rules — its status write clobbered it); feed
parity green, 35 events, production verified.

Fixes:
- D1 writes moved behind the review gate: scrape.yml only DRY-RUNS the sync
  (plan in the log for the reviewer); `sync-payload.yml` performs the real
  sync when events.ts lands on main, then runs feed parity.
- Bulk-create safety cap (`assertPlanSafe`, default 15, override
  `PAYLOAD_MAX_CREATES`) — a stale-source scrape can never mass-create again.
