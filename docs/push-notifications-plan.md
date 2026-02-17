# Web Push Notification System — Implementation Plan

## Context

The Red Rebels Calendar app is a static React site hosted on GitHub Pages. Match data is updated by a scraper GitHub Action that already detects changes (new events, score updates, time updates) via a `ChangeLog` interface in `app/scripts/scraper/index.ts`. Users currently have no way to be notified when data changes or reminded about upcoming matches.

We'll add web push notifications — fully free — that work within the static-site constraint, using the user's existing **Back4App** account (Parse Server BaaS) for subscription storage.

## Architecture

```
Client (Browser)                Back4App (Parse)             GitHub Actions
┌──────────────┐    subscribe   ┌─────────────────┐
│ Service Worker│ ←── push ──── │ PushSubscription │ ←─ query ─── ┌──────────────┐
│ Settings Page │ ── save ────→ │ NotifPreference  │              │ scrape.yml   │
│ Push Manager  │               │ ReminderLog      │              │ + notify step│
└──────────────┘               └─────────────────┘              │              │
                                                                 │ reminders.yml│
                                                                 │ (cron 30min) │
                                                                 └──────────────┘
```

**Flow**:
1. User visits app → service worker registers → user subscribes to push → subscription stored in Back4App
2. Scraper runs → detects changes → writes `changes.json` → notification script queries Back4App for subscriptions + preferences → sends push via `web-push` npm library
3. Cron job runs every 30 min → checks for upcoming matches → sends reminders to users who opted in

## External Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Back4App** (existing account) | Store subscriptions & preferences | 25k requests/mo, 1GB |
| **VAPID keys** | Web Push authentication | Free (self-generated) |
| **GitHub Actions** | Send notifications | 2,000 min/month |

## Back4App Data Schema (Parse Classes)

### Class: `PushSubscription`
| Field | Type | Notes |
|-------|------|-------|
| objectId | String | Auto (Parse default) |
| endpoint | String | Push endpoint URL (unique) |
| p256dh | String | Encryption key |
| auth | String | Auth secret |
| createdAt | Date | Auto (Parse default) |

### Class: `NotifPreference`
| Field | Type | Default |
|-------|------|---------|
| objectId | String | Auto |
| subscription | Pointer→PushSubscription | FK |
| notifyNewEvents | Boolean | true |
| notifyTimeChanges | Boolean | true |
| notifyScoreUpdates | Boolean | true |
| reminderHours | Array[Number] | [24, 2] |
| enabledSports | Array[String] | ["football-men", "volleyball-men", "volleyball-women"] |
| disabled | Boolean | false |

### Class: `ReminderLog`
| Field | Type | Notes |
|-------|------|-------|
| objectId | String | Auto |
| eventKey | String | "month-day-sport-opponent" |
| hoursBefore | Number | Which reminder tier was sent |
| sentAt | Date | For deduplication |

*Unique compound index on (eventKey + hoursBefore) enforced in code.*

Class-Level Permissions: Public read/write for `PushSubscription` and `NotifPreference`. `ReminderLog` is server-only (Master Key).

## Implementation Phases

### Phase 1: PWA + Service Worker Setup

**Install dependencies** (`app/package.json`):
- `vite-plugin-pwa` (dev) — generates service worker via Workbox
- `parse` — Parse JavaScript SDK (lightweight, ~40KB gzipped)

**Modify `app/vite.config.ts`** — add VitePWA plugin:
```ts
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'prompt',
  manifest: false,  // use existing manifest.json
  injectRegister: null,  // we'll register manually
  workbox: {
    globPatterns: ['**/*.{js,css,html,png,jpg,svg,ico}'],
    navigateFallback: '/index.html',
  },
  // Custom service worker for push handling
  srcDir: 'src',
  filename: 'sw.ts',
  strategies: 'injectManifest',
})
```

**Create `app/src/sw.ts`** — custom service worker:
- `push` event listener → parse payload → show notification
- `notificationclick` event listener → open app / focus existing tab
- Workbox precaching for static assets (injected by vite-plugin-pwa)

**Modify `app/src/main.tsx`** — register service worker:
```ts
import { registerSW } from 'virtual:pwa-register'
registerSW({ onNeedRefresh() { /* prompt user */ } })
```

### Phase 2: Push Subscription Client

**Create `app/src/lib/parse.ts`** — Parse SDK init:
```ts
import Parse from 'parse/dist/parse.min.js'
Parse.initialize(
  import.meta.env.VITE_BACK4APP_APP_ID,
  import.meta.env.VITE_BACK4APP_JS_KEY
)
Parse.serverURL = 'https://parseapi.back4app.com/'
```

