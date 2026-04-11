# UI/UX Improvement Plan - Red Rebels Calendar PWA

> Generated: 2026-04-11 | Audit based on UI/UX Pro Max guidelines, WCAG 2.1 AA, Apple HIG, Material Design

---

## Phase 1: Critical Accessibility & Quick Wins

These are WCAG compliance issues and low-effort high-impact fixes. Can be done in a single session.

---

### 1.1 Add `prefers-reduced-motion` support

**Priority**: CRITICAL | **Effort**: Small | **WCAG**: 2.3.3 Animation from Interactions

**Problem**: Zero references to `prefers-reduced-motion` anywhere in the codebase. All animations run unconditionally — hover lifts, dialog zoom-in/out, spinner rotations, card transitions, and swipe gestures. Users with vestibular disorders (vertigo, motion sickness) are affected.

**Affected files**:
- `app/src/index.css` — global animation definitions
- `app/src/components/ui/dialog.tsx` — `animate-in`/`animate-out`, `zoom-in-95`/`zoom-out-95`
- `app/src/components/calendar/EventCard.tsx` — `hover:-translate-y-0.5`, `transition-all`
- `app/src/components/calendar/UpcomingEventCard.tsx` — hover lift, scale transitions
- `app/src/components/calendar/CountdownTimer.tsx` — live updating text
- `app/src/components/Spinner.tsx` — `animate-spin`
- `app/src/components/calendar/EventPopover.tsx` — swipe transitions
- Any component using `transition-all`, `transition-colors`, `transition-transform`

**Fix**:
1. Add a global CSS rule in `app/src/index.css`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
2. For the Spinner component, keep a minimal rotation but remove bouncing/pulsing.
3. For swipe navigation in EventPopover, disable slide transitions but keep instant state changes.

**Verification**: Enable "Reduce motion" in macOS/iOS accessibility settings and confirm the app is still fully functional with no animation.

---

### 1.2 Respect `prefers-color-scheme` for initial theme

**Priority**: CRITICAL | **Effort**: Small

**Problem**: `app/src/hooks/useTheme.ts` only reads from `localStorage`. First-time visitors always get dark mode regardless of their system preference. Users with light mode OS settings are surprised.

**Affected files**:
- `app/src/hooks/useTheme.ts`

**Fix**: When no `localStorage` value exists, check `window.matchMedia('(prefers-color-scheme: dark)')` as the fallback. If the user explicitly toggles the theme, save to localStorage and that takes priority going forward.

```typescript
// Pseudocode for the init logic:
const stored = localStorage.getItem('theme');
if (stored) {
  return stored; // explicit user choice wins
}
return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
```

**Verification**: Clear localStorage, set OS to light mode, reload — app should start in light mode.

---

### 1.3 Add `cursor-pointer` to all interactive elements

**Priority**: HIGH | **Effort**: Small

**Problem**: Only 6 components use `cursor-pointer`. Many clickable elements — calendar day cells, stat cards, filter chips, settings toggles, league table rows — show the default cursor on desktop, giving no affordance that they're interactive.

**Affected files** (add `cursor-pointer` where missing):
- `app/src/components/calendar/MobileCalendarGrid.tsx` — day cells
- `app/src/components/stats/LeagueTable.tsx` — expandable rows
- `app/src/components/stats/OverallStats.tsx` — stat cards (if clickable)
- `app/src/components/filters/FilterPanel.tsx` — filter chips/buttons
- `app/src/pages/SettingsPage.tsx` — toggle switches, language selector
- `app/src/components/layout/MobileHeader.tsx` — theme toggle button
- `app/src/components/layout/BottomNav.tsx` — nav links (check if NavLink adds it)

**Fix**: Audit each component. Any element with `onClick`, `role="button"`, or `tabIndex={0}` should have `cursor-pointer`. Consider adding it globally to the button base in `app/src/components/ui/button.tsx` if not already present.

---

### 1.4 Fix font loading strategy (FOIT prevention)

**Priority**: HIGH | **Effort**: Small

**Problem**: Montserrat is loaded via CSS `@import url(...)` in `app/src/index.css`, which is render-blocking. No `font-display: swap` specified. On slow connections, text is invisible (FOIT) until the font loads.

**Affected files**:
- `app/src/index.css` — the `@import` statement
- `app/index.html` — add preload link here instead

