# SOLO-03: App class + display names

**Status:** todo
**Batch:** rebrand (`feat/solosalamina-rebrand`)
**Depends on:** SOLO-02
**Estimated scope:** Small

## Context

The Dart app class, MaterialApp title, Android launcher label, and iOS display names all
say "Red Rebels". Labels/display names are independent of bundle IDs, so this is safe
before the Phase 3 identifier switch.

## Implementation notes

- `lib/main.dart` — `RedRebelsApp` → `SoloSalaminaApp` (decl :140, use :84);
  `title: 'SoloSalamina'` (:147).
- Update references: `test/widget_test.dart`, `test/visual_theme_test.dart`,
  `test/tools_test.dart`, `integration_test/qa_helpers.dart:54`.
- `android/app/src/main/AndroidManifest.xml` — `android:label="SoloSalamina"`.
- `ios/Runner/Info.plist` — `CFBundleDisplayName` + `CFBundleName` = "SoloSalamina".

## Acceptance criteria

- [ ] App shows "SoloSalamina" as launcher/app-switcher name on both platforms
- [ ] No `RedRebelsApp` references remain; analyze + tests green
