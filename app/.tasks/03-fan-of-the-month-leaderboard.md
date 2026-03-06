# Task 03: Fan of the Month Leaderboard

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: Low
## Category: Fan Engagement & Community

## Description
Track engagement (predictions accuracy, poll participation, app visits) and show a leaderboard. Reward the most active fans.

## Requirements
- Point system for engagement actions (poll votes, correct predictions, app visits, chat messages)
- Monthly leaderboard page or section
- User profiles (nickname-based, anonymous-friendly)
- Historical leaderboard archive
- Badge/achievement system (optional)

## Technical Approach
1. **Parse Classes:**
   - `FanProfile` class: `deviceId`, `nickname`, `totalPoints`, `monthlyPoints`, `achievements`
   - `EngagementLog` class: `deviceId`, `action`, `points`, `createdAt`
2. **Point System:**
   - Poll vote: 5 points
   - Correct prediction: 20 points
   - Chat message: 2 points
   - Daily visit: 3 points
3. **Components:**
   - `Leaderboard.tsx` — ranked list with avatars/nicknames and points
   - `FanProfile.tsx` — personal stats and achievements
4. **Cloud Functions:**
   - Monthly reset/archive function
   - Point aggregation function

## Dependencies
- Requires Task 02 (Polls) and Task 01 (Chat) for meaningful engagement tracking
- Back4App Parse SDK

## Acceptance Criteria
- [ ] Points tracked for engagement actions
- [ ] Monthly leaderboard displayed with rankings
- [ ] User can see their own stats
- [ ] Monthly reset with historical archive
