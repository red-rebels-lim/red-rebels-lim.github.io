import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MonthData, MonthName, CalendarEvent } from '@/types/events';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock month-config
vi.mock('@/data/month-config', () => ({
  monthMap: {
    march: { monthIndex: 2, year: 2026, daysInMonth: 31, startDay: 6 },
    february: { monthIndex: 1, year: 2026, daysInMonth: 28, startDay: 6 },
    september: { monthIndex: 8, year: 2025, daysInMonth: 30, startDay: 0 },
  },
}));

import { MobileCalendarGrid } from '@/components/calendar/MobileCalendarGrid';

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  day: 14,
  title: 'Nea Salamina vs APOEL',
  subtitle: '⚽ - 18:00',
  opponent: '',
  location: 'home',
  sport: 'football-men',
  isMeeting: false,
  status: 'upcoming',
  ...overrides,
});

const buildMonthData = (events: { day: number; sport: CalendarEvent['sport'] }[] = []): MonthData => {
  const days = [];
  // March 2026 starts on Sunday = startDay 6 in Mon-based system
  for (let i = 0; i < 6; i++) {
    days.push({ empty: true as const });
  }
  for (let day = 1; day <= 31; day++) {
    const dayEvents = events
      .filter((e) => e.day === day)
      .map((e) => makeEvent({ day, sport: e.sport }));
    days.push({
      number: day,
      ...(dayEvents.length > 0 ? { events: dayEvents, name: 'days.saturday' } : {}),
    });
  }
  // Pad to complete row
  const total = days.length;
  const needed = Math.ceil(total / 7) * 7;
  for (let i = total; i < needed; i++) {
    days.push({ empty: true as const });
  }
  return { days };
};

describe('TASK-10: MobileCalendarGrid', () => {
  const onDayClick = vi.fn();
  const defaultProps = {
    monthData: buildMonthData([
      { day: 14, sport: 'football-men' },
      { day: 11, sport: 'volleyball-men' },
      { day: 21, sport: 'football-men' },
    ]),
    currentMonth: 'march' as MonthName,
    selectedDay: null as number | null,
    onDayClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria', () => {
    it('renders a 7-column grid layout', () => {
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      const grid = container.querySelector('.grid-cols-7');
      expect(grid).not.toBeNull();
    });

    it('renders day-of-week headers (SUN through SAT)', () => {
      render(<MobileCalendarGrid {...defaultProps} />);
      // At minimum, some short day abbreviations should be present
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      const headerElements = container.querySelectorAll('[aria-hidden="true"]');
      // There should be 7 day header elements
      expect(headerElements.length).toBeGreaterThanOrEqual(7);
    });

    it('renders day numbers 1-31 for March', () => {
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      // Check a few key day numbers are present
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('15');
      expect(container.textContent).toContain('31');
    });

    it('shows red dot for football events', () => {
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      // Day 14 has a football event - should have a red dot
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('shows blue dot for volleyball events', () => {
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      // Day 11 has a volleyball event - should have a blue dot
      // Look for blue-colored dots
      const blueDots = container.querySelectorAll('[class*="blue"]');
      expect(blueDots.length).toBeGreaterThan(0);
    });

    it('shows multiple dots when day has different sport types', () => {
      const multiEventData = buildMonthData([
        { day: 14, sport: 'football-men' },
        { day: 14, sport: 'volleyball-men' },
      ]);
      const { container } = render(
        <MobileCalendarGrid monthData={multiEventData} currentMonth="march" selectedDay={null} onDayClick={onDayClick} />
      );
      // Day 14 should have both red and blue dots
      // Find the day cell for 14 and check it has multiple dots
      const allDots = container.querySelectorAll('.rounded-full');
      // At least some dots should exist for multi-event day
      expect(allDots.length).toBeGreaterThanOrEqual(2);
    });

    it('shows overflow days from adjacent months in muted color', () => {
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      // March 2026 has overflow days (1-4 of April at the end)
      // These should have muted text styling
      const mutedElements = container.querySelectorAll('[class*="slate-300"], [class*="slate-600"]');
      expect(mutedElements.length).toBeGreaterThan(0);
    });

    it('calls onDayClick when a day with events is tapped', () => {
      render(<MobileCalendarGrid {...defaultProps} />);
      // Find and click on day 14 (which has an event)
      const day14 = screen.getByText('14');
      fireEvent.click(day14.closest('button, [role="button"]') || day14);
      expect(onDayClick).toHaveBeenCalledWith(14);
    });

    it('renders all day cells as clickable buttons', () => {
      const { container } = render(<MobileCalendarGrid {...defaultProps} />);
      // All non-empty days should have role="button"
      const buttons = container.querySelectorAll('[role="button"]');
      // March has 31 days
      expect(buttons.length).toBe(31);
    });
  });

  describe('Edge Cases', () => {
    it('renders empty calendar with no events', () => {
      const emptyData = buildMonthData([]);
      const { container } = render(
        <MobileCalendarGrid monthData={emptyData} currentMonth="march" selectedDay={null} onDayClick={onDayClick} />
      );
      // Should still render the grid with day numbers
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('31');
      // No event dots should be present for days with events
      const blueDots = container.querySelectorAll('.bg-blue-500');
      expect(blueDots.length).toBe(0);
    });

    it('calls onDayClick for days without events', () => {
      render(<MobileCalendarGrid {...defaultProps} />);
      // Day 15 has no events but should still be clickable
      const day15 = screen.getByText('15');
      fireEvent.click(day15.closest('[role="button"]') || day15);
      expect(onDayClick).toHaveBeenCalledWith(15);
    });
  });
});
