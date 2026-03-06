# Task 05: Live Score Updates

## Status: Partially Implemented
## Priority: Medium
## Effort: Medium
## Impact: High
## Category: Live & Real-Time Features

## Description
Use FotMob or another API to show live scores during matches, with auto-refresh. Push notifications for goals scored.

## What Already Exists
- `src/lib/fotmob.ts` — FotMob API integration that fetches match data
- Score data is displayed on played match cards
- Push notification infrastructure exists (`src/lib/push.ts`)

## What's Missing
- Auto-refresh / polling during live matches
- Visual indicator for "LIVE" matches
- Real-time score updates without page reload
- Push notifications triggered on goal events
- Live match detection logic (is a match currently in progress?)

## Technical Approach
1. **Live Detection:**
   - Compare current time against match kickoff times
   - If a match is within its expected duration (~2h for football, ~2.5h for volleyball), mark as "live"
2. **Auto-Refresh:**
   - When a live match is detected, start polling FotMob every 60 seconds
   - Use `setInterval` with cleanup on unmount
   - Only poll when tab is visible (`document.visibilityState`)
3. **UI Updates:**
   - Add "LIVE" badge with pulsing animation to EventCard
   - Update score in real-time on both EventCard and EventPopover
   - Show minute indicator (e.g., "65'")
4. **Push Notifications:**
   - Back4App Cloud Function: periodically check FotMob for score changes
   - On goal detected, send push notification to subscribed users
   - Throttle to avoid duplicate notifications

## Relevant Files
- `src/lib/fotmob.ts` — existing FotMob integration
- `src/components/calendar/EventCard.tsx` — score display
- `src/components/calendar/EventPopover.tsx` — detailed match view
- `src/lib/push.ts` — push notification infrastructure
- `src/sw.ts` — service worker for push handling

## Dependencies
- FotMob API availability and rate limits
- Back4App Cloud Functions for server-side polling

## Acceptance Criteria
- [ ] Live matches detected automatically based on kickoff time
- [ ] "LIVE" badge shown on in-progress matches
- [ ] Scores auto-refresh every 60 seconds during live matches
- [ ] Polling pauses when tab is not visible
- [ ] Push notifications sent on goals (requires backend Cloud Function)
- [ ] Graceful fallback if FotMob API is unavailable
