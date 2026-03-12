import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock recharts to avoid jsdom layout issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
}));

import { SeasonProgress } from '@/components/stats/SeasonProgress';

describe('SeasonProgress', () => {
  it('renders nothing when pointsProgression is empty', () => {
    const { container } = render(<SeasonProgress pointsProgression={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders chart when pointsProgression has data', () => {
    const data = [
      { match: 1, points: 3, opponent: 'APOEL' },
      { match: 2, points: 4, opponent: 'AEL' },
    ];
    render(<SeasonProgress pointsProgression={data} />);
    screen.getByText('stats.seasonProgress');
    screen.getByTestId('line-chart');
  });

  it('renders section heading', () => {
    const data = [{ match: 1, points: 3, opponent: 'AEK' }];
    render(<SeasonProgress pointsProgression={data} />);
    const heading = screen.getByText('stats.seasonProgress');
    expect(heading.tagName).toBe('H2');
  });
});
