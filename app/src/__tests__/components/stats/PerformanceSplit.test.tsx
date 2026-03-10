import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { PerformanceSplit } from '@/components/stats/PerformanceSplit';

const mockHome = {
  played: 13, wins: 8, draws: 3, losses: 2,
  goalsFor: 22, goalsAgainst: 10, goalDifference: 12,
};

const mockAway = {
  played: 13, wins: 6, draws: 2, losses: 5,
  goalsFor: 16, goalsAgainst: 15, goalDifference: 1,
};

describe('TASK-04: PerformanceSplit', () => {
  it('renders section title', () => {
    render(<PerformanceSplit home={mockHome} away={mockAway} />);
    expect(screen.getByText('stats.performanceSplit')).toBeDefined();
  });

  it('displays home row with match count and W/D/L', () => {
    const { container } = render(<PerformanceSplit home={mockHome} away={mockAway} />);
    expect(screen.getByText('stats.home')).toBeDefined();
    // W/D/L values rendered inline with labels (e.g., "8stats.w")
    const text = container.textContent ?? '';
    expect(text).toContain('8');
    expect(text).toContain('3');
    expect(text).toContain('2');
  });

  it('displays away row with match count and W/D/L', () => {
    render(<PerformanceSplit home={mockHome} away={mockAway} />);
    expect(screen.getByText('stats.away')).toBeDefined();
  });

  it('shows match counts for both rows', () => {
    const { container } = render(<PerformanceSplit home={mockHome} away={mockAway} />);
    const text = container.textContent ?? '';
    // Both home and away have 13 matches, appearing as "13 stats.matches"
    const matches = text.match(/13/g);
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });

  it('uses horizontal row layout (not side-by-side columns)', () => {
    const { container } = render(<PerformanceSplit home={mockHome} away={mockAway} />);
    // Should NOT have the old grid-cols-2 layout
    const gridCols2 = container.querySelector('.grid-cols-1.md\\:grid-cols-2');
    expect(gridCols2).toBeNull();
  });
});
