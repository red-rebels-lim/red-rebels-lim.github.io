# Changelog

## [Unreleased]

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
