# Task 22: Offline Match Data

## Status: Partially Implemented
## Priority: Medium
## Effort: Medium
## Impact: High
## Category: Accessibility & UX Polish

## Description
Cache event data in the service worker so the calendar works fully offline (currently only precaches assets, not the data layer).

## What Already Exists
- `src/sw.ts` — Workbox-based service worker with precaching for static assets
- PWA manifest and service worker registration
- App shell loads offline (HTML, CSS, JS cached)

## What's Missing
- Event/calendar data is not cached — calendar shows blank when offline
- No runtime caching strategy for API calls or data files
- No offline indicator in the UI

## Technical Approach
1. **Workbox Runtime Caching:**
   - Add `StaleWhileRevalidate` or `NetworkFirst` strategy for data files
   - Cache event JSON data in service worker
   ```typescript
   // In sw.ts
   import { registerRoute } from 'workbox-routing';
   import { StaleWhileRevalidate } from 'workbox-strategies';
   import { CacheableResponsePlugin } from 'workbox-cacheable-response';

   registerRoute(
     ({ url }) => url.pathname.endsWith('.json') || url.pathname.includes('/data/'),
     new StaleWhileRevalidate({
       cacheName: 'event-data',
       plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
     })
   );
   ```
2. **Offline Indicator:**
   - Listen for `online`/`offline` events
   - Show subtle banner: "You're offline — showing cached data"
3. **Cache Invalidation:**
   - Use `StaleWhileRevalidate` so fresh data loads when online
   - Service worker update triggers data refresh

## Relevant Files
- `src/sw.ts` — service worker (add runtime caching routes)
- `vite.config.ts` — VitePWA plugin configuration (runtimeCaching option)
- `src/data/` — event data files to cache

## Dependencies
- Workbox runtime caching modules (already available via vite-plugin-pwa)

## Acceptance Criteria
- [ ] Calendar data available offline after first visit
- [ ] Service worker caches event data files
- [ ] Stale-while-revalidate ensures fresh data when online
- [ ] Offline indicator shown when network unavailable
- [ ] No data loss on intermittent connectivity
