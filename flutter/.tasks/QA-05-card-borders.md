# QA-05: Event-card / list-row borders — red-tint → slate (+ blue tint for volleyball)

**Status:** todo
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** CAL-04 (P2)
**Depends on:** QA-03 (volleyball blue must land first so the blue tint uses the right token)
**Estimated scope:** Small

## Context

App cards and list rows carry red-tinted borders and red divider lines. The web uses
`border-slate-200 dark:border-slate-800` on event cards, with a **blue** tint for volleyball
cards (register: known deviation reopened, stakeholder approved fixing).

Visible in `07-cards-view-light-en-app.png` (pink card outlines, red internal separators) vs
`-pwa.png` (slate outlines, faint gray separator above the footer). List view separators:
web thin faint lines, app stronger red lines (`06-list-view-*`).

## Ground truth

- Web event-card classes: `border-slate-200 dark:border-slate-800`, volleyball variant blue
  (see `UpcomingEventCard` / cards components under `app/src/components/calendar/`).
- Captures 06/07 (light), 22 (Greek dark cards).

## Implementation notes

- `flutter/lib/widgets/event_card.dart`, `widgets/calendar_list_view.dart`,
  `widgets/calendar_cards_view.dart` — replace red-tinted `Border`/`Divider` colors with
  slate tokens from `AppColors` (add tokens if missing — values from `index.css`).
- Squad rows have the same disease but belong to QA-12 (squad batch) — don't fix here.

## Acceptance criteria

- [ ] Cards/list borders + separators match web in light and dark
- [ ] Volleyball cards blue-tinted like web
- [ ] `flutter analyze && flutter test` green
- [ ] Pairs 06/07 re-captured; CAL-04 → FIXED
