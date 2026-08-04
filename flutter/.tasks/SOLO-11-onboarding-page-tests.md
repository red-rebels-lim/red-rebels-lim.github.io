# SOLO-11: Onboarding step + news page tests ⚠️ Greek sign-off

**Status:** done (PR #114, merged 2026-08-04)
**Batch:** news (`feat/news-feed`)
**Depends on:** SOLO-10
**Estimated scope:** Small/Medium

## Context

The first-run tour has 7 steps (`lib/widgets/onboarding_tour.dart:19`,
`onboarding.step{1..7}*` keys). A News step should be added — everyone is a fresh install
(pre-release). Page tests follow the established pattern (no `pumpAndSettle` — periodic
timers; fixed `pump(Duration)` loops).

## Implementation notes

- `onboarding_tour.dart:19` — `onboardingStepCount` 7 → 8; `onboarding.step8Title/Desc`
  in both bundles (dialog is unanchored — no layout work). Greek copy for sign-off.
- `test/news_page_test.dart`: `setUpAll` — `TestWidgetsFlutterBinding.ensureInitialized()`,
  `SharedPreferences.setMockInitialValues({})`; load `I18n`/repos outside `testWidgets`;
  `pumpWidget(ChangeNotifierProvider.value(AppState..., MaterialApp(home: NewsPage())))`.
  Assert list titles, empty/error states, tap → reader, share/open bridges invoked
  (stub the injectable function pointers).
- `integration_test/qa_helpers.dart` — update tab-count/onboarding assumptions.

## Acceptance criteria

- [ ] Onboarding shows 8 steps incl. News; Greek copy listed for sign-off
- [ ] News page + reader covered by widget tests; analyze + tests green