**Fix**:
1. Remove the `@import` from CSS.
2. Add to `app/index.html` `<head>`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" />
   ```
3. The `display=swap` parameter ensures text renders immediately with the fallback font.

**Verification**: Throttle network to "Slow 3G" in DevTools. Text should appear immediately in a fallback font, then swap to Montserrat.

---

### 1.5 Add `overscroll-behavior: contain` to prevent accidental pull-to-refresh

**Priority**: MEDIUM | **Effort**: Tiny

**Problem**: No `overscroll-behavior` set. On mobile browsers, scrolling to the top and pulling down triggers a page refresh, which is disruptive in a PWA with in-app navigation.

**Affected files**:
- `app/src/index.css`

**Fix**: Add to the `body` or `html` rule:
```css
html, body {
  overscroll-behavior: contain;
}
```

---

### 1.6 Add `font-variant-numeric: tabular-nums` for scores and stats

**Priority**: MEDIUM | **Effort**: Tiny

**Problem**: Scores (e.g., "3-1"), standings (points, goals), and countdown timers use proportional figures. When numbers change (e.g., countdown ticking), digits shift horizontally because "1" is narrower than "0".

**Affected files**:
- `app/src/components/calendar/CountdownTimer.tsx`
- `app/src/components/calendar/EventCard.tsx` — score display
- `app/src/components/calendar/EventPopover.tsx` — score, set scores
- `app/src/components/stats/LeagueTable.tsx` — points, goals, GD columns
- `app/src/components/stats/OverallStats.tsx` — stat numbers
- `app/src/components/stats/TopScorers.tsx` — goal/point counts

**Fix**: Either add globally to a utility class or apply `tabular-nums` to number-heavy components:
```css
.tabular-nums { font-variant-numeric: tabular-nums; }
```
Or use Tailwind's `tabular-nums` class directly on numeric elements.

---

## Phase 2: Visual Polish & Consistency

Standardize the design system, fix inconsistencies, and improve perceived quality.

---

### 2.1 Consolidate hardcoded color values into Tailwind tokens

**Priority**: HIGH | **Effort**: Medium

**Problem**: Multiple components use raw `rgba()` values instead of Tailwind theme tokens. Examples found:
- `rgba(224,37,32,0.3)` — red with 30% opacity (brand red)
- `rgba(224,37,32,0.15)` — red with 15% opacity
- `rgba(10,24,16,0.2)` — dark green overlay
- `rgba(255,255,255,0.1)` — white overlay in dark mode
- Various `#hex` values in inline styles

This makes dark/light mode changes fragile and risks visual inconsistency.

**Affected files**: Scan all components in `app/src/components/` and `app/src/pages/` for `rgba(`, `#[0-9a-f]`, and `style={{`.

**Fix**:
1. Define semantic tokens in Tailwind config or CSS custom properties:
   ```css
   :root {
     --brand-red: 224 37 32;
     --brand-red-overlay: rgba(224, 37, 32, 0.15);
     --surface-overlay: rgba(255, 255, 255, 0.05);
   }
   .dark {
     --surface-overlay: rgba(255, 255, 255, 0.1);
   }
   ```
2. Replace all hardcoded `rgba()` with the token equivalents.
3. Consider using Tailwind's `bg-red-500/15` opacity modifier syntax where possible.

---

### 2.2 Add skeleton loading states for async content

**Priority**: HIGH | **Effort**: Medium

**Problem**: Only `FootballStatsTab` has an `animate-pulse` skeleton. Other data-fetching views show nothing or a bare spinner while loading:
- Stats page tabs (volleyball tabs)
- League table (FotMob data)
- Next match component
- Event popover match details (when fetching enrichment data)

This causes layout shift (CLS) when content appears and feels unresponsive.

**Affected files**:
- `app/src/components/stats/VolleyballStatsTab.tsx` — needs skeleton
- `app/src/components/stats/LeagueTable.tsx` — needs skeleton rows
- `app/src/components/stats/NextMatch.tsx` — needs skeleton
- `app/src/components/stats/TopScorers.tsx` — needs skeleton
- `app/src/components/calendar/EventPopover.tsx` — needs skeleton for match details tab

**Fix**: Create a reusable `<Skeleton />` component (or use the existing Radix pattern):
```tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
```
Then add skeleton variants for:
- **Table rows**: 8 rows of `h-10 w-full` blocks
- **Stat cards**: 2x3 grid of `h-24 w-full` blocks
- **Match card**: Logo placeholder + text lines

