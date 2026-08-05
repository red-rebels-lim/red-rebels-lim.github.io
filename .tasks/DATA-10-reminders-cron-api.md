# DATA-10: Reminders cron — fetch the API instead of eval'ing events.ts

**Status:** todo
**Batch:** write-path (`feat/scraper-payload`)
**Depends on:** DATA-07
**Estimated scope:** Small/Medium

## Context

Kills the `new Function('return ' + …)` hazard. `send-reminders.js` stops
regex-parsing the checked-out repo and instead fetches
`https://red-rebels.com/events.json` (now DB-backed) — same data, plain fetch,
no checkout of app sources needed.

## Implementation notes

- `.github/scripts/send-reminders.js`: replace `parseEventsFile()` +
  `constants.ts` regex with one fetch of /events.json; season years come from
  the payload (add them to the JSON envelope if absent — check the generator;
  extending the envelope is contract-compatible, removing/renaming is not).
- **eventKey generation stays byte-identical** — `${monthName}-${day}-${sport}-${opponent}`
  from the same month-bucket JSON, so ReminderLog dedup rows keep matching.
- Skip rules unchanged: played skipped, `time` not matching HH:MM skipped
  (timeTbd fixtures arrive as `time: ""` — preserved by the reshape).
- Add a fetch-failure guard: on non-200/timeout, log + exit 0 (a missed cycle
  is better than a crash-loop; cron reruns in 30 min).
- `reminders.yml`: can drop the app-source checkout steps if any exist.

## Acceptance criteria

- [ ] Dry-run mode output identical before/after against the same data
- [ ] No `new Function` / events.ts regex left in `.github/scripts/`
- [ ] Dedup verified: same eventKeys generated as the previous implementation
