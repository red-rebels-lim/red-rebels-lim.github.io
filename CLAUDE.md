# CLAUDE.md

Lean context for Claude Code working on the Red Rebels Calendar.
Only things you would otherwise get wrong are recorded here.

## Stack at a glance

- React 19 + TypeScript 5.9 + Vite 7 (in `app/`); Tailwind 4 + Radix; React Router v7 **BrowserRouter** (not hash).
- PWA via `vite-plugin-pwa` injectManifest; service worker source: `app/src/sw.ts`.
- Cloudflare **Worker** (not Pages) named `rrcalendar`; entry `app/src/_worker.ts` handles `/api/*` webhooks, everything else falls through to static `ASSETS` with SPA `not_found_handling`.
- Backend: Parse SDK pointed at Back4App (`https://parseapi.back4app.com/`). Classes: `PushSubscription`, `NotifPreference`, `TelegramSubscriber`, `ReminderLog`.
- Package manager: npm, run from `app/`.

## Build & deploy

- Local dev: `cd app && npm run dev` (Vite at `:5173`). Worker preview: `npm run preview` (build + `wrangler dev`).
- Build: `npm run build` runs `generate:calendar` → `tsc -b` → `vite build`. The first step rewrites `public/calendar.ics` and `public/calendar-el.ics` (gitignored).
- Deploy: production deploys are wired through the **Cloudflare dashboard's git integration** (not a GitHub Action in this repo). Pushing to `main` triggers Cloudflare's build + deploy. For local manual deploys (rare), `npm run deploy` = `npm run build && wrangler deploy` with appropriate `wrangler` auth. For a hotfix, prefer pushing a PR through main rather than running `wrangler deploy` directly — the dashboard pipeline is the source of truth.
- Pre-push hook (`app/.husky/pre-push`) runs lint + test + build. Don't `--no-verify`.
- Never push directly to `main`. Always open a PR.

## CI workflows

| File | Trigger | What it does | What it does NOT do |
|---|---|---|---|
| `ci.yml` | PR | type-check, lint, test, build | does not run e2e, does not deploy |
| `scrape.yml` | manual (`workflow_dispatch`) | runs scraper, sends notifications, opens PR with updated `events.ts` | not on a schedule |
| `reminders.yml` | cron `*/30 * * * *` | sends Web Push + Telegram reminders for matches in next 25h | does not touch repo |

## Directory map

```
app/                       # the application — work here
  src/
    _worker.ts             # CF Worker entry: /api/telegram-webhook
    sw.ts                  # service worker (push notifications)
    App.tsx                # router (BrowserRouter)
    pages/                 # CalendarPage, StatsPage (lazy), SettingsPage (lazy)
    components/{calendar,stats,filters,layout,ui}/
    hooks/                 # useCalendar, useCountdown, useTheme, ...
    lib/                   # fotmob, stats, volleyball-stats, push, parse, preferences,
                           #   ics-core (pure), ics-export (browser), translate, analytics
    data/                  # events.ts (GENERATED), constants, month-config, sport-config
    types/events.ts        # SportEvent, CalendarEvent, all stat types
    i18n/{en,el}.json      # all UI strings + fotmob name lookup tables
  scripts/
    generate-calendar.ts   # build-time .ics generator
    scraper/               # standalone Node project (own package.json, own node_modules)
    register-telegram-webhook.sh
  e2e/                     # Playwright specs — GITIGNORED, local only, not run in CI
  public/                  # static assets; calendar.ics files generated at build
.github/
  workflows/{ci,scrape,reminders}.yml
  scripts/                 # standalone Node project for cron reminders + push
docs/, app/docs/           # planning notes (not load-bearing)
app/.tasks/                # sprint tracker tied to app/.claude/skills/start-task etc.
```

Three separate `package.json` files: `app/`, `app/scripts/scraper/`, `.github/scripts/`. CI installs each separately. Don't add scraper deps to the app bundle.

## Domain glossary

- **Νέα Σαλαμίνα** appears in three canonical forms — keep them straight:
  - `'Νέα Σαλαμίνα'` (mixed case) — display constant, `data/constants.ts`.
  - `'ΝΕΑ ΣΑΛΑΜΙΝΑ'` (uppercase) — events.ts opponent strings + translate.ts lookup key.
  - `'ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ'` (full name) — scraper team filter against CFA HTML.
