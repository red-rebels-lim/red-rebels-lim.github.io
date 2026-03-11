# TASK-10: Redesign Mobile Calendar Page with Bottom Navigation

**Status:** done
**Depends on:** -
**Estimated scope:** Large

## Objective

Redesign the mobile Calendar page to match the new mockup in `mockups/red_rebels_march_2026_calendar/`. The key changes are:

1. Replace the top Navbar + hamburger menu with a **fixed bottom navigation bar** (Calendar / Stats / Settings)
2. Replace the current mobile event list with a **monthly calendar grid** showing day numbers and colored event dots
3. Add an **"Upcoming Events" card list** below the calendar grid
4. Simplify the mobile header to just the app title + theme toggle
5. Keep the desktop layout largely unchanged (bottom nav is mobile-only)

## Design Reference

- **Mockup screenshot:** `mockups/red_rebels_march_2026_calendar/screen.png`
- **Mockup HTML:** `mockups/red_rebels_march_2026_calendar/code.html`
- **Additional reference:** `mockups/calendar-bottom-nav.png`

## Design Specifications (from mockup)

### Color Palette
- **Primary red:** `#dc2828` (used for highlights, active nav, football dots)
- **Dark background:** `#0f172a` (slate-900 equivalent)
- **Surface/card dark:** `#1e293b` (slate-800 equivalent)
- **Volleyball/blue accent:** `bg-blue-500` for volleyball event dots
- **Light mode background:** `#f8f6f6`

### Header (Mobile)
- Simple horizontal bar: app title "Red Rebels Calendar" (left, red, bold) + dark_mode/light_mode icon button (right)
- Border bottom: `border-slate-200 dark:border-slate-800`
- No logo image, no hamburger menu, no navigation links
- The Filter, Export, Print, Install PWA, and Language controls move to the new Settings page (TASK-11)

### Calendar Grid (Mobile)
- 7-column grid with day-of-week headers: SUN, MON, TUE, WED, THU, FRI, SAT
- Day headers: `text-[11px] font-bold text-slate-500 dark:text-slate-400`
- Each day cell: `h-12`, centered day number (`text-sm font-medium`)
- **Event indicator dots** below the day number:
  - Red dot (`bg-primary`, `size-1 rounded-full`) for football events
  - Blue dot (`bg-blue-500`, `size-1 rounded-full`) for volleyball events
  - Multiple dots side by side if multiple event types on same day
- **Next match / selected day highlight:** `bg-primary/20 rounded-lg` with `text-primary font-bold`
- **Today indicator:** Similar highlight treatment (decide between today vs next-match highlighting)
- Days from adjacent months: `text-slate-300 dark:text-slate-600`
- Month navigation: left/right chevron buttons with `bg-slate-100 dark:bg-surface-dark rounded-lg`
- Tapping a day with events should scroll to that event in the upcoming list, or open the EventPopover

### Upcoming Events Cards (Mobile)
- Section header: `text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400` - "UPCOMING EVENTS"
- Each card is a horizontal row:
  - **Date badge** (left): `w-16 h-16 rounded-lg` with `bg-primary/10` (football) or `bg-blue-500/10` (volleyball), showing day number + abbreviated month
  - **Event info** (center): competition type label (e.g., "FOOTBALL LEAGUE") with sport icon + color, match title "Nea Salamina vs Opponent", date/time string
  - **Chevron button** (right): `size-8 rounded-full bg-slate-200 dark:bg-slate-700`
- Card container: `bg-slate-100 dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800`
- Volleyball cards: slightly lower opacity (`opacity-80`) to visually differentiate
- Tapping a card should open the existing EventPopover with full match details

### Bottom Navigation Bar
- **Fixed position:** `fixed bottom-0 left-0 right-0`
- **Background:** `bg-slate-100 dark:bg-surface-dark`
- **Border:** `border-t border-slate-200 dark:border-slate-800`
- **Padding:** `px-6 pb-8 pt-3` (pb-8 accounts for iOS safe area / home indicator)
- **Three tabs** evenly spaced (`flex items-center justify-between max-w-md mx-auto`):
  1. **Calendar** - `calendar_month` icon (filled when active), red text when active
  2. **Stats** - `leaderboard` icon, slate-400 text when inactive
  3. **Settings** - `settings` icon, slate-400 text when inactive
