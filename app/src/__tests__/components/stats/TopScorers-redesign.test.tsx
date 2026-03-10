import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/fotmob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fotmob')>();
  return { ...actual, tApi: (_t: unknown, _ns: string, val: string) => val };
});

import { TopScorers } from '@/components/stats/TopScorers';

const scorers = [
  { name: 'Dimitris Christofi', goals: 12 },
  { name: 'Duminsku', goals: 8 },
  { name: 'Diego Berreguery', goals: 6 },
];

describe('TASK-04: TopScorers vertical list redesign', () => {
  it('renders section title', () => {
    render(<TopScorers scorers={scorers} />);
    expect(screen.getByText('stats.topScorers')).toBeDefined();
  });

  it('renders all scorer names', () => {
    render(<TopScorers scorers={scorers} />);
    expect(screen.getByText('Dimitris Christofi')).toBeDefined();
    expect(screen.getByText('Duminsku')).toBeDefined();
    expect(screen.getByText('Diego Berreguery')).toBeDefined();
  });

  it('renders goal counts', () => {
    render(<TopScorers scorers={scorers} />);
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
    expect(screen.getByText('6')).toBeDefined();
  });

  it('uses vertical list layout (not 3-column grid)', () => {
    const { container } = render(<TopScorers scorers={scorers} />);
    // Old layout used grid-cols-1 sm:grid-cols-3; new uses a simple list
    const gridCols3 = container.querySelector('.sm\\:grid-cols-3');
    expect(gridCols3).toBeNull();
  });

  it('does NOT use medal emojis', () => {
    const { container } = render(<TopScorers scorers={scorers} />);
    expect(container.textContent).not.toContain('🥇');
    expect(container.textContent).not.toContain('🥈');
    expect(container.textContent).not.toContain('🥉');
  });

  it('shows rank numbers', () => {
    const { container } = render(<TopScorers scorers={scorers} />);
    // Should contain rank numbers 1, 2, 3
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('3');
  });
});
