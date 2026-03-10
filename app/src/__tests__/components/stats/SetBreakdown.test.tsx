import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { SetBreakdown } from '@/components/stats/SetBreakdown';

const mockProps = {
  setsWon: 42,
  setsLost: 22,
  breakdown: {
    threeZero: 5,
    threeOne: 4,
    threeTwo: 3,
    zeroThree: 2,
    oneThree: 3,
    twoThree: 1,
  },
};

describe('TASK-05: SetBreakdown', () => {
  it('renders section title', () => {
    render(<SetBreakdown {...mockProps} />);
    expect(screen.getByText('stats.setBreakdown')).toBeDefined();
  });

  it('displays sets won count', () => {
    render(<SetBreakdown {...mockProps} />);
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('stats.setsWon')).toBeDefined();
  });

  it('displays sets lost count', () => {
    render(<SetBreakdown {...mockProps} />);
    expect(screen.getByText('22')).toBeDefined();
    expect(screen.getByText('stats.setsLost')).toBeDefined();
  });

  it('displays 3-0, 3-1, 3-2 win counts', () => {
    render(<SetBreakdown {...mockProps} />);
    expect(screen.getByText('stats.threeZero')).toBeDefined();
    expect(screen.getByText('stats.threeOne')).toBeDefined();
    expect(screen.getByText('stats.threeTwo')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('renders horizontal progress bars', () => {
    const { container } = render(<SetBreakdown {...mockProps} />);
    // Should have progress bar elements
    const bars = container.querySelectorAll('[role="progressbar"]');
    expect(bars.length).toBe(2);
  });

  it('renders with zero values without errors', () => {
    render(
      <SetBreakdown
        setsWon={0}
        setsLost={0}
        breakdown={{
          threeZero: 0, threeOne: 0, threeTwo: 0,
          zeroThree: 0, oneThree: 0, twoThree: 0,
        }}
      />
    );
    expect(screen.getByText('stats.setBreakdown')).toBeDefined();
  });
});
