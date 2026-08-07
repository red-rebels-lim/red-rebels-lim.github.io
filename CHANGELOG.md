# Changelog

## [Unreleased]

### Added
- Notification storage moved to D1 (DATA-11): new validated Worker endpoints `/api/push/register|prefs|unregister` (light per-IP rate limiting) replace the world-readable Back4App classes; the Telegram webhook now stores subscribers in D1; a one-time export script preserves Parse objectIds so ids persisted by installed clients keep working

### Changed
- The Payload/D1 database is now the source of truth, managed by humans through the admin dashboard — automated writes are retired (the scraper dual-write and its post-merge sync workflow, added earlier in this cycle, were removed after one supervised run; a future MCP tool over the Payload API will take their place). Production seeding now requires an explicit `SEED_ALLOW_PRODUCTION=1` override.

### Added
- Scraper dual-write (DATA-09): every scrape now syncs the merged result to the Payload/D1 database as well as events.ts, porting the battle-tested merge protections (played results frozen, locked/manual/live fixtures untouched, enrichment fills but never replaces, unknown opponents abort) — with a feed-parity workflow step verifying the production feed reflects every scraped value **(superseded — see Changed)**
- Live match updates: editing a fixture in the Payload dashboard now shows up on the public feeds within seconds — every data write bumps a version the Worker keys its edge cache on — plus a new tiny `/live.json` endpoint listing in-play matches with live score/sets (DATA-08)
- `/events.json` and `/players.json` are now served dynamically from D1 by the rrcalendar Worker (60s edge cache; automatic fallback to the static build artifacts on any D1 failure) — every shipped app gets DB-backed data with no app update; a new worker-parity CI step proves the dynamic feeds match the frozen JSON contract (DATA-07)
- Re-runnable Flutter QA suite: 34 scenario-tagged integration tests + 7 synthetic datasets (`flutter/integration_test/`), `tool/qa/` orchestration scripts (run-suite, dataset injection, device pass, artifact collection), native-apps TEST-PLAN, and the 2026-07-27 test-run report (findings #11–#20; binary evidence kept local)
- Flutter app: portrait-only lock and full-immersive fullscreen (Android + iOS), with gesture-bar insets on event/player/filter sheets

### Fixed
- Aug 5 friendly vs ΟΜΟΝΟΙΑ 29ΗΣ ΜΑΪΟΥ corrected to a home game at 19:30 (Ammochostos stadium) — was listed as away with no kick-off time
- Away matches showed our lineup/scorers/bookings under the opponent's column header — columns now follow the header row (match home team left) on **both** web `EventPopover` and Flutter event sheet (QA #11)
- Flutter: event-sheet "View All Statistics" now opens the stats page on the match's sport instead of the last-selected tab (QA #12)
- Flutter: calendar grid no longer swallows vertical drags — grid view is one page-level scrollable, so the selected-day list is reachable on short screens (QA #19)
- Flutter: system back on Stats/Squad/Settings pops to Calendar first instead of exiting the app (QA #14)
- Flutter: Greek uppercase tonos-stripping now handles ΐ/ΰ (widget showed "ΜΑΪ́ΟΥ") (QA #18)
- Flutter: confirm dialog before disabling push notifications, matching web (QA #17)
- Flutter: 2 stale unit tests now run on seeded fixtures instead of live-data assumptions (QA #13)

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
- Andreas Panagiotou Filiotis to the squad (club announcement 2026-07-24): Cypriot right-back, ex-Omonia / Pafos / Apollon, from AEL Limassol on a 1+1 deal — with Transfermarkt portrait, Flutter players.json regenerated
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
