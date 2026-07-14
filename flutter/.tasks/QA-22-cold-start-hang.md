# QA-22: Cold-start hang — verify launch sync is non-blocking

**Status:** todo
**Batch:** functional-gaps (`fix/qa-functional`)
**Register rows:** FUN-01 (P2, PLAUSIBLE — not yet reproduced deterministically)
**Depends on:** -
**Estimated scope:** Small/Medium (investigation first)

## Context

During QA the app once hung ~90 s on the splash screen after `am force-stop` +
relaunch while the emulator's network was degraded (the emulator later died of a Netsim
wifi-socket loss, so ambient network flakiness was real). The web shell paints instantly
from the service-worker cache under the same conditions.

Suspicion: the launch-time events/players sync (`data/events_repository.dart` /
`players_repository.dart`, Phase 4 "refresh on launch/foreground, cache the last snapshot")
blocks first frame instead of racing cache-first with a background refresh. FR-OFFLINE-2
requires cached snapshot + stale indicator on failure.

## Reproduce

1. Emulator with app installed and previously synced (cache populated).
2. Degrade network: `adb shell svc wifi disable` + `svc data disable`, or emulator console
   `gsm signal-profile 0` / delay; also try TCP-blackhole (connect but never respond —
   worst case for missing timeouts).
3. `adb shell am force-stop com.redrebels.red_rebels_calendar`, relaunch via
   `am start -n com.redrebels.red_rebels_calendar/.MainActivity`, time to first frame.

## Fix shape (if confirmed)

- First frame renders from cached snapshot unconditionally; network refresh is fire-and-
  forget with a hard timeout; stale-data indicator per FR-OFFLINE-2 (check what the web
  shows — likely nothing/toast).
- Also audit push registration (`logic/push_registration.dart`) and Parse init for awaits
  on the startup path (`main.dart`); the error-142 gotcha memory notes Back4App calls can
  stall.

## Acceptance criteria

- [ ] Reproduction attempted under ≥3 degraded-network shapes; result documented in the PR
- [ ] Cold start to interactive < 3 s with cache and no network (or hard timeout proven)
- [ ] `flutter analyze && flutter test` green; startup-path test with never-resolving client
- [ ] FUN-01 → FIXED (or downgraded with evidence if not reproducible)