**Verification**: Throttle network, navigate to Stats page, confirm skeleton appears before data.

---

### 2.3 Standardize border and shadow patterns across dark/light modes

**Priority**: MEDIUM | **Effort**: Medium

**Problem**: Inconsistent approach to elevation in dark mode:
- Some components: `shadow-md dark:shadow-none` (completely remove shadow)
- Others: Keep `shadow-sm` in dark mode
- Border colors mix: `border-slate-200 dark:border-slate-800` vs `border-[rgba(224,37,32,0.3)]`
- Some cards rely only on background color difference for separation, others use borders + shadows

**Affected files**: All card-like components across `calendar/`, `stats/`, `pages/`.

**Fix**: Define a standard card pattern:
```
Light mode: bg-white border border-slate-200 shadow-sm
Dark mode: bg-card border border-slate-800 (no shadow, rely on border for separation)
```
Apply consistently. Use a shared `cardStyles` utility or Tailwind `@apply` in a card base class.

---

### 2.4 Fix volleyball card opacity

**Priority**: MEDIUM | **Effort**: Tiny

**Problem**: Volleyball event cards have `opacity-80` applied globally, reducing readability and contrast. This may cause WCAG contrast failures on some background combinations.

**Affected files**:
- `app/src/components/calendar/EventCard.tsx` — check for opacity conditional
- `app/src/components/calendar/UpcomingEventCard.tsx`

