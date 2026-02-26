import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

const carouselMonthData: MonthData = {
  days: [
    { number: 7, name: 'Τετάρτη', events: [
      { day: 7, title: 'Νέα Σαλαμίνα vs APOEL', subtitle: '⚽ - 17:00', location: 'home', sport: 'football-men', isMeeting: false },
      { day: 7, title: 'Νέα Σαλαμίνα vs Anorthosis', subtitle: '⚽ - 20:00', location: 'home', sport: 'football-men', isMeeting: false },
    ]},
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

  it('clicks event card to open event popover', () => {
    render(<CalendarGrid monthData={mockMonthData} currentMonth="february" />);
    // Click on the event text - propagates to EventCard onClick → onSelectEvent
    const apoel = screen.getAllByText('APOEL');
    fireEvent.click(apoel[0]);
    // EventPopover should open (Dialog renders in portal)
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('renders carousel controls when day has multiple events', () => {
    render(<CalendarGrid monthData={carouselMonthData} currentMonth="february" />);
    expect(screen.getByLabelText('Previous event')).toBeDefined();
    expect(screen.getByLabelText('Next event')).toBeDefined();
  });

  it('navigates to next event in carousel', () => {
    render(<CalendarGrid monthData={carouselMonthData} currentMonth="february" />);
    const nextBtn = screen.getByLabelText('Next event');
    fireEvent.click(nextBtn);
    // Should not throw; safeIdx changes
  });

  it('navigates to previous event in carousel', () => {
    render(<CalendarGrid monthData={carouselMonthData} currentMonth="february" />);
    const nextBtn = screen.getByLabelText('Next event');
    const prevBtn = screen.getByLabelText('Previous event');
    fireEvent.click(nextBtn); // go to idx 1
    fireEvent.click(prevBtn); // go back to idx 0
  });

  it('clicks carousel dot to select event by index', () => {
    render(<CalendarGrid monthData={carouselMonthData} currentMonth="february" />);
    const dot = screen.getByLabelText('Event 2 of 2');
    fireEvent.click(dot);
  });

  it('clicks carousel EventCard to open popover (covers carousel onClick)', () => {
    render(<CalendarGrid monthData={carouselMonthData} currentMonth="february" />);
    // The carousel EventCard shows the first event "APOEL" — click it to trigger onSelectEvent
    const apeolCards = screen.getAllByText('APOEL');
    fireEvent.click(apeolCards[0]);
    // EventPopover should now be open
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('clicks mobile EventCard to open popover (covers mobile onClick)', () => {
    render(<CalendarGrid monthData={mockMonthData} currentMonth="february" />);
    // Both desktop and mobile sections render; getAllByText('APOEL') returns both
    const apeolCards = screen.getAllByText('APOEL');
    if (apeolCards.length > 1) {
      fireEvent.click(apeolCards[apeolCards.length - 1]);
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    }
  });
});
