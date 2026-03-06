# Task 25: Win Probability Indicator

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Low
## Category: Analytics & Insights

## Description
Based on head-to-head record and current form, show a simple predicted outcome percentage for upcoming matches.

## Requirements
- Win/Draw/Loss probability percentages for upcoming matches
- Based on: current form, home/away record, head-to-head history
- Display as horizontal bar or pie chart on EventPopover
- Clear disclaimer that these are estimates

## Technical Approach
1. **Algorithm:**
   - Weight factors: current form (40%), home/away record (30%), head-to-head (30%)
   - Calculate from existing played match data
   - Simple Elo-style or weighted historical approach
2. **Components:**
   - `WinProbability.tsx` — horizontal stacked bar (Win% | Draw% | Loss%)
   - Show in EventPopover for upcoming matches
3. **Data:**
   - Use existing event data for historical calculations
   - No external API needed — all computed from local data

## Relevant Files
- `src/lib/stats.ts` — extend with probability calculations
- `src/components/calendar/EventPopover.tsx` — display integration

## Dependencies
- Sufficient historical match data for meaningful predictions

## Acceptance Criteria
- [ ] Win/Draw/Loss probabilities shown for upcoming matches
- [ ] Based on form and historical data
- [ ] Visual bar chart display
- [ ] Disclaimer that percentages are estimates
