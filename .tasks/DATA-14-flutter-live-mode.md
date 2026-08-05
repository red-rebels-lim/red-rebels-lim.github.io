# DATA-14: Flutter — live score UI + foreground polling

**Status:** todo
**Batch:** push-infra (`feat/push-on-d1`)
**Depends on:** DATA-08
**Estimated scope:** Medium

## Context

The user-facing payoff of the live-editing loop: when a fixture is live, the
app shows the provisional score and refreshes it while foregrounded.

## Implementation notes

- Model: add `live` to `MatchStatus` in `flutter/lib/models/events.dart`
  (fromJson tolerant — unknown statuses map to upcoming so old payloads parse).
  NOTE: /events.json maps live→upcoming for legacy contract; the live state
  arrives via /live.json overlay, so shipped builds are unaffected.
- `EventsRepository`: `fetchLive()` → `$siteBaseUrl/live.json`; overlay live
  scores onto the in-memory events by eventKey (no cache persistence — live
  data is ephemeral).
- `AppState`: when any fixture kickoff is within [now-3h, now+15m] OR /live.json
  returned entries, start a 45s foreground poll timer (pause on background —
  lifecycle hooks already exist for resume-sync). Stop when no live fixtures.
- UI: live badge + score on calendar day card, event sheet, and home-screen
  next-match card (i18n keys needed — EN free, EL copy needs sign-off ⚠️).
  Match existing token styling; volleyball shows current sets.
- Stats code continues to count only `played` (verify no logic treats
  non-upcoming as played).

## Acceptance criteria

- [ ] Editing a score in the Payload dashboard appears in the app ≤90s (manual QA)
- [ ] Polling runs only during live windows and only foregrounded
- [ ] Greek copy for live labels signed off; analyze + tests green
