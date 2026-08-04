# Flutter Task Tracker

## SoloSalamina rebrand + news feed (Aug 2026)

Partnership with solosalamina.com: rebrand Red Rebels → SoloSalamina and add an in-app
news feed from their WordPress REST API. Flutter is now the sole product (web sunsets
later). Full plan context: the SOLO task files below.

| Batch (branch) | Tasks | Gate |
|---|---|---|
| ci (`chore/flutter-ci`) | SOLO-01 | — |
| rebrand (`feat/solosalamina-rebrand`) | SOLO-02…SOLO-05 | Greek copy sign-off (SOLO-04) |
| news (`feat/news-feed`) | SOLO-06…SOLO-11 | Greek copy sign-off (SOLO-09/11) |
| ids (`feat/solosalamina-ids`) | SOLO-12…SOLO-14 | **blocked**: user-supplied Firebase configs for `com.solosalamina.app` |
| icons (`feat/solosalamina-icons`) | SOLO-15 | **blocked**: user-supplied logos |

| ID | Title | Batch | Status | Depends on |
|----|-------|-------|--------|------------|
| SOLO-01 | Flutter CI workflow | ci | done (#112) | - |
| SOLO-02 | Dart package rename → solo_salamina | rebrand | done (#113) | - |
| SOLO-03 | App class + display names | rebrand | done (#113) | SOLO-02 |
| SOLO-04 | i18n brand strings ⚠️ Greek sign-off | rebrand | done (#113) | - |
| SOLO-05 | Rebrand straggler sweep | rebrand | done (#113) | SOLO-02..04 |
| SOLO-06 | NewsArticle model + fixture | news | done (#114) | - |
| SOLO-07 | NewsRepository | news | done (#114) | SOLO-06 |
| SOLO-08 | AppState news wiring | news | done (#114) | SOLO-07 |
| SOLO-09 | News list page + 5th tab ⚠️ | news | done (#114) | SOLO-08 |
| SOLO-10 | Article reader + share | news | done (#114) | SOLO-09 |
| SOLO-11 | Onboarding step + news page tests ⚠️ | news | done (#114) | SOLO-10 |
| SOLO-12 | Android identity → com.solosalamina.app | ids | blocked | Firebase delivery |
| SOLO-13 | iOS identity → com.solosalamina.app | ids | blocked | Firebase delivery |
| SOLO-14 | firebase_options regen + QA script PKG | ids | blocked | SOLO-12, SOLO-13 |
| SOLO-15 | Icon regeneration + logo art | icons | done (#115, site assets) | - |

---

# PWA-Parity QA Fixes — Task Tracker (done, July 2026)

## Overview

Phase 3 of [docs/native-apps/QA-PARITY-HANDOFF.md](../../docs/native-apps/QA-PARITY-HANDOFF.md):
close every finding in [docs/native-apps/QA-COMPARISON.md](../../docs/native-apps/QA-COMPARISON.md)
(the register — 47 findings, reviewed and approved by the stakeholder 2026-07-14).

**Mission**: the Flutter app must be an *exact copy* of the web PWA's mobile experience.
Ground truth = the installed PWA on the same emulator + web sources under `app/src/**`
(tokens in `app/src/index.css`).

## Rules (every task)

- One branch/PR **per batch** (not per task): `fix/qa-calendar`, `fix/qa-stats`,
  `fix/qa-squad`, `fix/qa-settings`, `fix/qa-themes`, `fix/qa-functional`.
- Gates before PR: `cd flutter && flutter analyze && flutter test` (221 tests at baseline —
  keep green, add coverage for what you change).
- Re-capture the affected PWA/app screenshot pairs on the emulator after the fix
  (capture procedure + coordinates in the handoff §Emulator mechanics) and update the
  register row status to `FIXED (<PR>)`.
- PR body references the register rows it closes.
- Theming only through `AppColors` / `condensed()` in `lib/theme.dart` — no hardcoded values
  in widgets. UI strings only via `app.t()` with existing i18n keys (new keys need
  stakeholder sign-off).
- All 10 NEEDS-STAKEHOLDER-DECISION rows were answered on 2026-07-14 — decisions and their
  consequences are logged in QA-25; the owning tasks below already reflect them.

## Batch → task map

| Batch (branch) | Tasks | Register rows |
|---|---|---|
| calendar (`fix/qa-calendar`) | QA-01…QA-07 | GLB-01/02/03/04/05/06/07, CAL-01/04/05/06, EVT-01…EVT-11 |
| stats (`fix/qa-stats`) | QA-08…QA-11 | STA-01…STA-06 (volleyball part), STA-08/09/10 |
| squad (`fix/qa-squad`) | QA-12 | SQD-01/02/03 |
| settings (`fix/qa-settings`) | QA-13…QA-15 | SET-01/07/09, GRK-01/02 |
| themes (`fix/qa-themes`) | QA-16…QA-19 | THM-01/02/03/04/05/06/07/08 |
| functional-gaps (`fix/qa-functional`) | QA-20…QA-22, QA-26, QA-24 | STA-07, STA-06 (football), EVT-12, SET-04/05/06(export), FUN-01/02 |
| decision log (done) | QA-25 | GLB-02, CAL-02/03, SET-02/03, SET-06 (print), SET-08, GRK-01, THM-04/07, FUN-02/03 — all answered 2026-07-14 |

## Overlap with the previously planned phases (IMPLEMENTATION_PLAN.md)

Findings that the old roadmap already covers — build them as those phases, then mark the
register rows fixed:

| Register row | Planned phase | Note |
|---|---|---|
| STA-07 (League Standing, League Rankings, football Top Scorers, Next Match) | **Phase 8** | Entire finding = Phase 8 scope |
| STA-06 football half (FotMob top-scorer list) | **Phase 8** | Volleyball half is local data — fixable now in QA-11 |
| EVT-12 (opponent scout in event sheet) | **Phase 10** | |
| SET-03 (Calendar Sync channel) | **Phase 10** | webcal / calendar-feed subscription item |
| SET-04 (notification preview) | **Phase 10** | |
| SET-05 (global sports filter in settings) | **Phase 10** | |
| SET-06 (Export Calendar) | **Phase 10** | Print Calendar half is a stakeholder decision |

Phase 10's "goal distribution chart" and "volleyball streaks card" produced **no** register
rows — the web mobile stats tabs don't render them either. Phase 9 (widget) is orthogonal.
Everything else in the register (~40 rows) is new QA-only work not covered by any planned phase.

## Tasks

| ID | Title | Batch | Status | Depends on |
|----|-------|-------|--------|------------|
| QA-01 | System chrome: status bar, theme icon, back button, view glyphs, share removal | calendar | done (PR #84) | - |
| QA-02 | Background overlay darkness + per-page panel structure | calendar | done (PR #84) | - |
| QA-03 | Volleyball accent color: purple → blue everywhere | calendar | done (PR #84) | - |
| QA-04 | Calendar grid: blank leading cells + day-card nits | calendar | done (PR #84) | - |
| QA-05 | Event-card / list-row borders: red-tint → slate (+ volleyball blue tint) | calendar | done (PR #84) | QA-03 |
| QA-06 | Event sheet visual parity (tint, chips, pills, labels, CTA, tabs) | calendar | done (PR #84) | QA-03 |
| QA-07 | Goalscorers tab: per-team side layout | calendar | done (PR #84) | QA-06 |
| QA-08 | Stats sport selector: TabBar → wrapping pill buttons | stats | done (PR #86) | - |
| QA-09 | Stats section design: cards → frosted-panel sections, web order, drop extras | stats | done (PR #86) | QA-08 |
| QA-10 | Stats section content: season summary, set breakdown, performance split, form subtitle | stats | done (PR #86) | QA-09 |
| QA-11 | Top scorers rows (volleyball) + head-to-head table styling | stats | done (PR #86) | QA-09 |
| QA-12 | Squad borders, player-sheet tile wrap + close X | squad | done (PR #87) | - |
| QA-13 | Settings structure: section chips + white cards + icon tiles | settings | done (PR #88) | - |
| QA-14 | Settings controls: language row, version string | settings | done (PR #88) | QA-13 |
| QA-15 | Greek: "Γλώσσα" wrap + strip tonos on uppercase | settings | done (PR #88) | QA-14 |
| QA-16 | Brutalism: square corners + 2px borders | themes | done (PR #90) | - |
| QA-17 | Cinema: typography, two-tone brand, plain buttons, animated blobs | themes | done (PR #90) | - |
| QA-18 | Neon: cyan active nav, panel fill, numerals, today cell, animated scanlines | themes | done (PR #90) | - |
| QA-19 | Theme fonts: brand title truncation | themes | done (PR #90) | QA-17 |
| QA-20 | Phase 8: FotMob blocks (standings, rankings, top scorers, next match) | functional | done (PR #94) | - |
| QA-21 | Phase 10 gaps: opponent scout, sports filter, notification preview, calendar export | functional | done (PR #93) | QA-06, QA-13 |
| QA-22 | Cold-start hang: verify launch sync is non-blocking | functional | done (PR #92) | - |
| QA-23 | Share output comparison | functional | cancelled (sharing removed per GLB-02 decision) | - |
| QA-26 | First-run anchored tour (7-step, EN+EL, replaces intro dialog) | functional | done (PR #95) | QA-01, QA-13 |
| QA-24 | Full re-capture + register close-out (Phase 4 exit) | functional | done (PR #97 — Phase 4 exit) | all |
| QA-25 | Stakeholder decision log (10 rows) | - | done (answered 2026-07-14) | - |
