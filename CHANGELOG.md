# Changelog

## [Unreleased]

### Removed
- FotMob feed on the stats page (League Standing, Top Scorers, League Rankings) — it kept serving last season after promotion; the sections show the standard empty state until they are generated from our own saved match results (planned)

### Changed
- Season rolled to 26/27: season window is now July→June (pre-season friendlies open the season), constants/labels bumped across web + Flutter, last season's events reset (25/26 preserved in git history), competition label now "Cyprus 1st Division" / "Κύπρος Α' Κατηγορία"
- Stats render FotMob-style zeroed tables at season start; all-day (TBD-time) calendar events now carry STATUS:TENTATIVE in the .ics feed
- `bump-season-year` skill split in two: a mechanical rollover skill (July→June season window, zero-state stats, no external IDs needed) and a new `gather-season-schedule` skill for wiring the scraper once CFA/volleyball/DataProject publish the season's IDs
- Squad updated to the 2026/27 First Division roster (source: Transfermarkt, 2026-07-17): 18 departures marked inactive (historical 25/26 stats keep resolving), 11 signings/promotions added with position, DOB, nationality, and join date

### Added
- Pre-season friendlies (club announcement 2026-07-17): 4 away games in Poland (Jul 21–27) and 4 vs Cypriot sides (Aug 5–15), with a new `friendly` competition type — sky badge in web and Flutter calendars, excluded from season stats, skipped by the reminder cron until kick-off times are announced
- Team assets for the friendly opponents (AKS 1947 Busko-Zdrój, Korona Kielce, Radomiak Radom, Termalica, ENP, Krasava ENY) and for the newly promoted first-division opponents (Aris Lemesou, Ethnikos Achnas, Omonoia Aradippou, Pafos FC)
- Braydon Manu to the squad (club announcement 2026-07-20): Ghanaian winger, ex-Darmstadt 98 / Hallescher FC, from Akritas Chlorakas — with Transfermarkt portrait, Flutter players.json regenerated
- First official training of 2026/27 as a calendar event (club announcement 2026-07-10): Friday 31 July, 19:00, Ammochostos stadium, open to fans — `meeting` event, preserved across scraper runs
- Volleyball squads on the Squad page (source: neasalamina.com/volley-roster, 2026-07-20): 15 women + 13 men with photos, shirt numbers, and volleyball positions (Setters / Outside Hitters / Opposites / Middle Blockers / Liberos); a sport selector (same pills as the stats page) switches between the three teams in both web and Flutter — volleyball rows and sheets are bio-only until per-player volleyball stats exist

### Removed
- TEMPORARY July 18 widget-testing fixture vs Karmiotissa (#100) — superseded by the real friendlies as widget verification data
- Android widget: team crests in the compact 4×1 layout (VS row with date/venue, text fallback when a crest asset is missing); widget now resizable down to 1-cell height
- `## Project Status` section in root README, regenerable via `/project-status`
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
