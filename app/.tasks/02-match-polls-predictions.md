# Task 02: Match Polls & Predictions

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: Medium
## Category: Fan Engagement & Community

## Description
Before each upcoming match, let fans vote on predicted score or result (Win/Draw/Loss). Show prediction stats after the match. Gamification element that drives repeat visits.

## Requirements
- Poll widget on upcoming match cards or EventPopover
- Three prediction types: Win / Draw / Loss
- Optional exact score prediction
- Live vote tally showing percentage breakdown
- Post-match reveal of prediction accuracy
- One vote per device (localStorage + optional Parse tracking)

## Technical Approach
1. **Parse Classes:**
   - `MatchPrediction` class: `matchId`, `deviceId`, `prediction` (win/draw/loss), `exactScore`, `createdAt`
2. **Components:**
   - `PredictionPoll.tsx` — poll widget with Win/Draw/Loss buttons and optional score input
   - `PredictionResults.tsx` — bar chart or pie chart showing vote distribution
3. **Logic:**
   - Generate anonymous `deviceId` via `crypto.randomUUID()`, store in localStorage
   - Before match: show poll widget, allow voting
   - After match: show results with correct answer highlighted
   - Use Parse Cloud Function to aggregate results server-side
4. **Integration:**
   - Add prediction section to `EventPopover` for upcoming matches
   - Show small prediction badge on `EventCard` ("72% predict Win")

## Relevant Files
- `src/components/calendar/EventPopover.tsx` — integration point
- `src/components/calendar/EventCard.tsx` — badge display
- `src/types/events.ts` — event type definitions

## Dependencies
- Back4App Parse SDK
- Recharts (already installed) for results visualization

## Acceptance Criteria
- [ ] Fans can predict Win/Draw/Loss for upcoming matches
- [ ] One vote per device enforced
- [ ] Live vote tally displayed
- [ ] Post-match results shown with correct answer highlighted
- [ ] Mobile-friendly interface
