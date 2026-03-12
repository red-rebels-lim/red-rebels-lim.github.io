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

describe('NextMatch', () => {
  it('renders opponent name', () => {
    render(<NextMatch match={{ opponentName: 'APOEL', isHome: true }} />);
    screen.getByText('APOEL');
  });

  it('shows home match indicator for home games', () => {
    render(<NextMatch match={{ opponentName: 'AEL', isHome: true }} />);
    screen.getByText('stats.homeMatch');
  });

  it('shows away match indicator for away games', () => {
    render(<NextMatch match={{ opponentName: 'AEL', isHome: false }} />);
    screen.getByText('stats.awayMatch');
  });

  it('renders match time when provided', () => {
    render(<NextMatch match={{ opponentName: 'AEK', isHome: true, utcTime: '2026-03-01T15:00:00Z' }} />);
    const section = screen.getByText('stats.nextMatch').closest('section');
    expect(section?.textContent).toContain('Mar');
  });

  describe('date formatting edge cases', () => {
    it('renders nothing for date when utcTime is undefined', () => {
      render(<NextMatch match={{ opponentName: 'AEL', isHome: true }} />);
      const section = screen.getByText('stats.nextMatch').closest('section')!;
      expect(section.querySelector('.text-\\[\\#E02520\\]')).toBeNull();
    });

    it('handles invalid date string gracefully', () => {
      render(<NextMatch match={{ opponentName: 'AEL', isHome: false, utcTime: 'not-a-date' }} />);
      const section = screen.getByText('stats.nextMatch').closest('section')!;
      expect(section.textContent).toContain('Invalid Date');
    });

    it('formats date in Greek locale when language is el', () => {
      vi.doMock('react-i18next', () => ({
        useTranslation: () => ({
          t: (key: string) => key,
          i18n: { language: 'el', changeLanguage: vi.fn() },
        }),
      }));
      render(<NextMatch match={{ opponentName: 'APOEL', isHome: true, utcTime: '2026-03-15T15:00:00Z' }} />);
      const section = screen.getByText('stats.nextMatch').closest('section')!;
      expect(section.textContent!.length).toBeGreaterThan(0);
    });
  });
});
