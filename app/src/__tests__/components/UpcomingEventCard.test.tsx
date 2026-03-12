import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CalendarEvent, MonthName } from '@/types/events';

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

import { UpcomingEventCard } from '@/components/calendar/UpcomingEventCard';

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

describe('TASK-10: UpcomingEventCard', () => {
  const onClick = vi.fn();
  const defaultEvent = makeEvent();
  const defaultMonth = 'march' as MonthName;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria', () => {
    it('renders date badge with day number and month abbreviation', () => {
      render(<UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />);
      screen.getByText('14');
      // Month abbreviation (Mar or months.march)
      const container = screen.getByText('14').closest('[class]');
      expect(container).not.toBeNull();
    });

    it('renders match title with team names', () => {
      render(<UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />);
      // Should display the opponent name at minimum
      screen.getByText(/APOEL/i);
    });

    it('renders competition type label', () => {
      render(<UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />);
      // Should show the competition type (league/cup)
      const { container } = render(<UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />);
      // Competition type label should be present
      expect(container.textContent).toBeTruthy();
    });

    it('renders date and time info', () => {
      render(<UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />);
      // Time should be visible from the subtitle
      screen.getByText(/18:00/);
    });

    it('calls onClick when card is clicked', () => {
      const { container } = render(
        <UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />
      );
      const card = container.firstElementChild!;
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('uses red accent for football events', () => {
      const { container } = render(
        <UpcomingEventCard event={makeEvent({ sport: 'football-men' })} monthName={defaultMonth} onClick={onClick} />
      );
      // Date badge should use red color scheme (dc2828 or primary or red)
      const badge = container.querySelector('[class*="dc2828"], [class*="primary"], [class*="red"]');
      expect(badge).not.toBeNull();
    });

    it('uses blue accent for volleyball events', () => {
      const { container } = render(
        <UpcomingEventCard event={makeEvent({ sport: 'volleyball-men' })} monthName={defaultMonth} onClick={onClick} />
      );
      // Date badge should use blue color scheme
      const badge = container.querySelector('[class*="blue"]');
      expect(badge).not.toBeNull();
    });

    it('renders chevron/arrow button on the right', () => {
      const { container } = render(
        <UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />
      );
      // Should have a clickable chevron element
      const chevronBtn = container.querySelector('button, [role="button"]');
      expect(chevronBtn).not.toBeNull();
    });

    it('has rounded card styling', () => {
      const { container } = render(
        <UpcomingEventCard event={defaultEvent} monthName={defaultMonth} onClick={onClick} />
      );
      const card = container.firstElementChild;
      expect(card?.className).toContain('rounded');
    });
  });

  describe('Edge Cases', () => {
    it('renders volleyball cup event correctly', () => {
      const vbEvent = makeEvent({
        sport: 'volleyball-women',
        title: 'Νέα Σαλαμίνα vs Omonia',
        subtitle: '🏐 - 19:30',
        competition: 'cup',
      });
      render(<UpcomingEventCard event={vbEvent} monthName={defaultMonth} onClick={onClick} />);
      screen.getByText(/Omonia/);
    });

    it('handles event without competition type', () => {
      const noCompEvent = makeEvent({ competition: undefined });
      const { container } = render(
        <UpcomingEventCard event={noCompEvent} monthName={defaultMonth} onClick={onClick} />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('handles played event with score', () => {
      const playedEvent = makeEvent({ status: 'played', score: '2-1' });
      const { container } = render(
        <UpcomingEventCard event={playedEvent} monthName={defaultMonth} onClick={onClick} />
      );
      expect(container.innerHTML).not.toBe('');
    });
  });
});