**Create `app/src/lib/push.ts`** — Push subscription utilities:
- `isPushSupported()` — feature detection
- `subscribeToPush()` → request permission → PushManager.subscribe(VAPID key) → save to Back4App → store objectId in localStorage → create default preferences
- `unsubscribeFromPush()` → PushManager.unsubscribe() → delete from Back4App → clear localStorage
- `getSubscriptionStatus()` — returns current state
- Helper: `urlBase64ToUint8Array()` for VAPID key conversion

**Create `app/src/lib/preferences.ts`** — preference CRUD via Parse:
- `getPreferences(subscriptionId)` — query NotifPreference by subscription pointer
- `updatePreferences(subscriptionId, prefs)` — update fields
- `createDefaultPreferences(subscriptionId)` — create with defaults

### Phase 3: Settings Page

**Create `app/src/pages/SettingsPage.tsx`** — route `/#/settings`, lazy loaded:
- Permission status badge (granted / denied / default)
- Subscribe / Unsubscribe button
- Master enable/disable toggle
- **Event types** section: toggles for New Events, Time Changes, Score Updates
- **Sports** section: checkboxes for Football, Volleyball Men, Volleyball Women
- **Reminders** section: checkboxes for 24h, 12h, 2h, 1h before match
- Debounced save to Back4App on toggle change
- Glassmorphism card styling matching existing app design

**Modify `app/src/App.tsx`** — add lazy route:
```tsx
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
// In Routes:
<Route path="/settings" element={<SettingsPage />} />
```

**Modify `app/src/components/layout/Navbar.tsx`** — add Settings link:
- Desktop: bell icon nav link next to Calendar/Stats
- Mobile hamburger: "Settings" menu item with bell icon

**Update i18n files** (`en.json`, `el.json`) — add translations for all settings labels

### Phase 4: Scraper → Notification Integration

**Modify `app/scripts/scraper/index.ts`**:
- After `updateCalendarData()`, write the `ChangeLog` object to `changes.json` in the repo root
- The existing `ChangeLog` interface already has: `added`, `scoreUpdated`, `timeUpdated`, `venueUpdated` arrays — perfect for our needs

**Create `.github/scripts/package.json`**:
```json
{ "dependencies": { "web-push": "^3.6.7", "parse": "^5.3.0" } }
```

**Create `.github/scripts/send-notifications.js`**:
1. Read `changes.json`
2. If empty, exit
3. Init Parse with Master Key (server-side, bypasses CLP)
4. Query `PushSubscription` joined with `NotifPreference`
5. For each change type:
   - Filter by preference flags + enabled sports + not disabled
   - Build notification payload (title, body, icon `/images/clear_logo.png`, tag)
   - Send via `web-push.sendNotification()`
   - On 410/404: delete expired subscription from Back4App
6. Log summary

**Notification payloads**:
| Change Type | Title | Body Example | Tag |
|-------------|-------|-------------|-----|
| New event | "New Match" | "vs Omonia — Feb 22, 15:00" | `new-{key}` |
| Score update | "Score Update" | "vs Omonia — 2-1" | `score-{key}` |
| Time change | "Time Changed" | "vs Omonia — 15:00 → 17:00" | `time-{key}` |

**Modify `.github/workflows/scrape.yml`** — add after "Check for changes" step:
```yaml
- name: Install notification dependencies
  if: steps.check_changes.outputs.changes_detected == 'true'
  run: npm install
  working-directory: .github/scripts

- name: Send push notifications
  if: steps.check_changes.outputs.changes_detected == 'true'
  run: node send-notifications.js
  working-directory: .github/scripts
  env:
    VAPID_PUBLIC_KEY: ${{ secrets.VAPID_PUBLIC_KEY }}
    VAPID_PRIVATE_KEY: ${{ secrets.VAPID_PRIVATE_KEY }}
    BACK4APP_APP_ID: ${{ secrets.BACK4APP_APP_ID }}
    BACK4APP_MASTER_KEY: ${{ secrets.BACK4APP_MASTER_KEY }}
```

### Phase 5: Match Reminders

**Create `.github/scripts/send-reminders.js`**:
1. Parse `events.ts` to extract upcoming matches with kick-off times
2. Calculate hours until each match
3. For each reminder tier (24h, 12h, 2h, 1h):
   - Check if current time is within the 30-min cron window
   - Query `ReminderLog` to ensure not already sent
   - Query subscriptions where `reminderHours` contains this tier + sport matches + not disabled
   - Send reminder: "Match in {X}h: vs {opponent} at {venue}"
   - Write to `ReminderLog` to prevent duplicates

