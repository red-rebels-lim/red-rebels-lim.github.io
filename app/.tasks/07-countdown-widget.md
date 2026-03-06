# Task 07: Countdown Widget on Home Screen

## Status: DONE
## Priority: N/A
## Effort: Small
## Impact: Medium
## Category: Live & Real-Time Features

## Description
For the next upcoming match, show a prominent countdown card on the Calendar page (not just within the event card).

## Implementation
- `src/components/calendar/CountdownTimer.tsx` — displays a countdown to kickoff on each upcoming event card
- Used within `EventCard.tsx` for matches with specific kickoff times
- Shows days, hours, minutes countdown format

## Relevant Files
- `src/components/calendar/CountdownTimer.tsx`
- `src/components/calendar/EventCard.tsx`
