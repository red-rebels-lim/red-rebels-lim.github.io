# DATA-13: Flutter — parse_client → Worker push endpoints

**Status:** todo
**Batch:** push-infra (`feat/push-on-d1`)
**Depends on:** DATA-11
**Estimated scope:** Medium

## Context

`flutter/lib/data/parse_client.dart` (hand-rolled Parse REST, write-only) is
replaced by calls to the new Worker endpoints. Removes the last Back4App
dependency — and the compile-time `BACK4APP_*` dart-defines — from the app.

## Implementation notes

- New `flutter/lib/data/push_api_client.dart`: register/prefs/unregister against
  `$siteBaseUrl/api/push/*`; same silent-failure philosophy as the repositories
  (never throw, return bool).
- `flutter/lib/logic/push_registration.dart`: swap client; keep persisting the
  returned ids in SharedPreferences under the SAME keys (`push_subscription_id`,
  `notif_preference_id`) — DATA-11 preserved id compatibility, so upgraded
  installs keep their existing registration without re-registering.
- Delete `parse_client.dart` + its tests; drop `BACK4APP_APP_ID`/`BACK4APP_JS_KEY`
  from `--dart-define` docs, QA scripts, and CI.
- Tests: MockClient coverage for the new client mirroring existing
  push_registration tests.

## Acceptance criteria

- [ ] Fresh install registers via Worker endpoints; upgrade path keeps existing id
- [ ] Preference edits round-trip; unregister works
- [ ] No Back4App reference left in flutter/; analyze + tests green
