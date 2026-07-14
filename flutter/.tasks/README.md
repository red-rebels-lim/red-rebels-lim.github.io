# PWA-Parity QA Fixes — Task Tracker

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
- Rows classified NEEDS-STAKEHOLDER-DECISION are **blocked** until answered — tracked in
  TASK-QA-20; don't start them, don't silently resolve them inside another task.

## Batch → task map

| Batch (branch) | Tasks | Register rows |
|---|---|---|
| calendar (`fix/qa-calendar`) | QA-01…QA-07 | GLB-01/03/04/05/06/07, CAL-01/04/05/06, EVT-01…EVT-11 |
| stats (`fix/qa-stats`) | QA-08…QA-11 | STA-01…STA-06 (volleyball part), STA-08/09/10 |
| squad (`fix/qa-squad`) | QA-12 | SQD-01/02/03 |
| settings (`fix/qa-settings`) | QA-13…QA-15 | SET-01/07/08/09, GRK-02 |
| themes (`fix/qa-themes`) | QA-16…QA-19 | THM-01/02/03/05/06/08 |
| functional-gaps (`fix/qa-functional`) | QA-20…QA-24 | STA-07, STA-06 (football), EVT-12, SET-03/04/05/06, FUN-01/03 |
| decisions (blocked) | QA-25 | GLB-02, CAL-02/03, SET-02, SET-06 (print), SET-08 (system option), GRK-01, THM-04/07, FUN-02 |

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
| QA-01 | System chrome: red status bar, theme-icon semantics, back button, view glyphs | calendar | todo | - |
| QA-02 | Background overlay darkness + per-page panel structure | calendar | todo | - |
| QA-03 | Volleyball accent color: purple → blue everywhere | calendar | todo | - |
| QA-04 | Calendar grid: blank leading cells + day-card nits | calendar | todo | - |
| QA-05 | Event-card / list-row borders: red-tint → slate (+ volleyball blue tint) | calendar | todo | QA-03 |
| QA-06 | Event sheet visual parity (tint, chips, pills, labels, CTA, tabs) | calendar | todo | QA-03 |
| QA-07 | Goalscorers tab: per-team side layout | calendar | todo | QA-06 |
| QA-08 | Stats sport selector: TabBar → wrapping pill buttons | stats | todo | - |
| QA-09 | Stats section design: cards → frosted-panel sections, web order, drop extras | stats | todo | QA-08 |
| QA-10 | Stats section content: season summary, set breakdown, performance split, form subtitle | stats | todo | QA-09 |
| QA-11 | Top scorers rows (volleyball) + head-to-head table styling | stats | todo | QA-09 |
| QA-12 | Squad borders, player-sheet tile wrap + close X | squad | todo | - |
| QA-13 | Settings structure: section chips + white cards + icon tiles | settings | todo | - |
| QA-14 | Settings controls: language row, dark-theme toggle, version string | settings | todo | QA-13 |
| QA-15 | Greek: "Γλώσσα" mid-word wrap | settings | todo | QA-14 |
| QA-16 | Brutalism: square corners + 2px borders | themes | todo | - |
| QA-17 | Cinema: typography, two-tone brand, plain header buttons | themes | todo | - |
| QA-18 | Neon: cyan active nav, grid panel fill, day numerals, today cell | themes | todo | - |
| QA-19 | Theme fonts: brand title truncation | themes | todo | QA-17 |
| QA-20 | Phase 8: FotMob blocks (standings, rankings, top scorers, next match) | functional | todo | - |
| QA-21 | Phase 10 gaps: opponent scout, sports filter, notification preview, calendar sync/export | functional | todo | - |
| QA-22 | Cold-start hang: verify launch sync is non-blocking | functional | todo | - |
| QA-23 | Share output: capture + compare both share texts | functional | todo | - |
| QA-24 | Full re-capture + register close-out (Phase 4 exit) | functional | todo | all |
| QA-25 | Stakeholder decisions holding pen (10 register rows) | - | blocked | stakeholder |
