import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock recharts to avoid canvas/SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { GoalDistribution } from '@/components/stats/GoalDistribution';

describe('GoalDistribution', () => {
  it('returns null for empty goalDistribution array', () => {
    const { container } = render(<GoalDistribution goalDistribution={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders section title and chart when data is provided', () => {
    const data = [
      { match: 'vs Omonia', opponent: 'ΟΜΟΝΟΙΑ', goalsFor: 3, goalsAgainst: 1 },
      { match: 'vs APOEL', opponent: 'APOEL', goalsFor: 1, goalsAgainst: 2 },
    ];
    render(<GoalDistribution goalDistribution={data} />);
    screen.getByText('stats.goalDistribution');
    screen.getByTestId('bar-chart');
  });

  it('has accessible role="img" on chart container', () => {
    const data = [{ match: 'vs Test', opponent: 'TEST', goalsFor: 1, goalsAgainst: 0 }];
    render(<GoalDistribution goalDistribution={data} />);
    screen.getByRole('img');
  });
});
