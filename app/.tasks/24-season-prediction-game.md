# Task 24: Season Prediction Game

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: Low
## Category: Analytics & Insights

## Description
At the start of the season, let fans predict final league position, top scorer, etc. Reveal accuracy at season end.

## Requirements
- Prediction form at start of season (league position, top scorer, total points)
- Predictions locked after a deadline (e.g., after first matchday)
- End-of-season reveal comparing predictions to actual results
- Leaderboard of most accurate predictors

## Technical Approach
1. **Parse Classes:**
   - `SeasonPrediction` class: `deviceId`, `season`, `predictedPosition`, `predictedTopScorer`, `predictedPoints`, `createdAt`
2. **Components:**
   - `PredictionForm.tsx` — form to submit predictions
   - `PredictionReveal.tsx` — end-of-season accuracy reveal
3. **Timing:**
   - Show prediction form only before season deadline
   - Show results only after season ends
   - Configure dates in sport-config

## Dependencies
- Back4App Parse SDK
- End-of-season actual data for comparison
- Task 03 (Leaderboard) — optional integration

## Acceptance Criteria
- [ ] Prediction form available before season deadline
- [ ] Predictions locked after deadline
- [ ] Accuracy revealed at season end
- [ ] One prediction per device
