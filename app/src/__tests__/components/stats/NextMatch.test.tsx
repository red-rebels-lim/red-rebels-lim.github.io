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
    expect(screen.getByText('APOEL')).toBeDefined();
  });

  it('shows home match indicator for home games', () => {
    render(<NextMatch match={{ opponentName: 'AEL', isHome: true }} />);
    expect(screen.getByText('stats.homeMatch')).toBeDefined();
  });

  it('shows away match indicator for away games', () => {
    render(<NextMatch match={{ opponentName: 'AEL', isHome: false }} />);
    expect(screen.getByText('stats.awayMatch')).toBeDefined();
  });

  it('renders match time when provided', () => {
    render(<NextMatch match={{ opponentName: 'AEK', isHome: true, utcTime: '2026-03-01T15:00:00Z' }} />);
    // The formatMatchDate function produces locale-specific date text
    const section = screen.getByText('stats.nextMatch').closest('section');
    // Should contain some formatted date text (month name or similar)
    expect(section?.textContent).toContain('Mar');
  });
});
