# Task 28: Automated Match Reminder Notifications

## Status: Partially Implemented
## Priority: High
## Effort: Medium
## Impact: High
## Category: Technical / Infrastructure

## Description
The Settings page already has reminder hour preferences (1h, 2h, 12h, 24h before). Implement the backend Cloud Function in Back4App to actually send these reminders based on the stored preferences and event times.

## What Already Exists
- `src/pages/SettingsPage.tsx` — UI for selecting reminder hours (1h, 2h, 12h, 24h)
- `src/lib/preferences.ts` — `getPreferences()` / `updatePreferences()` store reminder preferences in Back4App
- `src/lib/push.ts` — push subscription/unsubscription infrastructure
- `src/sw.ts` — service worker handles incoming push notifications and notification clicks
- Back4App `Subscription` and `Preferences` Parse classes

## What's Missing
- Backend Cloud Function to schedule and send reminder notifications
- Cron job or scheduled task to check upcoming matches against user preferences
- Push notification payload construction for reminders

## Technical Approach
1. **Cloud Function: `sendMatchReminders`**
   - Runs on a schedule (every 15 minutes via Back4App Cloud Job)
   - Queries upcoming matches within the next 24 hours
   - For each match, finds subscriptions with matching sport preferences
   - Checks each user's `reminderHours` preference
   - If current time matches a reminder window (e.g., 2h before kickoff), send push
2. **Push Payload:**
   ```json
   {
     "title": "Match in 2 hours!",
     "body": "Nea Salamina vs Opponent - 18:00",
     "icon": "/images/clear_logo_sm.webp",
     "data": { "url": "/", "matchId": "..." }
   }
   ```
3. **Deduplication:**
   - Track sent reminders in a `SentReminder` Parse class: `subscriptionId`, `matchId`, `reminderHour`
   - Prevent duplicate notifications for the same match/reminder combination
4. **Cloud Job Setup:**
   - Register job in Back4App dashboard
   - Schedule to run every 15 minutes
   - Include error handling and logging

## Relevant Files
- `src/lib/preferences.ts` — preference structure (reminderHours, enabledSports)
- `src/lib/push.ts` — subscription management
- `src/sw.ts` — push event handler (already handles incoming notifications)
- Back4App Cloud Code (new `cloud/main.js` or similar)

## Dependencies
- Back4App Cloud Code access
- Web Push VAPID keys (already configured for push subscriptions)
- Event data accessible from Cloud Functions

## Acceptance Criteria
- [ ] Cloud Function checks upcoming matches every 15 minutes
- [ ] Reminders sent at user-selected intervals (1h, 2h, 12h, 24h before)
- [ ] Only sends for user's enabled sports
- [ ] No duplicate reminders for same match/interval
- [ ] Notification click opens the app
- [ ] Respects "pause all" preference
- [ ] Graceful handling of expired/invalid subscriptions
