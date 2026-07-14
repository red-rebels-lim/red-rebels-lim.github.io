# QA-08: Stats sport selector — Material TabBar → wrapping pill buttons

**Status:** todo
**Batch:** stats (`fix/qa-stats`)
**Register rows:** STA-01 (P2)
**Depends on:** -
**Estimated scope:** Small

## Context

Web (`08-stats-football-top-light-en-pwa.png`): three pill buttons that wrap onto two rows
at phone width — `Men's Football` (solid red, white text) / `Men's Volleyball` /
`Women's Volleyball` (light slate pills). No icons.

App: Material TabBar with emoji icons (⚽/🏐) and truncated labels (`Men's Volleybal`,
`Women's Volley`) + red underline. This is also the register's "stats tab labels truncate"
known deviation — the pill redesign eliminates the truncation by construction.

## Ground truth

- `app/src/pages/StatsPage.tsx:93-95` — labels from `t('stats.mensFootball')` etc.
- Pill styling in the web page (Radix Tabs restyled as pills; wrap via flex-wrap).

## Implementation notes

- `flutter/lib/pages/stats_page.dart` — replace `TabBar` with a `Wrap` of pill buttons
  driving the same controller/state; active = solid red pill, inactive = slate pill
  (tokens via `AppColors`); typography matches web (semibold, not condensed).
- Existing i18n keys `stats.mensFootball` / `mensVolleyball` / `womensVolleyball` already
  exist (byte-copied JSONs) — no new keys.
- Keep swipe-between-tabs if present only if the web equivalent exists (it doesn't — web
  switches only by click; remove tab-swipe if it fights the pills, note in PR).

## Acceptance criteria

- [ ] Pills wrap exactly like web at 1080×2400; no truncation in EN or EL
- [ ] Active/inactive colors match tokens; switching updates the tab content
- [ ] `flutter analyze && flutter test` green (selector tests updated)
- [ ] Pairs 08/09 (top frames) re-captured; STA-01 → FIXED
