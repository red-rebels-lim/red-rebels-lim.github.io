# Task 14: Unified Season Dashboard

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Medium
## Category: Multi-Sport Enhancements

## Description
A landing page that shows a snapshot of all three teams at once: next match, current form, and league position for each sport.

## Requirements
- Dashboard view showing all three teams side-by-side
- Per-team card with: next match, current form (last 5 results), league position
- Quick navigation to full stats or calendar filtered by sport
- Auto-refresh data on page load

## Technical Approach
1. **Components:**
   - `DashboardPage.tsx` — new page at `/dashboard` route
   - `TeamSnapshot.tsx` — card showing team summary (next match, form, position)
2. **Data:**
   - Reuse `useCalendar` hook to get next upcoming match per sport
   - Reuse `stats.ts` for form calculation per sport
   - Reuse standings data for league position
3. **Layout:**
   - Three columns on desktop, stacked cards on mobile
   - Each card links to filtered calendar view for that sport

## Relevant Files
- `src/hooks/useCalendar.ts` — calendar data
- `src/lib/stats.ts` — form calculation
- `src/App.tsx` — route registration
- `src/components/layout/Navbar.tsx` — add Dashboard nav link

## Dependencies
- Task 12 (Volleyball Statistics) — for multi-sport stats
- Task 13 (Sport-Specific Standings) — for league positions

## Acceptance Criteria
- [ ] Dashboard shows all three teams
- [ ] Each team shows next match, form, league position
- [ ] Cards link to filtered views
- [ ] Responsive layout (3-column desktop, stacked mobile)
