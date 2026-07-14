# QA-06: Event sheet visual parity — tint, chips, pills, labels, CTA, tabs

**Status:** todo
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** EVT-01 (P1), EVT-02 (P2), EVT-03 (P2), EVT-05 (P3), EVT-06 (P3), EVT-07 (P3), EVT-08 (P3), EVT-09 (P3), EVT-10 (P3), EVT-11 (P3)
**Depends on:** QA-03
**Estimated scope:** Large — the biggest single visual task

## Context

Ten sheet findings, all in `flutter/lib/widgets/event_details_sheet.dart`. Reference
captures: `04-sheet-football-top-light-en-*` (loss), `05-sheet-volleyball-top-light-en-*`
(win, cup), `15-sheet-penalties-light-en-*` (cup + shootout + fallback logo), `17` (dark).

Per finding, web → app:

1. **EVT-01 (P1) result tint.** Web tints the *entire sheet surface* by result — pale red
   `#fdf1f1`-ish for a loss, pale green for a win, with a soft gradient toward the bottom.
   App sheet is plain white (dark: plain dark). Add a result-driven surface color (tokens in
   `AppColors`; sample exact values from `index.css` / computed styles, not from screenshots).
2. **EVT-02 (P2) chips row.** Web rows under the competition line:
   - football league match: `✈️ Away` chip + `📍 <venue>` pill + share round button
   - volleyball cup: `🏠 Home` + `⏰ 18:30` + yellow `🏆 Cup` chip + share
   - penalties cup tie: `🕐 90+3'` + `✈️ Away`, second row `📍 <venue>` + `🏆 Cup` + share
   App shows only `🚌 Away` + share; venue becomes a plain text line; **and app adds a date
   line the web sheet never shows**. Port: time chip, venue pill, Cup chip, plane emoji
   (web uses ✈️ not 🚌), remove the date line.
3. **EVT-03 (P2) competition label.** Web: `CYPRUS 2ND DIVISION · MATCHDAY 1` (league name
   even for cup ties, cup-ness carried by the chip). App: `CUP · MATCHDAY 1`. Match the web
   string source (`lib/translate.ts` league naming → flutter i18n equivalent keys).
4. **EVT-05 (P3) sheet title.** Web volleyball sheet titles with the fixture
   (`NEA SALAMIS VS AEL`); football uses `MATCH RESULT`. App always `MATCH RESULT`.
   Check the web component for the exact rule (likely title = event title when present).
5. **EVT-06 (P3).** `Penalties: 1-3` amber on web (`15-*-pwa`), gray in app.
6. **EVT-07 (P3).** WIN/LOSS pill: web filled pale tint, no border; app outlined.
7. **EVT-08 (P3).** Missing-crest fallback: web generic shield glyph; app letter avatar in
   pink circle (`15-*`: Krasava Ypsona). Port the shield (`widgets/team_logo.dart`).
8. **EVT-09 (P3).** `VIEW ALL STATISTICS` CTA visible within the web sheet's initial
   height; app hides it below the fold — raise initial `DraggableScrollableSheet` extent or
   pin the CTA.
9. **EVT-10 (P3).** App adds a Material drag handle; web has none. Remove (keep drag
   behavior).
10. **EVT-11 (P3).** Tabs (GOALSCORERS/BOOKINGS/LINEUPS/SUBS): web compact, left-aligned,
    short red underline; app full-width Material TabBar. Restyle (`TabBar isScrollable` +
    web paddings). Volleyball `SETS` tab: web left-aligned too (`05-*-pwa`).

## Ground truth

- Web sheet component under `app/src/components/calendar/` (event details / match result
  sheet — find via `MATCH RESULT` i18n key usage).
- Captures 04/05/15/17.

## Acceptance criteria

- [ ] Win/loss/dark sheets side-by-side identical: tint, chips, pills, labels, fallback logo
- [ ] No date line; venue pill; time + Cup chips present where web shows them
- [ ] CTA visible without scrolling at initial sheet height
- [ ] Tabs restyled; no drag handle
- [ ] `flutter analyze && flutter test` green; sheet widget tests extended (tint per result,
      chip set per event shape, title rule)
- [ ] Pairs 04/05/15/17 re-captured; EVT-01/02/03/05/06/07/08/09/10/11 → FIXED
