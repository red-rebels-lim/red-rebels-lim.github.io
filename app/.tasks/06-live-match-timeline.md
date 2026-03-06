# Task 06: Live Match Timeline

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: Medium
## Category: Live & Real-Time Features

## Description
Show key events (goals, cards, substitutions) in real-time during a match, pulled from FotMob data.

## Requirements
- Timeline component showing match events chronologically
- Event types: goals, yellow/red cards, substitutions, half-time, full-time
- Auto-refresh during live matches (pairs with Task 05)
- Post-match: show complete timeline for played matches

## Technical Approach
1. **FotMob Data:**
   - Extend `src/lib/fotmob.ts` to fetch match detail/events endpoint
   - Parse events: goalscorers, cards, substitutions with minute markers
2. **Components:**
   - `MatchTimeline.tsx` — vertical timeline with event icons and minute markers
   - `TimelineEvent.tsx` — individual event item (goal icon, card icon, sub icon)
3. **Integration:**
   - Add timeline section to `EventPopover` for played and live matches
   - Reuse polling mechanism from Task 05 for live updates

## Relevant Files
- `src/lib/fotmob.ts` — FotMob API (needs match events endpoint)
- `src/components/calendar/EventPopover.tsx` — integration point

## Dependencies
- Task 05 (Live Score Updates) — shares polling infrastructure
- FotMob match events API endpoint availability

## Acceptance Criteria
- [ ] Timeline shows goals, cards, substitutions with minute markers
- [ ] Updates in real-time during live matches
- [ ] Complete timeline available for played matches
- [ ] Icons distinguish event types
- [ ] Mobile-friendly vertical layout
