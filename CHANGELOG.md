# Changelog

## [Unreleased]

### Added
- Lean root `CLAUDE.md` plus nested context files for `app/src/data/`, `app/scripts/scraper/`, `.github/scripts/`
- Skills: `add-team`, `bump-season-year`, `run-scraper-locally` (under `.claude/skills/`)

### Removed
- Viber bot integration (worker handler, reminder loop, sender, webhook registration script, i18n keys) — Viber bots require a commercial partnership since Feb 2024 and are not viable for fan clubs
- Stale planning docs: `app/features.md`, `docs/push-notifications-plan.md`, `docs/volleyball-live-data-research.md`, `app/docs/COMPETITOR_ANALYSIS.md`
- Build/runtime artefacts no longer tracked: `changes.json`, `app/.wrangler/` local state, root `tests/` and `.idea/` directories

### Added
- Mobile calendar redesign with bottom navigation bar (TASK-10)
- MobileCalendarGrid component with swipe navigation and upcoming events list
- UpcomingEventCard component showing match details with sport icons
- BottomNav component for Calendar/Stats/Settings navigation
- MobileHeader shared component with optional back button for sub-pages
- SettingsPage redesign with grouped sections and toggle switches (TASK-11)
- PWA install prompt hook (usePwaInstall)

### Changed
- Unified page headers across Calendar, Stats, and Settings pages using MobileHeader
- StatsPage: removed NextMatch section, reordered Recent Form below Season Summary
- SettingsPage: frosted glass background on section titles for light mode readability
- Replaced inline sport icons with proper SVG icons from SVG Repo (soccer ball, volleyball)
- CalendarPage now renders mobile-optimized layout on small screens