**Create `.github/workflows/reminders.yml`**:
```yaml
name: Send Match Reminders
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
        working-directory: .github/scripts
      - run: node send-reminders.js
        working-directory: .github/scripts
        env:
          VAPID_PUBLIC_KEY: ${{ secrets.VAPID_PUBLIC_KEY }}
          VAPID_PRIVATE_KEY: ${{ secrets.VAPID_PRIVATE_KEY }}
          BACK4APP_APP_ID: ${{ secrets.BACK4APP_APP_ID }}
          BACK4APP_MASTER_KEY: ${{ secrets.BACK4APP_MASTER_KEY }}
```

### Phase 6: Deploy Workflow Update

**Modify `.github/workflows/deploy.yml`** — add to build env:
```yaml
VITE_BACK4APP_APP_ID: ${{ secrets.VITE_BACK4APP_APP_ID }}
VITE_BACK4APP_JS_KEY: ${{ secrets.VITE_BACK4APP_JS_KEY }}
VITE_VAPID_PUBLIC_KEY: ${{ secrets.VITE_VAPID_PUBLIC_KEY }}
```

## GitHub Secrets to Add

| Secret | Used By | Notes |
|--------|---------|-------|
| `VAPID_PUBLIC_KEY` | Actions | Generated once via `web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Actions only | Never exposed to client |
| `VITE_VAPID_PUBLIC_KEY` | Client (build) | Same value as VAPID_PUBLIC_KEY |
| `VITE_BACK4APP_APP_ID` | Client (build) | From Back4App dashboard |
| `VITE_BACK4APP_JS_KEY` | Client (build) | From Back4App dashboard |
| `BACK4APP_APP_ID` | Actions | Same as VITE_BACK4APP_APP_ID |
| `BACK4APP_MASTER_KEY` | Actions only | From Back4App dashboard, never exposed |

## Files Summary

### New Files (11)
| # | File | Purpose |
|---|------|---------|
| 1 | `app/src/sw.ts` | Service worker with push handler |
| 2 | `app/src/lib/parse.ts` | Parse SDK initialization |
| 3 | `app/src/lib/push.ts` | Push subscription logic |
| 4 | `app/src/lib/preferences.ts` | Notification preference CRUD |
| 5 | `app/src/pages/SettingsPage.tsx` | Settings page component |
| 6 | `scripts/generate-vapid-keys.js` | One-time VAPID key generator |
| 7 | `.github/scripts/package.json` | GitHub Action script deps |
| 8 | `.github/scripts/send-notifications.js` | Sends push on scraper changes |
| 9 | `.github/scripts/send-reminders.js` | Sends match reminders |
| 10 | `.github/workflows/reminders.yml` | Cron workflow for reminders |
| 11 | `supabase/schema.sql` → `docs/back4app-schema.md` | Schema reference doc |

### Modified Files (8)
| # | File | Change |
|---|------|--------|
| 1 | `app/package.json` | Add vite-plugin-pwa, parse |
| 2 | `app/vite.config.ts` | Add VitePWA plugin config |
| 3 | `app/src/main.tsx` | Register service worker |
| 4 | `app/src/App.tsx` | Add /settings route |
| 5 | `app/src/components/layout/Navbar.tsx` | Add Settings nav link |
| 6 | `app/scripts/scraper/index.ts` | Write changes.json after scrape |
| 7 | `.github/workflows/scrape.yml` | Add notification step |
| 8 | `.github/workflows/deploy.yml` | Add Back4App + VAPID env vars |

### i18n Updates
- `app/src/i18n/en.json` — settings page English labels
- `app/src/i18n/el.json` — settings page Greek labels

## Edge Cases

- **Permission denied**: Show message with instructions to enable in browser settings
- **Expired subscriptions**: Auto-delete from Back4App on 410/404 response
- **iOS Safari**: Requires "Add to Home Screen" for push support (show tip on iOS)
- **Browser not supported**: Hide notification UI entirely, show info message
- **Back4App rate limits**: 25k requests/month — the 30-min cron (~1,440 runs/month × ~3 requests/run ≈ 4,320) + scraper + client subscriptions stays well within limit
- **Duplicate reminders**: `ReminderLog` class with eventKey+hoursBefore uniqueness prevents re-sends

## Phase 7: Testing

### 7.1 Unit Tests

**Service worker push handler** (`app/src/__tests__/sw.test.ts`):
- Push event with valid payload → shows notification with correct title/body/icon
- Push event with empty data → no notification shown
- Notification click → opens correct URL / focuses existing window
- Notification dismiss action → notification closed, no navigation

**Push subscription utilities** (`app/src/lib/__tests__/push.test.ts`):
- `isPushSupported()` → returns true when APIs available, false otherwise
- `subscribeToPush()` → requests permission, calls PushManager.subscribe, saves to Back4App, stores ID in localStorage
- `subscribeToPush()` when permission denied → throws/returns null
- `unsubscribeFromPush()` → calls unsubscribe, deletes from Back4App, clears localStorage
- `urlBase64ToUint8Array()` → correct conversion of VAPID key
- Mock: PushManager, Notification, Parse SDK

**Preferences service** (`app/src/lib/__tests__/preferences.test.ts`):
- `getPreferences()` → returns preferences from Back4App
- `updatePreferences()` → saves partial update to Back4App
- `createDefaultPreferences()` → creates with correct defaults
- Mock: Parse SDK queries

**Change detection** (`.github/scripts/__tests__/detect-changes.test.js`):
- New event added → detected in `added` array
- Score updated → detected in `scoreUpdated` array
- Time changed → detected in `timeUpdated` array
- No changes → empty arrays
- Multiple simultaneous changes → all detected

**Notification sender** (`.github/scripts/__tests__/send-notifications.test.js`):
- Filters subscriptions by preference (e.g., score updates disabled → not notified)
- Filters by sport (e.g., volleyball disabled → football-only notifications)
- Skips globally disabled subscriptions
- Handles expired subscriptions (410) → deletes from DB
- Handles network errors gracefully → logs and continues
- Empty changes → exits early, no queries made

**Reminder sender** (`.github/scripts/__tests__/send-reminders.test.js`):
- Match in 24h → sends reminder to users with 24h enabled
- Match in 2h → sends reminder to users with 2h enabled
- Already-sent reminder → not sent again (ReminderLog dedup)
- No upcoming matches → exits early
- Match with no kick-off time → skipped

### 7.2 Integration Tests

**Settings page** (`app/src/__tests__/SettingsPage.test.tsx`):
- Renders all sections (permission status, event types, sports, reminders)
- Subscribe button triggers permission request and subscription flow
- Toggle changes save to Back4App (debounced)
- Unsubscribe button clears subscription
- When push not supported → shows info message, hides controls
- When permission denied → shows blocked status with instructions
- Responsive layout at mobile (390px) and desktop (1280px)

### 7.3 Manual E2E Testing Checklist

Run these manually against the dev server and production:

**Service Worker**:
- [ ] `npm run build && npm run preview` → service worker registers in DevTools > Application
- [ ] Refresh page → service worker activates, precache populated
- [ ] Offline → cached pages still load

**Push Subscription Flow**:
- [ ] Click "Enable Notifications" → browser permission prompt appears
- [ ] Grant permission → subscription created in Back4App dashboard
- [ ] Check localStorage → `push_subscription_id` stored
- [ ] Check Back4App → `PushSubscription` + `NotifPreference` objects exist
- [ ] Click "Disable Notifications" → subscription deleted from Back4App + localStorage

**Settings Persistence**:
- [ ] Toggle "Score Updates" off → verify in Back4App `NotifPreference.notifyScoreUpdates = false`
- [ ] Change reminder to 1h only → verify `reminderHours = [1]`
- [ ] Disable Football → verify `enabledSports` no longer contains "football-men"
- [ ] Refresh page → all settings persist (loaded from Back4App)

**Notification Delivery**:
- [ ] Trigger scraper manually (GitHub Actions) with a known change
- [ ] Verify push notification appears on subscribed device
- [ ] Click notification → app opens to calendar page
- [ ] Dismiss notification → notification closes

**Reminder Delivery**:
- [ ] Create a test match 30 min from now with known time
- [ ] Manually run `send-reminders.js` → reminder notification appears
- [ ] Run again → no duplicate notification (ReminderLog check)

**Expired Subscription Cleanup**:
- [ ] Subscribe on Device A → note subscription in Back4App
- [ ] Clear browser data on Device A (removes service worker)
- [ ] Trigger notification → 410 error → subscription auto-deleted from Back4App

**Cross-Browser**:
- [ ] Chrome (desktop) — full support
- [ ] Firefox (desktop) — full support
- [ ] Edge (desktop) — full support
- [ ] Chrome (Android) — full support
- [ ] Safari (iOS 16.4+) — requires Add to Home Screen, verify prompt

**Responsive UI**:
- [ ] Settings page at 390x844 (mobile) — no overflow, readable, touch targets ≥ 44px
- [ ] Settings page at 1280x720 (desktop) — centered layout, good spacing

### 7.4 GitHub Actions Testing

- [ ] Push to branch → deploy workflow passes with new env vars
- [ ] Manually trigger scraper → notification step runs (check Actions log)
- [ ] Cron workflow (reminders.yml) → runs on schedule, check Actions log
- [ ] Test with no subscribers → scripts exit cleanly, no errors

## Save as Project Document

During implementation, this plan will be saved as `docs/push-notifications-plan.md` in the project for future reference.
