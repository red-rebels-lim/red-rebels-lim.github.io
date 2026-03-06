# Task 23: Personal Match Attendance Tracker

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Medium
## Category: Analytics & Insights

## Description
Let fans mark which matches they attended. Show stats at end of season ("You attended 12 out of 20 home matches").

## Requirements
- "I was there" toggle button on played match cards or EventPopover
- Attendance data persisted to localStorage (or Back4App for cross-device sync)
- Personal attendance stats section on Stats page
- Season summary: total attended, home vs away, by sport

## Technical Approach
1. **Data Storage:**
   - localStorage: `attended-matches` key with array of match IDs
   - Optional: Back4App `Attendance` class for cross-device sync
2. **Components:**
   - `AttendanceToggle.tsx` — "I was there" button with checkmark icon
   - `AttendanceStats.tsx` — personal attendance summary card
3. **Integration:**
   - Add toggle to `EventPopover` for played matches
   - Add attendance stats section to `StatsPage`
   - Small badge on EventCard for attended matches
4. **Stats Calculations:**
   - Total matches attended / total played
   - Home vs away attendance breakdown
   - Attendance by sport
   - Attendance streak

## Relevant Files
- `src/components/calendar/EventPopover.tsx` — add attendance toggle
- `src/components/calendar/EventCard.tsx` — attended badge
- `src/pages/StatsPage.tsx` — attendance stats section

## Dependencies
- None for localStorage approach
- Back4App Parse SDK for cross-device sync (optional)

## Acceptance Criteria
- [ ] Toggle button on played matches to mark attendance
- [ ] Attendance persisted across sessions
- [ ] Personal stats shown on Stats page
- [ ] Visual indicator on attended match cards
