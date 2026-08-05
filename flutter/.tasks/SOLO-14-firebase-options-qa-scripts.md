# SOLO-14: firebase_options regen + QA script PKG

**Status:** done (PR #118)
**Batch:** ids (`feat/solosalamina-ids`) — atomic with SOLO-12/13
**Depends on:** SOLO-12, SOLO-13
**Estimated scope:** Small

## Context

`lib/firebase_options.dart` holds per-app Firebase values tied to the old registrations;
QA shell scripts hardcode the old package name.

## Implementation notes

- Regenerate `lib/firebase_options.dart` via `flutterfire configure` against the new app
  registrations (or hand-edit values from the two new config files).
- `tool/qa/device-pass.sh:10` + `tool/qa/inject-dataset.sh:13` — `PKG=com.solosalamina.app`.
- Post-merge device check: fresh FCM token creates a new Back4App `PushSubscription` row
  (stale old rows acceptable — pre-release).

## Acceptance criteria

- [ ] Push registration works end-to-end on a device with the new identity
- [ ] `tool/qa/device-pass.sh` runs against the new package
