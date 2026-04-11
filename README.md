# Red Rebels Calendar

A Progressive Web App for Nea Salamina FC (Cyprus), covering football and volleyball fixtures, statistics, and match details throughout the season.

## Features

### Calendar & Match Data
- **Monthly calendar view** -- Browse fixtures by month with easy navigation and a "jump to today" shortcut
- **Multiple layouts** -- Switch between Grid, List, and Cards views for different ways to browse the schedule
- **Match details** -- View opponent, venue, kick-off time, result, scorers, lineups, and set scores for each fixture
- **Opponent scouting** -- Head-to-head record and last meeting shown for upcoming matches
- **Multi-sport support** -- Men's football, men's volleyball, and women's volleyball (including cup competitions)
- **Countdown timer** -- See how long until the next match
- **Filters** -- Filter events by sport, home/away, upcoming/completed, or search by opponent name
- **Export & print** -- Export fixtures to iCalendar (.ics) or print the calendar

### Statistics
- **Season summary** -- Overall record, goals, points, clean sheets, and averages
- **League standings** -- Live table from FotMob with Nea Salamina highlighted
- **Performance split** -- Home vs away record comparison
- **Recent form** -- Last 5 matches with streak tracking
- **Top scorers** -- From FotMob data with league rankings
- **Goal distribution** -- Per-match scored/conceded chart
- **Season progress** -- Points accumulation over time
- **Head-to-head** -- Full record against every opponent
- **Volleyball stats** -- Set breakdown, win patterns, and volleyball-specific metrics

### Visual Themes
- **4 visual themes** -- Choose from Default, Brutalism, Cinema, and Neon HUD in Settings
  - **Default** -- Stadium photo background, Barlow/Barlow Condensed typography, ambient light blobs
  - **Brutalism** -- Solid black background, Space Grotesk font, zero border-radius, 2px borders, scrolling marquee ticker
  - **Cinema** -- Deep gradient background, Inter font, glassmorphism effects, gradient title text, 16px radius
  - **Neon HUD** -- Solid dark background, Orbitron/JetBrains Mono fonts, HUD corner brackets, scanline overlay, neon glow effects
- **Dark / Light mode** -- Each theme supports both dark and light variants
- **Theme-specific bottom nav** -- Solid (Brutalism), glassmorphism (Cinema), neon glow (Neon HUD)

### Notifications
- **Push notifications** -- Get notified of new matches, score updates, and time changes
- **Customisable reminders** -- Choose reminder times (24h, 12h, 2h, 1h before kick-off)
- **Per-sport toggles** -- Enable/disable notifications per sport
- **Alert type control** -- Toggle new events, time changes, and score update notifications independently

### Accessibility & UX
- **Bilingual** -- Available in English and Greek
- **Mobile friendly** -- Responsive layout with swipe navigation and touch-optimised targets
- **Keyboard navigation** -- Full keyboard support with consistent focus rings
- **Screen reader support** -- ARIA labels, live regions, and descriptive alt text
- **Reduced motion** -- Respects `prefers-reduced-motion` system setting
- **System theme detection** -- Respects `prefers-color-scheme` on first visit
- **Onboarding tour** -- Guided walkthrough of all features for new users
- **PWA** -- Installable as a home screen app with offline service worker

## Tech Stack

- **React 19** + **TypeScript 5.9**, built with **Vite 7**
- **Tailwind CSS 4** + CVA for component variants
- **Radix UI** primitives for accessible components
- **React Router v7** (hash-based routing)
- **Recharts** for statistics charts
- **Parse/Back4App** for push subscriptions and user preferences
- **i18next** for EN/EL bilingual support
- **Vitest** + React Testing Library for unit/integration tests (790+ tests)
- **Playwright** for E2E tests

## Development

```bash
cd app
npm install
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run all tests
npm run test:watch   # Tests in watch mode
```

## Data Sources

- **CFA** (cfa.com.cy) -- Football fixtures and results
- **volleyball.org.cy** -- Volleyball fixtures
- **DataProject** (kop-web.dataproject.com) -- Volleyball set scores and top scorers
- **FotMob** -- League standings, top scorers, league rankings, next match, and venue info

Match data is updated via an automated scraper (`app/scripts/scraper/`) that runs as a GitHub Action.
