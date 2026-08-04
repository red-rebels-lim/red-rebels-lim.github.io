# SOLO-01: Flutter CI workflow

**Status:** todo
**Batch:** ci (`chore/flutter-ci`)
**Depends on:** -
**Estimated scope:** Small

## Context

No workflow builds/tests the Flutter app — `.github/workflows/ci.yml` is web-only
(`working-directory: app`). With Flutter becoming the sole product (SoloSalamina pivot),
PRs touching `flutter/**` need automated checks before the rebrand/news-feed PRs land.

## Implementation notes

- New `.github/workflows/flutter-ci.yml`: trigger `pull_request` with `paths: ['flutter/**']`.
- `subosito/flutter-action@v2` pinned to a Flutter stable matching `flutter/pubspec.yaml`
  `environment: sdk` (local dev is on Flutter 3.44.8).
- Steps in `working-directory: flutter`: `flutter pub get`, `flutter analyze`, `flutter test`.
- Leave web `ci.yml` untouched.

## Acceptance criteria

- [ ] Workflow runs on PRs touching `flutter/**` only
- [ ] `flutter analyze` + `flutter test` pass in CI on a no-op PR