- Team data is stored Greek-uppercase in `events.ts`. English keys live under `i18n/*.json#fotmob.teams.*`. Translation goes Greek string → key (via `lib/translate.ts`) → i18n value.
- Sports: `'football-men' | 'volleyball-men' | 'volleyball-women' | 'meeting'`. Football is men-only; volleyball is gendered.
- Match status enum is only `'played' | 'upcoming'` — there is no `cancelled` or `postponed`. If you need to model a postponement, ask first.
- Competition: `'league' | 'cup'`. Cup matches may set `penalties: "1-3"`.
- Season constants live in `app/src/data/constants.ts` (`SEASON_START_YEAR`, `SEASON_END_YEAR`). Sept–Dec belongs to start year, Jan–Aug to end year. **Bumping the season also requires updating scraper URLs and competition IDs — see `app/scripts/scraper/CLAUDE.md`.**
- Scorer name annotations like `"... (Πέναλτι)"` in `events.ts` are intentional. `translatePlayerName` strips the parens before lookup. Don't sanitise them.

## Conventions that hold

- Path alias `@/` → `app/src/` everywhere (Vite, vitest, tsconfig). The build-time scripts also use it via `tsconfig.scripts.json`.
- Scraper TS files import siblings with `.ts` extensions (NOT `.js`) — this is `moduleResolution: "bundler"` in `tsconfig.scripts.json`.
- Tests in `app/src/__tests__/` use Vitest. `vi.hoisted()` for mocks referenced inside `vi.mock()`. Use `vi.advanceTimersByTime()`, never `vi.runAllTimers()` (the countdown's `setInterval` causes an infinite loop).
- Radix portals (Sheet, DropdownMenu) need to be mocked in tests — see existing tests for the pattern.
- New external script/host = update CSP in `app/index.html` (hardcoded meta tag).
- Style changes match existing tokens. Don't drift colours, padding, radius. Prefer extracting shared components to duplicating styles.

## Env vars / secrets

| Var | Where | What |
|---|---|---|
| `VITE_BACK4APP_APP_ID`, `VITE_BACK4APP_JS_KEY` | `app/.env.local` | Public Parse client keys |
| `VITE_VAPID_PUBLIC_KEY` | `app/.env.local` | Web Push subscription |
| `VITE_GA_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID` | `app/.env.local` (optional) | Analytics |
| `BACK4APP_APP_ID`, `BACK4APP_REST_API_KEY`, `TELEGRAM_BOT_TOKEN` | Cloudflare Secrets Store (binding in `wrangler.jsonc`) | Worker runtime |
| `BACK4APP_APP_ID`, `BACK4APP_MASTER_KEY`, `VAPID_*`, `TELEGRAM_BOT_TOKEN` | GitHub Actions secrets | Cron + scraper |

`app/.env.example` is the source of truth for client-side vars. Empty values are fine for local dev — Back4App is only needed for push features.

## Known gotchas

- **`events.ts` is generated AND externally parsed.** The cron at `.github/scripts/send-reminders.js:60` does `new Function('return ' + match[1])` on the file contents. TS-only constructs (`as const`, `satisfies`, type assertions, computed keys) will silently break the cron — CI doesn't catch this. See `app/src/data/CLAUDE.md`.
- **`events.ts` is regenerated wholesale** by the scraper. Don't hand-edit unless you've checked the scraper's merge logic — it can clobber your changes on the next run. If a fixture has been officially announced by CFA / volleyball.org.cy / DataProject, prefer running the scraper (`scrape.yml` workflow_dispatch, or locally) over hand-adding the entry.
- **Repo name is misleading.** `red-rebels-lim.github.io` looks like GH Pages. It isn't — see Build & deploy.
- **Don't add a Viber channel.** Viber bots have required a commercial partnership since Feb 2024 — not viable for fan clubs. The previous Viber code was removed; don't reintroduce it without confirming the partnership status.
- **Coverage thresholds (80%/89%) are aspirational** — not enforced in `vitest.config.ts` or CI.
- E2E tests live in `app/e2e/` but are **gitignored** and not run in CI. Treat them as local exploration.

## Do NOT touch without asking

- `app/src/data/events.ts` — see `app/src/data/CLAUDE.md`.
- Scraper URL constants and competition IDs (`app/scripts/scraper/index.ts:48-77`) — season-specific; bumping them mid-season is destructive.
- `index.html` CSP meta — adding a new origin requires testing.
- `wrangler.jsonc` `secrets_store_secrets[].store_id` — that's a real Cloudflare resource ID.
- Greek copy in `i18n/el.json` — flag for the user before translating or rewriting; tone matters.
- `manifest.json`, favicon set, hero images (`main.webp`, `mobile.webp`) — visual identity, not a refactor target.

## Commit style

`type(scope): description` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Examples in `git log`.
