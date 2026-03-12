import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MonthData, MonthName, CalendarEvent } from '@/types/events';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { UpcomingEventsList } from '@/components/calendar/UpcomingEventsList';

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  day: 14,
  title: 'Νέα Σαλαμίνα vs APOEL',
  subtitle: '⚽ - 18:00',
  location: 'home',
  sport: 'football-men',
  isMeeting: false,
  status: 'upcoming',
  competition: 'league',
  ...overrides,
});

const buildMonthData = (events: CalendarEvent[]): MonthData => {
  const days = [];
  for (let day = 1; day <= 31; day++) {
    const dayEvents = events.filter((e) => e.day === day);
    days.push({
      number: day,
      ...(dayEvents.length > 0 ? { events: dayEvents, name: 'days.saturday' } : {}),
    });
  }
  return { days };
};

describe('TASK-10: UpcomingEventsList', () => {
  const onEventClick = vi.fn();
  const defaultMonth = 'march' as MonthName;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria', () => {
    it('renders "Selected Day" header when a day with events is selected', () => {
      const monthData = buildMonthData([makeEvent({ day: 14 })]);
      render(<UpcomingEventsList monthData={monthData} currentMonth={defaultMonth} selectedDay={14} onEventClick={onEventClick} />);
      screen.getByText(/calendar.selectedDay|selected day/i);
    });

    it('renders event cards only for the selected day', () => {
      const events = [
        makeEvent({ day: 14, title: 'Νέα Σαλαμίνα vs APOEL' }),
        makeEvent({ day: 21, title: 'Νέα Σαλαμίνα vs Anorthosis' }),
      ];
      const monthData = buildMonthData(events);
      render(<UpcomingEventsList monthData={monthData} currentMonth={defaultMonth} selectedDay={14} onEventClick={onEventClick} />);
      screen.getByText(/APOEL/);
      expect(screen.queryByText(/Anorthosis/)).toBeNull();
    });

    it('renders multiple events when selected day has multiple', () => {
      const events = [
        makeEvent({ day: 14, title: 'Νέα Σαλαμίνα vs APOEL', sport: 'football-men' }),
        makeEvent({ day: 14, title: 'Νέα Σαλαμίνα vs Omonia', sport: 'volleyball-men' }),
      ];
      const monthData = buildMonthData(events);
      render(<UpcomingEventsList monthData={monthData} currentMonth={defaultMonth} selectedDay={14} onEventClick={onEventClick} />);
      screen.getByText(/APOEL/);
      screen.getByText(/Omonia/);
    });

    it('renders clickable event cards', () => {
      const events = [makeEvent({ day: 14 })];
      const monthData = buildMonthData(events);
      const { container } = render(
        <UpcomingEventsList monthData={monthData} currentMonth={defaultMonth} selectedDay={14} onEventClick={onEventClick} />
      );
      const cards = container.querySelectorAll('[role="button"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('returns null when no day is selected', () => {
      const monthData = buildMonthData([makeEvent({ day: 14 })]);
      const { container } = render(
        <UpcomingEventsList monthData={monthData} currentMonth={defaultMonth} selectedDay={null} onEventClick={onEventClick} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('returns null when selected day has no events', () => {
      const monthData = buildMonthData([makeEvent({ day: 14 })]);
      const { container } = render(
        <UpcomingEventsList monthData={monthData} currentMonth={defaultMonth} selectedDay={15} onEventClick={onEventClick} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('returns null when month has no events at all', () => {
      const emptyData = buildMonthData([]);
      const { container } = render(
        <UpcomingEventsList monthData={emptyData} currentMonth={defaultMonth} selectedDay={14} onEventClick={onEventClick} />
      );
      expect(container.innerHTML).toBe('');
    });
  });
});