- Active tab: `text-primary` with filled icon (`font-variation-settings: 'FILL' 1`)
- Inactive tabs: `text-slate-400` with hover state `group-hover:text-slate-600 dark:group-hover:text-slate-200`
- Tab label: `text-[10px] font-bold`
- Uses React Router `NavLink` or `useLocation` to determine active state
- **Mobile only**: hidden on desktop (md: breakpoint and above)

### Content Area Padding
- Main content needs `pb-24` to account for the fixed bottom nav so nothing is hidden behind it

## Implementation Steps

### Step 1: Create BottomNav Component
- **File:** `app/src/components/layout/BottomNav.tsx`
- Renders three navigation tabs using React Router `NavLink`
- Uses Material Symbols icons (add to project via Google Fonts CDN or use existing Radix icons / Lucide icons to match what's already installed)
- **IMPORTANT:** Check what icon library the project uses. If not Material Symbols, use equivalent icons from the existing library (e.g., Lucide: `CalendarDays`, `BarChart3`, `Settings`)
- Only visible on mobile (`md:hidden`)
- Fixed at bottom with safe-area padding
- Highlights active route with red color

### Step 2: Create MobileCalendarGrid Component
- **File:** `app/src/components/calendar/MobileCalendarGrid.tsx`
- New mobile-specific calendar view (the existing CalendarGrid desktop view stays as-is)
- Props: `{ monthData: MonthData; currentMonth: MonthName; onDayClick: (day: number) => void }`
- Renders 7-column grid with day headers (use i18n for day names)
- Shows colored dots for events on each day:
  - Compute dot colors from event sport types: football = red, volleyball = blue
  - Use `calendarData` from `useCalendar` to know which days have events
- Highlights today's date and/or the next upcoming match date
- Shows adjacent month overflow days in muted text
- Swipe left/right for month navigation (reuse `useSwipeNavigation`)

### Step 3: Create UpcomingEventCard Component
- **File:** `app/src/components/calendar/UpcomingEventCard.tsx`
- Renders a single upcoming event in the card format from the mockup
- Props: `{ event: CalendarEvent; onClick: () => void }`
- Shows date badge, competition type with icon, match title, date/time
- Clicking opens the EventPopover (reuse existing popover)
- Color-coded by sport type (red for football, blue for volleyball)

### Step 4: Create UpcomingEventsList Component
- **File:** `app/src/components/calendar/UpcomingEventsList.tsx`
- Renders "UPCOMING EVENTS" header + list of UpcomingEventCard components
- Filters events to show only upcoming matches for the current month (and optionally the next few)
- Sort by date ascending
- Shows played matches too (with result indicator) or only upcoming - follow mockup which shows upcoming only

### Step 5: Refactor CalendarPage for Mobile
- **File:** `app/src/pages/CalendarPage.tsx`
- On mobile (below md breakpoint):
  - Render simplified header (title + theme toggle) instead of full Navbar
  - Render MobileCalendarGrid instead of the existing CalendarGrid mobile view
  - Render UpcomingEventsList below the grid
  - Add bottom padding for the fixed BottomNav
- On desktop (md and above):
  - Keep current Navbar and CalendarGrid layout
  - Do NOT show bottom nav (desktop keeps top navigation)
- Keep all existing functionality: EventPopover, swipe navigation, keyboard shortcuts, scroll-to-today

### Step 6: Update App.tsx Layout
- **File:** `app/src/App.tsx`
- Add `<BottomNav />` component inside the router, visible on all pages (mobile only)
- Ensure the main content area has sufficient bottom padding on mobile
- The Navbar component should still render on desktop but can be hidden on mobile if the bottom nav replaces it entirely, OR show a simplified mobile header

### Step 7: Refactor Navbar for Desktop-Only (or Simplified Mobile)
- **File:** `app/src/components/layout/Navbar.tsx`
- Option A: Make the full Navbar `hidden md:flex` (desktop only), create a new simple MobileHeader component
- Option B: Keep Navbar but strip it down on mobile to just title + theme toggle (remove hamburger, nav links, tools dropdown)
- The navigation links (Calendar/Stats/Settings) are no longer needed on mobile since BottomNav handles them
- **Move functionality that leaves the Navbar:**
  - Filter toggle button → keep accessible somewhere on calendar page (e.g., a filter icon in the mobile header, or integrate into calendar grid header)
  - Export/Print/Install → move to Settings page (TASK-11)
  - Language toggle → move to Settings page (TASK-11)

### Step 8: Update Swipe Navigation
- Ensure `useSwipeNavigation` still works with the new mobile layout
- The swipe container should be the MobileCalendarGrid or the whole page content area
- Make sure swiping doesn't conflict with the EventPopover or bottom nav

### Step 9: i18n Keys
- Add any new translation keys needed:
  - `navigation.calendar`, `navigation.stats`, `navigation.settings` (may already exist)
  - `calendar.upcomingEvents` - "Upcoming Events" section header
  - Day abbreviations for the grid headers (SUN, MON, etc.) if not already in translations

### Step 10: Accessibility
- Bottom nav: proper `nav` element with `aria-label="Main navigation"`
- Active tab: `aria-current="page"`
- Calendar grid days: `role="button"` on clickable days, `aria-label` with full date
- Event cards: proper button semantics, keyboard navigable
- Maintain existing keyboard shortcuts (arrow keys for month nav, T for today, F for filters)

### Step 11: Update Existing Tests
- Update any tests that reference the Navbar hamburger menu on mobile
- Update tests that check for navigation links in the Navbar
- Add tests for the new BottomNav component
- Add tests for MobileCalendarGrid (dot rendering, day click, highlight logic)
- Add tests for UpcomingEventCard and UpcomingEventsList

## Edge Cases

- **No events in current month:** Show empty calendar grid with no dots, and "No upcoming events" message in the events list
- **Many events on one day:** Multiple colored dots (max 3-4 before they overflow the cell width)
- **Today is not in the displayed month:** Don't highlight any day as today, but still highlight next match
- **Transition between mobile/desktop:** Ensure responsive breakpoint cleanly switches between layouts
- **iOS safe area:** The `pb-8` on bottom nav handles the home indicator; also consider `env(safe-area-inset-bottom)` for proper iOS support
- **EventPopover with bottom nav:** Ensure the popover/dialog renders above the bottom nav (z-index management)
- **Scroll position:** When switching months, reset scroll to top of the upcoming events list

## Acceptance Criteria

- [ ] Bottom navigation bar renders on mobile with Calendar/Stats/Settings tabs
- [ ] Active tab is highlighted in red based on current route
- [ ] Bottom nav is hidden on desktop (md: breakpoint and above)
- [ ] Mobile calendar shows 7-column month grid with day numbers
- [ ] Event dots appear below days that have matches (red for football, blue for volleyball)
- [ ] Today's date or next match date is visually highlighted
- [ ] Month navigation (prev/next) works via buttons and swipe gestures
- [ ] Adjacent month overflow days show in muted color
- [ ] "Upcoming Events" section shows event cards below the calendar grid
- [ ] Event cards show date badge, competition type, match title, and time
- [ ] Tapping an event card opens the existing EventPopover with full match details
- [ ] Desktop layout is unchanged (keeps current Navbar + CalendarGrid)
- [ ] All existing functionality preserved: EventPopover, keyboard shortcuts, swipe navigation, scroll-to-today
- [ ] Proper bottom padding prevents content from being hidden behind fixed bottom nav
- [ ] Light and dark themes both work correctly with new components
- [ ] All new components have i18n support (EN/EL)
- [ ] Accessibility: proper ARIA attributes, keyboard navigation, screen reader support
- [ ] Existing tests pass, new tests added for new components
- [ ] Build passes (`npm run lint && npm test && npm run build`)

## Files to Create
- `app/src/components/layout/BottomNav.tsx`
- `app/src/components/calendar/MobileCalendarGrid.tsx`
- `app/src/components/calendar/UpcomingEventCard.tsx`
- `app/src/components/calendar/UpcomingEventsList.tsx`

## Files to Modify
- `app/src/pages/CalendarPage.tsx` - Add mobile layout branch
- `app/src/App.tsx` - Add BottomNav to layout
- `app/src/components/layout/Navbar.tsx` - Simplify/hide on mobile
- `app/src/i18n/en.json` - New translation keys
- `app/src/i18n/el.json` - New translation keys
- `app/src/components/calendar/CalendarGrid.tsx` - May need minor adjustments
- `app/src/__tests__/` - New and updated tests
