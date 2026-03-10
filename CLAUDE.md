# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## General Behavior

When asked to implement a feature or fix, proceed directly to implementation. Do NOT spend extended time in planning/discovery mode unless explicitly asked for a plan. If exploration is needed, timebox it to 2-3 minutes before starting code changes.

## Code Style

When making UI/style changes, match the existing design exactly. Do not introduce color drift, padding changes, or deviate from established patterns. Prefer DRY approaches — extract shared components rather than duplicating styles.

## Before Committing

After making code changes, always verify the build passes before committing. Run:

```bash
cd app
npm run lint
npm test
npm run build
```

The pre-push hook runs these automatically and will block the push if any fail.

## Tech Stack & Constraints

- **React 19 + TypeScript 5.9**, built with **Vite 7**
- **Radix UI** primitives wrapped in `src/components/ui/`
- **Tailwind CSS 4** + CVA for component variants
- **React Router v7** (hash-based routing)
- **Parse/Back4App** for push subscriptions and user preferences
- **i18next** for EN/EL bilingual support
- **Recharts** for statistics charts
- **Vitest + React Testing Library** for unit/integration tests
- **Playwright** for E2E tests
- Package manager: **npm** (not pnpm — ignore the leftover `pnpm-lock.yaml`)

## Project Overview

Red Rebels Calendar is a PWA for Nea Salamina FC (Cyprus) that displays football and volleyball fixtures, statistics, and match details. It supports push notifications for match reminders, dark/light theme, keyboard navigation, and swipe gestures.

## Commands

```bash
# Development (run from app/)
npm run dev              # Vite dev server at http://localhost:5173
npm run build            # tsc -b && vite build
npm run lint             # ESLint check
npm run lint --fix       # Auto-fix lint issues
npm test                 # Vitest single run
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with V8 coverage report
npm run preview          # Preview production build locally
```

## Architecture

```
app/src/
├── components/
│   ├── calendar/         # CalendarGrid, EventCard, EventPopover, MatchReport, CountdownTimer
│   ├── filters/          # FilterPanel
│   ├── layout/           # Navbar, Footer, AppBackground
│   ├── stats/            # OverallStats, LeagueTable, TopScorers, NextMatch, etc.
│   └── ui/               # Radix UI wrappers (button, dialog, sheet, select, etc.)
├── hooks/
│   ├── useCalendar.ts    # Core calendar state and event filtering
│   ├── useCountdown.ts   # Match countdown timer
│   ├── useTheme.ts       # Light/dark theme toggle
│   ├── useKeyboardShortcuts.ts
│   └── useSwipeNavigation.ts
├── lib/
│   ├── fotmob.ts         # FotMob API: live scores, standings, venue info
│   ├── stats.ts          # W/D/L, streaks, head-to-head calculations
│   ├── push.ts           # Web Push subscription
│   ├── preferences.ts    # localStorage + Parse backend for user settings
│   ├── analytics.ts      # Google Analytics + Microsoft Clarity
│   └── ics-export.ts     # iCalendar (.ics) export
├── data/
│   ├── events.ts         # All match data (~6500 lines, updated by scraper)
│   ├── constants.ts      # Venue info, team colors
│   ├── month-config.ts   # Month metadata
│   └── sport-config.ts   # Sport types
├── pages/                # CalendarPage, StatsPage (lazy), SettingsPage (lazy)
├── types/events.ts       # Shared TypeScript interfaces
└── i18n/                 # i18next config + language detection
```

**Data flow:** Static `events.ts` → `useCalendar` hook → `CalendarPage` → grid + cards + popover. Stats come from `lib/stats.ts` (calculations) and `lib/fotmob.ts` (live API).

## Testing

Tests live in `app/src/__tests__/`. Coverage targets: 80%+ branches, 89%+ statements.

### Key patterns

**vi.hoisted() for mock variables referenced inside vi.mock():**
```typescript
const { mockSave } = vi.hoisted(() => ({ mockSave: vi.fn() }));
vi.mock('@/lib/parse', () => ({ /* use mockSave here */ }));
```

**Radix UI portal mocking** (Sheet, DropdownMenu render in portals):
```typescript
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }) => <div>{children}</div>,
  SheetContent: ({ children }) => <div data-testid="sheet-content">{children}</div>,
  SheetTrigger: ({ children }) => <div>{children}</div>,
}));
```

**Fake timers:** Use `vi.advanceTimersByTime()` NOT `vi.runAllTimers()` — the app uses `setInterval` in `useCountdown` which causes infinite loops.

**jsdom stubs for Notification/PushManager:**
```typescript
vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn() });
```

## Environment Variables

All variables use the `VITE_` prefix. Copy `app/.env.example` to `app/.env.local`:

```
VITE_BACK4APP_APP_ID=       # Back4App app ID
VITE_BACK4APP_JS_KEY=       # Back4App JS key
VITE_VAPID_PUBLIC_KEY=      # Web Push VAPID public key
VITE_GA_MEASUREMENT_ID=     # Google Analytics (optional)
VITE_CLARITY_PROJECT_ID=    # Microsoft Clarity (optional)
```

No API keys are needed for basic development — Back4App is only required for push notification features.

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Pull request | Type-check, lint, test, build |
| `deploy.yml` | Push to main | Build + deploy to GitHub Pages |
| `scrape.yml` | Manual | Scrape fixtures, send notifications, open PR |
| `reminders.yml` | Cron every 30min | Send push match reminders |

**CI runs from `app/` directory using npm.** The scraper scripts live in `app/scripts/scraper/` and are tracked in git (not ignored).

## Scraper Scripts

Match data is scraped and committed via the `scrape.yml` workflow:

```
app/scripts/scraper/
├── index.ts                    # Main scraper entry point
├── fotmob-enrichment.ts        # Enriches events with FotMob data
├── cfa-enrichment.ts           # Enriches football events with CFA data
└── dataproject-enrichment.ts   # Enriches volleyball events with DataProject data
```

Scripts use `tsconfig.scripts.json` with `moduleResolution: "bundler"` — import sibling `.ts` files with `.ts` extensions (not `.js`).

## .gitignore Notes

- `app/scripts/scraper/node_modules` — ignored (dependencies)
- `/scripts` — root-level scripts directory ignored (anchored with `/`)
- `app/scripts/` — **tracked** (scraper source files should be in git)
- `.claude/` — gitignored (local agent config, not committed)

## Commit Format

```
type(scope): description

feat(calendar): add match detail popover
fix(scraper): use .ts extensions for enrichment imports
chore(deps): update vitest to 4.0
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
