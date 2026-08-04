# SOLO-02: Dart package rename → solo_salamina

**Status:** done (PR #113, merged 2026-08-04)
**Batch:** rebrand (`feat/solosalamina-rebrand`)
**Depends on:** -
**Estimated scope:** Small (mechanical, wide diff)

## Context

SoloSalamina rebrand. `flutter/pubspec.yaml` names the package `red_rebels_calendar`.
`lib/` uses relative imports; only `test/` + `integration_test/` import via
`package:red_rebels_calendar/` (~120 lines).

## Implementation notes

- `pubspec.yaml:1-2` — `name: solo_salamina`; description
  "SoloSalamina — Nea Salamina match calendar, stats & news for Android & iOS."
- Mechanical rewrite `package:red_rebels_calendar/` → `package:solo_salamina/` across
  `test/**` and `integration_test/**` in an **isolated commit** for review.

## Acceptance criteria

- [ ] `grep -r "red_rebels_calendar" flutter/test flutter/integration_test` → empty
- [ ] `flutter analyze && flutter test` green
