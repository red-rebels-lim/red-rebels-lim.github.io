# SOLO-13: iOS identity → com.solosalamina.app

**Status:** done (PR #118)
**Batch:** ids (`feat/solosalamina-ids`) — atomic with SOLO-12/14
**Depends on:** user Firebase delivery
**Estimated scope:** Small

## Context

Same one-time window as SOLO-12. iOS bundle ID matches Android exactly:
`com.solosalamina.app`.

## Implementation notes

- `ios/Runner.xcodeproj/project.pbxproj` (:385, :564, :587) —
  `PRODUCT_BUNDLE_IDENTIFIER` = `com.solosalamina.app` / `com.solosalamina.app.RunnerTests`.
- Replace `ios/Runner/GoogleService-Info.plist` (user-supplied).
- User uploads APNs auth key in Firebase console for iOS push (external).

## Acceptance criteria

- [ ] Clean iOS simulator build succeeds
- [ ] Firebase initializes without the 5s-timeout degradation path
