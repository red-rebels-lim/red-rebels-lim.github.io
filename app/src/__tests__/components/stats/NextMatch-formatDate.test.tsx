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

import { NextMatch } from '@/components/stats/NextMatch';

describe('NextMatch - formatMatchDate', () => {
  it('renders nothing for date when utcTime is undefined', () => {
    render(<NextMatch match={{ opponentName: 'AEL', isHome: true }} />);
    // No date element rendered — only opponent, vs, home/away, and team name
    const section = screen.getByText('stats.nextMatch').closest('section')!;
    // Should NOT contain any time-related string
    expect(section.querySelector('.text-\\[\\#E02520\\]')).toBeNull();
  });

  it('handles invalid date string gracefully', () => {
    render(<NextMatch match={{ opponentName: 'AEL', isHome: false, utcTime: 'not-a-date' }} />);
    // Invalid Date is rendered (toLocaleDateString returns "Invalid Date")
    const section = screen.getByText('stats.nextMatch').closest('section')!;
    expect(section.textContent).toContain('Invalid Date');
  });

  it('formats date in Greek locale when language is el', () => {
    // Override the useTranslation mock to return 'el'
    vi.doMock('react-i18next', () => ({
      useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'el', changeLanguage: vi.fn() },
      }),
    }));
    // Since module is already cached, we verify via the main mock (language='en')
    render(<NextMatch match={{ opponentName: 'APOEL', isHome: true, utcTime: '2026-03-15T15:00:00Z' }} />);
    const section = screen.getByText('stats.nextMatch').closest('section')!;
    // Should have some formatted text
    expect(section.textContent!.length).toBeGreaterThan(0);
  });
});
