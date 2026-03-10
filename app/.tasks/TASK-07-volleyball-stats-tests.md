# TASK-07: Tests for Volleyball Stats

**Status:** done
**Depends on:** TASK-03, TASK-06
**Estimated scope:** Medium

## Objective

Write unit tests for the volleyball stats calculation engine and integration tests for the volleyball stats UI. Follow existing test patterns in `src/__tests__/`.

## Test Files

### 1. `src/__tests__/lib/volleyball-stats.test.ts`

Tests for `lib/volleyball-stats.ts` functions:

#### `parseVolleyballScore`
```typescript
describe('parseVolleyballScore', () => {
  it('parses home match score correctly', () => {
    expect(parseVolleyballScore('3-1', 'home')).toEqual([3, 1]);
  });

  it('swaps for away match score', () => {
    expect(parseVolleyballScore('3-1', 'away')).toEqual([1, 3]);
  });

  it('returns null for invalid score', () => {
    expect(parseVolleyballScore('', 'home')).toBeNull();
    expect(parseVolleyballScore('abc', 'home')).toBeNull();
  });

  it('handles 0-3 loss', () => {
    expect(parseVolleyballScore('0-3', 'home')).toEqual([0, 3]);
  });
});
```

#### `getVolleyballResult`
```typescript
describe('getVolleyballResult', () => {
  it('returns W when setsFor > setsAgainst', () => {
    expect(getVolleyballResult(3, 1)).toBe('W');
  });

  it('returns L when setsFor < setsAgainst', () => {
    expect(getVolleyballResult(1, 3)).toBe('L');
  });
});
```

#### `calculateVolleyballStatistics`
```typescript
describe('calculateVolleyballStatistics', () => {
  // Mock eventsData to control test data
  // Use vi.hoisted() pattern per CLAUDE.md

  it('calculates overall stats correctly for volleyball-men', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    expect(stats.overall.played).toBeGreaterThan(0);
    expect(stats.overall.wins + stats.overall.losses).toBe(stats.overall.played);
    // No draws in volleyball
  });

  it('calculates set breakdown correctly', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    const { setBreakdown } = stats;
    const totalWins = setBreakdown.threeZero + setBreakdown.threeOne + setBreakdown.threeTwo;
    const totalLosses = setBreakdown.zeroThree + setBreakdown.oneThree + setBreakdown.twoThree;
    expect(totalWins).toBe(stats.overall.wins);
    expect(totalLosses).toBe(stats.overall.losses);
  });

  it('returns last 5 matches for recent form', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    expect(stats.recentForm.length).toBeLessThanOrEqual(5);
    stats.recentForm.forEach(match => {
      expect(['W', 'L']).toContain(match.result);
    });
  });

  it('calculates home/away split that adds up to overall', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    expect(stats.home.played + stats.away.played).toBe(stats.overall.played);
    expect(stats.home.wins + stats.away.wins).toBe(stats.overall.wins);
  });

  it('aggregates top scorers across matches', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    if (stats.topScorers.length > 1) {
      // Should be sorted descending by points
      expect(stats.topScorers[0].totalPoints).toBeGreaterThanOrEqual(
        stats.topScorers[1].totalPoints
      );
    }
  });

  it('returns empty stats for sport with no matches', () => {
    // If we can mock empty events, verify zeros
  });

  it('calculates streaks correctly', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    expect(['W', 'L']).toContain(stats.streaks.currentStreak.type);
    expect(stats.streaks.currentStreak.count).toBeGreaterThanOrEqual(1);
    expect(stats.streaks.longestWinStreak).toBeGreaterThanOrEqual(0);
  });

  it('calculates set win percentage correctly', () => {
    const stats = calculateVolleyballStatistics('volleyball-men');
    if (stats.overall.setsWon + stats.overall.setsLost > 0) {
      const expected = (stats.overall.setsWon / (stats.overall.setsWon + stats.overall.setsLost)) * 100;
      expect(stats.overall.setWinPercentage).toBeCloseTo(expected, 1);
    }
  });

  it('works for volleyball-women too', () => {
    const stats = calculateVolleyballStatistics('volleyball-women');
    expect(stats.overall).toBeDefined();
    expect(stats.setBreakdown).toBeDefined();
  });
});
```

#### `getNextVolleyballMatch`
```typescript
describe('getNextVolleyballMatch', () => {
  it('returns next upcoming match or null', () => {
    const match = getNextVolleyballMatch('volleyball-men');
    if (match) {
      expect(match.opponent).toBeTruthy();
      expect(match.date).toBeInstanceOf(Date);
      expect(['home', 'away']).toContain(match.location);
    }
  });
});
```

### 2. `src/__tests__/components/stats/SetBreakdown.test.tsx`

```typescript
describe('SetBreakdown', () => {
  it('renders sets won and lost bars', () => {
    render(<SetBreakdown setsWon={42} setsLost={22} breakdown={mockBreakdown} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('renders win pattern counts', () => {
    const breakdown = { threeZero: 5, threeOne: 4, threeTwo: 3, zeroThree: 2, oneThree: 1, twoThree: 2 };
    render(<SetBreakdown setsWon={42} setsLost={22} breakdown={breakdown} />);
    expect(screen.getByText('5')).toBeInTheDocument(); // 3-0 wins
  });

  it('handles zero values', () => {
    const empty = { threeZero: 0, threeOne: 0, threeTwo: 0, zeroThree: 0, oneThree: 0, twoThree: 0 };
    render(<SetBreakdown setsWon={0} setsLost={0} breakdown={empty} />);
    // Should render without errors
  });
});
```

### 3. `src/__tests__/pages/StatsPage.test.tsx` (update existing)

Add tests for the tab switching:

```typescript
describe('StatsPage tabs', () => {
  it('renders sport selector tabs', () => {
    render(<StatsPage />);
    expect(screen.getByText(/men's football/i)).toBeInTheDocument();
    expect(screen.getByText(/men's volleyball/i)).toBeInTheDocument();
    expect(screen.getByText(/women's volleyball/i)).toBeInTheDocument();
  });

  it('shows football tab by default', () => {
    render(<StatsPage />);
    // Football-specific content should be visible
    expect(screen.getByText(/total points/i)).toBeInTheDocument();
  });

  it('switches to volleyball tab on click', async () => {
    render(<StatsPage />);
    await userEvent.click(screen.getByText(/men's volleyball/i));
    // Volleyball-specific content should appear
    expect(screen.getByText(/set breakdown/i)).toBeInTheDocument();
  });

  it('shows no data message when sport has no matches', () => {
    // If applicable
  });
});
```

## Test Patterns to Follow

Per CLAUDE.md:
- Use `vi.hoisted()` for mock variables referenced in `vi.mock()`
- Mock Radix portals if components use Sheet/Dialog
- Use `vi.advanceTimersByTime()` NOT `vi.runAllTimers()` for timers
- Stub globals as needed: `vi.stubGlobal(...)`

## Acceptance Criteria

- [ ] `volleyball-stats.test.ts` covers all exported functions
- [ ] `SetBreakdown.test.tsx` covers rendering and edge cases
- [ ] StatsPage tab tests verify switching behavior
- [ ] All existing tests still pass (`npm test`)
- [ ] No snapshot tests (this project uses assertion-based testing)
- [ ] Coverage for volleyball stats functions > 80%
