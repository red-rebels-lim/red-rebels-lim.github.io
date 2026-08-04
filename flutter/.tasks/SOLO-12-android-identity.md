# SOLO-12: Android identity → com.solosalamina.app

**Status:** blocked (needs user-supplied google-services.json)
**Batch:** ids (`feat/solosalamina-ids`) — atomic with SOLO-13/14
**Depends on:** user Firebase delivery
**Estimated scope:** Medium

## Context

App is pre-release — one-time window to change the applicationId before store publication.
The Google Services Gradle plugin FAILS THE BUILD if the applicationId isn't present in
`google-services.json`, so this PR must land atomically with the new config file.

## Implementation notes

- `android/app/build.gradle.kts:9,20` — `namespace` + `applicationId` = `com.solosalamina.app`.
- `git mv android/app/src/main/kotlin/com/redrebels/red_rebels_calendar/`
  → `kotlin/com/solosalamina/app/`; update `package` declarations in `MainActivity.kt` +
  `NextMatchWidgetProvider.kt`.
- Deep-link scheme `redrebels://` → `solosalamina://` (`NextMatchWidgetProvider.kt:307,309`).
- Replace `android/app/google-services.json` (user-supplied, registered for the new id).
- Verify AndroidManifest widget receiver uses fully-qualified (or correctly-relative) names.

## Acceptance criteria

- [ ] Clean `flutter build apk --debug` succeeds
- [ ] Widget tap deep link opens the app; FCM token registers on device
