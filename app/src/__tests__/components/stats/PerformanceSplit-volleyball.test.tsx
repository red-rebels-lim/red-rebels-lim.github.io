import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { PerformanceSplit } from '@/components/stats/PerformanceSplit';

describe('TASK-05: PerformanceSplit volleyball (no draws)', () => {
  const mockHome = { played: 9, wins: 7, draws: 0, losses: 2, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
  const mockAway = { played: 9, wins: 5, draws: 0, losses: 4, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };

  it('hides draws column when showDraws is false', () => {
    const { container } = render(
      <PerformanceSplit home={mockHome} away={mockAway} showDraws={false} />
    );
    const text = container.textContent ?? '';
    // Should not contain draws indicator
    expect(text).not.toContain('0stats.d');
    // But should contain wins and losses
    expect(text).toContain('stats.w');
    expect(text).toContain('stats.l');
  });

  it('shows draws by default (football mode)', () => {
    const { container } = render(
      <PerformanceSplit home={mockHome} away={mockAway} />
    );
    const text = container.textContent ?? '';
    expect(text).toContain('stats.d');
  });

  it('renders correct W/L values for volleyball', () => {
    const { container } = render(
      <PerformanceSplit home={mockHome} away={mockAway} showDraws={false} />
    );
    const text = container.textContent ?? '';
    expect(text).toContain('7');
    expect(text).toContain('5');
  });
});
