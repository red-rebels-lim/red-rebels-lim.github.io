# QA-21: Phase 10 gaps — opponent scout, sports filter, notification preview, calendar sync/export

**Status:** todo
**Batch:** functional-gaps (`fix/qa-functional`) — plan **Phase 10** items surfaced as findings
**Register rows:** EVT-12 (P2), SET-05 (P2), SET-04 (P2), SET-03 (P2), SET-06 export half (P2)
**Depends on:** QA-06 (sheet restyle), QA-13 (settings shell)
**Estimated scope:** Large (four features; consider sub-PRs inside the batch)

## Context — four missing web features, all pre-planned in IMPLEMENTATION_PLAN Phase 10

1. **EVT-12 Opponent Scout.** Web event sheet has an opponent-scout section/popover tab:
   opponent recent form + head-to-head vs us. Not captured this session (find the trigger in
   the web sheet component and screenshot the PWA first). App has nothing.
2. **SET-05 Sports Filter.** Web settings section: `Football` / `Volleyball` red toggles
   with icon tiles (`13b-*-pwa`), persisted as `sport_filters`, filtering calendar, stats
   and squad globally. Port storage key semantics from the web (`lib/preferences`).
3. **SET-04 Notification Preview.** Expandable `NOTIFICATION PREVIEW` footer row in the
   notifications card showing sample notification content (web SET-10 PRD row). Expand it
   on the PWA and capture before building.
4. **SET-03 / SET-06 Calendar Sync + Export.** Web has (a) a `Calendar Sync` channel toggle
   — "Auto-sync to your calendar app" — and (b) `TOOLS → Export Calendar` (`13b-*-pwa`).
   The app shipped only per-match add-to-calendar (Phase 6, via the injectable
   `addEventToDeviceCalendar` bridge). Add the settings rows; native behavior = webcal/ics
   subscription or add-all-upcoming per plan Phase 10 ("calendar-feed subscription…
   complements Phase 6's single-match add"). `Print Calendar` is explicitly **out** —
   stakeholder decision (QA-25).

## Ground truth

- Web: settings components, `app/src/lib/preferences.ts` (`sport_filters` key),
  `public/calendar.ics` + `calendar-el.ics` feeds (generated at build), event-sheet scout UI.
- Captures 13/13b for settings; new captures needed for scout + preview (drive the PWA).

## Implementation notes

- Respect the i18n rule: the flutter JSONs are byte-copies of `app/src/i18n/*.json`, so all
  strings for these features **already exist** — no sign-off needed unless a key is missing
  (then stop and ask).
- Sports filter must actually filter calendar/stats/squad — wire through
  `state/app_state.dart`, mirror web behavior for empty states.
- Calendar feed URLs: `https://red-rebels.com/calendar.ics` / `calendar-el.ics`.

## Acceptance criteria

- [ ] Each feature matches a fresh PWA capture of the same state, EN + EL
- [ ] Sports filter persists and filters all three surfaces like web
- [ ] `flutter analyze && flutter test` green with tests per feature (bridge-mocked)
- [ ] Register rows EVT-12, SET-03/04/05, SET-06(export) → FIXED
