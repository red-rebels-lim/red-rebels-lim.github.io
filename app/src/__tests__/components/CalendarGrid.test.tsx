import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import type { MonthData } from '@/types/events';

const mockMonthData: MonthData = {
  days: [
    { empty: true as const },
    { empty: true as const },
    { number: 1 },
    { number: 2, name: 'Τρίτη', events: [
      {
        day: 2,
        title: 'Νέα Σαλαμίνα vs APOEL',
        subtitle: '⚽ - 17:00',
        location: 'home',
        sport: 'football-men',
        isMeeting: false,
      },
    ]},
    { number: 3 },
    { number: 4 },
    { number: 5 },
  ],
};

describe('CalendarGrid', () => {
  it('renders weekday headers', () => {
    render(<CalendarGrid monthData={mockMonthData} currentMonth="february" />);
    // Desktop headers
    expect(screen.getAllByText('days.monday').length).toBeGreaterThan(0);
  });

  it('renders day numbers', () => {
    const { container } = render(<CalendarGrid monthData={mockMonthData} currentMonth="february" />);
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('3');
  });

  it('renders events on days that have them', () => {
    render(<CalendarGrid monthData={mockMonthData} currentMonth="february" />);
    // The EventCard inside should show the opponent
    expect(screen.getAllByText('APOEL').length).toBeGreaterThan(0);
  });

  it('renders mobile view for event days', () => {
    const { container } = render(<CalendarGrid monthData={mockMonthData} currentMonth="february" />);
    // Mobile section should exist with md:hidden
    const mobileSection = container.querySelector('.md\\:hidden');
    expect(mobileSection).not.toBeNull();
  });
});
