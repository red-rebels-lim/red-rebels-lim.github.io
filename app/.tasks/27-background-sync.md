# Task 27: Background Sync for Scores

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Low
## Category: Technical / Infrastructure

## Description
Use the Background Sync API in the service worker to automatically update scores when the user comes back online after being offline during a match.

## Requirements
- Service worker registers a sync event when score update fails (offline)
- When device comes back online, sync event fires and retches latest scores
- Updated scores reflected in UI without manual refresh
- Works with existing FotMob data pipeline

## Technical Approach
1. **Background Sync Registration:**
   ```typescript
   // In application code — when fetch fails
   if ('serviceWorker' in navigator && 'SyncManager' in window) {
     const reg = await navigator.serviceWorker.ready;
     await reg.sync.register('sync-scores');
   }
   ```
2. **Service Worker Handler:**
   ```typescript
   // In sw.ts
   self.addEventListener('sync', (event) => {
     if (event.tag === 'sync-scores') {
       event.waitUntil(fetchLatestScores());
     }
   });
   ```
3. **Cache Update:**
   - Fetch latest event data from source
   - Update the cached data in the service worker cache
   - Post message to client to trigger UI refresh

## Relevant Files
- `src/sw.ts` — add sync event handler
- `src/lib/fotmob.ts` — score fetching logic to reuse

## Dependencies
- Task 22 (Offline Match Data) — needs data caching in place first
- Background Sync API support (Chrome/Edge, limited Safari support)

## Acceptance Criteria
- [ ] Sync event registered when score fetch fails offline
- [ ] Scores automatically updated when back online
- [ ] UI refreshes with latest data
- [ ] Graceful degradation on unsupported browsers
