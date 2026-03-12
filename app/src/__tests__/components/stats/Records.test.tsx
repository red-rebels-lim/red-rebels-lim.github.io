import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { Records } from '@/components/stats/Records';

describe('Records', () => {
  it('returns null when both records are null', () => {
    const { container } = render(<Records biggestWin={null} heaviestDefeat={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders only biggest win when heaviest defeat is null', () => {
    render(<Records biggestWin={{ score: '5-0', opponent: 'Omonia', margin: 5 }} heaviestDefeat={null} />);
    screen.getByText('stats.biggestWin');
    screen.getByText('5-0');
    screen.getByText('vs Omonia');
    expect(screen.queryByText('stats.heaviestDefeat')).toBeNull();
  });

  it('renders only heaviest defeat when biggest win is null', () => {
    render(<Records biggestWin={null} heaviestDefeat={{ score: '0-4', opponent: 'APOEL', margin: 4 }} />);
    screen.getByText('stats.heaviestDefeat');
    screen.getByText('0-4');
    screen.getByText('vs APOEL');
    expect(screen.queryByText('stats.biggestWin')).toBeNull();
  });

  it('renders both records with score and opponent', () => {
    render(
      <Records
        biggestWin={{ score: '5-0', opponent: 'Omonia', margin: 5 }}
        heaviestDefeat={{ score: '0-4', opponent: 'APOEL', margin: 4 }}
      />
    );
    screen.getByText('stats.biggestWin');
    screen.getByText('5-0');
    screen.getByText('stats.heaviestDefeat');
    screen.getByText('0-4');
  });
});