**Fix**: Remove the blanket `opacity-80`. If volleyball events need visual differentiation from football, use a different approach:
- Subtle left border accent in blue (volleyball's accent color `#2196F3`)
- Different background tint
- A sport badge/icon
These maintain readability while still distinguishing the sport type.

---

### 2.5 Improve focus ring consistency

**Priority**: MEDIUM | **Effort**: Small

**Problem**: Radix UI components use `focus-visible:ring-2 ring-ring ring-offset-2` but custom interactive components (SettingsToggle, EventCard day cells, stat cards) implement their own focus styles with varying colors, widths, and offsets.

**Affected files**:
- `app/src/components/ui/button.tsx` — has standard focus ring
- `app/src/components/calendar/EventCard.tsx` — custom focus style
- `app/src/components/calendar/MobileCalendarGrid.tsx` — custom focus style
- `app/src/pages/SettingsPage.tsx` — toggle focus styles

**Fix**: Define one focus ring pattern and apply everywhere:
```css
.focus-ring {
  @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500;
}
```
Apply to all interactive elements. The red-500 matches the brand color for consistency.

---

## Phase 3: Interaction & Feedback Improvements

Improve how the app communicates state changes and handles edge cases.

---

### 3.1 Add empty states for data sections

**Priority**: HIGH | **Effort**: Medium

**Problem**: Several views show nothing when there's no data:
- Calendar month with no events → blank grid
- League table before data loads or on error → nothing
- Top scorers with no data → nothing
- Stats tabs when a sport has no played matches → nothing

**Affected components**:
- `app/src/components/calendar/UpcomingEventsList.tsx`
- `app/src/components/stats/LeagueTable.tsx`
- `app/src/components/stats/TopScorers.tsx`
- `app/src/components/stats/OverallStats.tsx`
- `app/src/pages/StatsPage.tsx`

**Fix**: Add contextual empty states with:
1. An icon (e.g., `Calendar`, `Trophy`, `BarChart3` from Lucide)
2. A short message (translated via i18next)
3. An optional action (e.g., "Switch to a different month" or "Check back after the next match")

Example:
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
  <Calendar className="h-12 w-12 mb-4 opacity-40" />
  <p className="text-sm">{t('calendar.noEvents')}</p>
</div>
```

---

### 3.2 Fix dialog overflow on small screens

**Priority**: MEDIUM | **Effort**: Small

**Problem**: The match popover (`EventPopover`) uses `max-h-[90vh]` with internal scroll. On small phones (iPhone SE, 375x667), when content is long (full lineup + scorers + set breakdown + match report), the dialog can overflow or the scroll area becomes cramped with only ~400px visible.

**Affected files**:
- `app/src/components/calendar/EventPopover.tsx`

**Fix**:
1. Use `max-h-[85dvh]` (dynamic viewport height, accounts for browser chrome).
2. Add a scroll fade indicator at the bottom of the content area to hint there's more content.
3. Ensure the close button is always visible (sticky header within dialog).
4. Test on 375x667 viewport with a match that has full data (scorers, lineup, sets, report).

---

### 3.3 Add confirmation for destructive settings actions

**Priority**: MEDIUM | **Effort**: Small

**Problem**: Toggling push notifications off, changing language, or resetting sport filters happens instantly with no confirmation or undo. An accidental tap can unsubscribe from notifications.

**Affected files**:
- `app/src/pages/SettingsPage.tsx`

**Fix**:
- For push notification toggle-off: Show a confirmation dialog ("Are you sure? You won't receive match reminders.")
- For other settings: Add a brief toast with "Undo" action (auto-dismiss in 5s). Can use a simple toast component or extend the existing Radix primitives.

---

### 3.4 Improve calendar day touch targets

**Priority**: MEDIUM | **Effort**: Small

**Problem**: Calendar grid day cells are ~48px but the event indicator dots inside them are much smaller (~8px). Users need to tap precisely on the dot or the day number to select it. On small screens this leads to missed taps.

**Affected files**:
- `app/src/components/calendar/MobileCalendarGrid.tsx`

**Fix**: Make the entire day cell the tap target (it likely already is — verify). Ensure the `onClick` handler is on the outer cell `div`, not on the inner dot. Add `min-h-[44px] min-w-[44px]` to the cell. Add subtle active state feedback (`active:bg-slate-100 dark:active:bg-slate-800`).

---

### 3.5 Add missing alt text on team logos in stats

**Priority**: MEDIUM | **Effort**: Small

**Problem**: Team logos in the following components render `<img>` tags without `alt` attributes:
- `app/src/components/stats/LeagueTable.tsx` — team logos in standings
- `app/src/components/stats/TopScorers.tsx` — team logos next to scorer names
- Other stats components that display team logos

The calendar components (`EventCard`, `EventPopover`, `NextMatch`) correctly use `alt={opponent}`.

**Fix**: Add `alt={teamName}` to all `<img>` tags displaying team logos. For decorative logos that are next to text already naming the team, use `alt=""` (empty alt) to avoid redundancy for screen readers.

---

### 3.6 Add charts accessibility (screen reader summaries)

**Priority**: LOW | **Effort**: Small

**Problem**: Recharts components in stats (GoalDistribution, SeasonProgress, etc.) render as SVG with no text alternative. Screen readers see nothing meaningful.

**Affected files**:
- `app/src/components/stats/GoalDistribution.tsx`
- `app/src/components/stats/SeasonProgress.tsx`
- Any other Recharts usage

**Fix**: Wrap each chart in a container with `role="img"` and `aria-label` describing the key insight:
```tsx
<div role="img" aria-label={t('stats.goalDistribution.summary', { home: 15, away: 8 })}>
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```
Optionally provide a visually hidden data table alternative for full accessibility.

---

## Phase 4: Enhancements & Brand Refinement

Lower priority improvements that elevate the overall quality.

---

### 4.1 Consider sports-optimized typography

**Priority**: LOW | **Effort**: Medium

**Problem**: Montserrat is a solid geometric sans-serif but doesn't evoke a sports/athletic feel. The UI/UX Pro Max design system recommends **Barlow Condensed** (headings) + **Barlow** (body) for sports applications — condensed, energetic, and action-oriented.

**Current**: Montserrat 400-900 for everything.

**Proposed alternative**:
- Headings: Barlow Condensed 600/700 — compact, athletic feel for scores, match titles, stat headers
- Body: Barlow 400/500 — clean readability for descriptions, settings, metadata
- Numbers: Barlow Condensed with `tabular-nums` — ideal for scores, standings, countdowns

**Google Fonts**: `https://fonts.google.com/share?selection.family=Barlow+Condensed:wght@400;500;600;700|Barlow:wght@300;400;500;600;700`

**Impact**: Subtle but noticeable brand reinforcement. Would require updating `font-family` in Tailwind config and testing all pages.

---

### 4.2 Add lazy loading to below-fold images

**Priority**: LOW | **Effort**: Small

**Problem**: Only 6 instances of `loading="lazy"` across the app. Team logos in league tables, top scorers, and other stats components load eagerly even when below the fold. On the calendar page, logos for events in future months also load immediately.

**Affected files**:
- `app/src/components/stats/LeagueTable.tsx` — team logos in all rows
- `app/src/components/stats/TopScorers.tsx` — team logos
- `app/src/components/calendar/EventCard.tsx` — verify lazy loading
- `app/src/components/calendar/UpcomingEventCard.tsx` — verify lazy loading

**Fix**: Add `loading="lazy"` to all `<img>` tags that are not in the initial viewport (hero/above-fold). Keep `loading="eager"` only for the first visible match card and the Nea Salamina logo.

---

### 4.3 Add print stylesheet for match schedules

**Priority**: LOW | **Effort**: Small

**Problem**: The app has `print:hidden` on nav and footer (good), but no print-specific styles for the calendar grid or match details. Users printing a month's schedule get the dark background, small text, and unnecessary interactive elements.

**Affected files**:
- `app/src/index.css` — add print media query

**Fix**: Add print styles:
```css
@media print {
  body { background: white !important; color: black !important; }
  .calendar-grid { break-inside: avoid; }
  /* Hide filters, theme toggle, install prompt */
  /* Force light mode colors */
  /* Increase font size slightly for readability */
}
```

---

### 4.4 Improve perceived performance with progressive loading

**Priority**: LOW | **Effort**: Medium

**Problem**: The Stats page lazy-loads the entire page component. While it loads, users see the Spinner. A skeleton that matches the page layout would feel faster.

**Affected files**:
- `app/src/App.tsx` — `React.lazy()` fallback
- `app/src/pages/StatsPage.tsx`
- `app/src/pages/SettingsPage.tsx`

**Fix**: Replace the generic `<Spinner />` fallback with page-specific skeleton components:
```tsx
const StatsPage = React.lazy(() => import('./pages/StatsPage'));

// In router:
<Suspense fallback={<StatsPageSkeleton />}>
  <StatsPage />
</Suspense>
```

The skeleton should mirror the actual page layout: header bar, tab row, 2x3 stat card grid, table placeholder.

---

### 4.5 Add error boundaries with recovery for data-fetching components

**Priority**: LOW | **Effort**: Medium

**Problem**: The app has a top-level `ErrorBoundary` but individual data-fetching components (LeagueTable, NextMatch, TopScorers) that fail will crash the entire Stats page. FotMob API failures or network issues should be handled gracefully per-component.

**Affected files**:
- `app/src/components/stats/LeagueTable.tsx`
- `app/src/components/stats/NextMatch.tsx`
- `app/src/components/stats/TopScorers.tsx`
- `app/src/components/stats/VenueInfo.tsx`

**Fix**: Wrap each data-fetching stat component in its own error boundary that shows:
1. A friendly error message ("Couldn't load standings")
2. A "Retry" button
3. The rest of the Stats page continues to work

---

### 4.6 Add subtle press feedback on mobile

**Priority**: LOW | **Effort**: Small

**Problem**: Some cards have `hover:-translate-y-0.5` which works on desktop but provides no feedback on mobile (no hover state). Mobile users get no visual confirmation their tap registered.

**Affected files**:
- `app/src/components/calendar/EventCard.tsx`
- `app/src/components/calendar/UpcomingEventCard.tsx`
- `app/src/components/stats/` — various cards

**Fix**: Add `active:scale-[0.98]` or `active:opacity-90` to tappable cards. This gives instant tactile feedback on press:
```tsx
className="... transition-transform active:scale-[0.98]"
```
Ensure this respects `prefers-reduced-motion` (Phase 1.1 handles this globally).

---

## Summary

| Phase | Items | Effort | Impact |
|-------|-------|--------|--------|
| **Phase 1**: Critical & Quick Wins | 6 items | ~2-3 hours | WCAG compliance, core UX |
| **Phase 2**: Visual Polish | 5 items | ~4-6 hours | Design consistency, perceived quality |
| **Phase 3**: Interaction & Feedback | 6 items | ~4-6 hours | Edge cases, accessibility gaps |
| **Phase 4**: Enhancements | 6 items | ~6-8 hours | Brand refinement, progressive enhancement |

**Recommended approach**: Complete Phase 1 as a single PR. Then tackle Phase 2 and 3 items as individual PRs grouped by component area. Phase 4 can be done opportunistically.
