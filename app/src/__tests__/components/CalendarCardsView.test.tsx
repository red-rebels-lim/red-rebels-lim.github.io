import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MonthData, CalendarEvent } from '@/types/events';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'calendar.noEvents': 'No events this month',
        'sports.footballMen': 'Football',
        'sports.volleyballWomen': 'Volleyball Women',
        'locations.home': 'Home',
        'locations.away': 'Away',
        'popover.win': 'Win',
        'popover.loss': 'Loss',
        'popover.upcoming': 'Upcoming',
        'calendar.cup': 'Cup',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/data/month-config', () => ({
  monthMap: { april: { monthIndex: 3, year: 2026, daysInMonth: 30, startDay: 3 } },
  MONTH_ORDER: ['april'],
}));

import { CalendarCardsView } from '@/components/calendar/CalendarCardsView';

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    title: 'Nea Salamina vs Opponent',
    subtitle: 'Apr 10 - 16:00',
    opponent: '',
    sport: 'football-men',
    location: 'home',
    day: 10,
    isMeeting: false,
    ...overrides,
  };
}

function makeMonthData(events: CalendarEvent[]): MonthData {
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dayEvents = events.filter(e => e.day === dayNum);
    return { number: dayNum, events: dayEvents.length > 0 ? dayEvents : undefined };
  });
  return { days };
}

describe('CalendarCardsView', () => {
  const played = makeEvent({ day: 4, status: 'played', score: '3-0', title: 'Nea Salamina vs AOAN' });
  const upcoming = makeEvent({ day: 19, title: 'Karmiotissa vs Nea Salamina', location: 'away' });

  it('renders each event as a card', () => {
    render(<CalendarCardsView monthData={makeMonthData([played, upcoming])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('Nea Salamina vs AOAN')).toBeDefined();
    expect(screen.getByText('Karmiotissa vs Nea Salamina')).toBeDefined();
  });

  it('played cards show score prominently', () => {
    render(<CalendarCardsView monthData={makeMonthData([played])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('3 - 0')).toBeDefined();
  });

  it('shows sport tag', () => {
    render(<CalendarCardsView monthData={makeMonthData([played])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('Football')).toBeDefined();
  });

  it('clicking a card calls onEventClick', () => {
    const onClick = vi.fn();
    render(<CalendarCardsView monthData={makeMonthData([played])} currentMonth="april" onEventClick={onClick} />);
    fireEvent.click(screen.getByText('Nea Salamina vs AOAN').closest('[role="button"]')!);
    expect(onClick).toHaveBeenCalledWith(played);
  });

  it('renders empty state', () => {
    render(<CalendarCardsView monthData={makeMonthData([])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('No events this month')).toBeDefined();
  });

  it('cup matches show cup badge', () => {
    const cup = makeEvent({ day: 7, competition: 'cup', status: 'played', score: '1-3', sport: 'volleyball-women', title: 'AEK vs Nea Salamina' });
    render(<CalendarCardsView monthData={makeMonthData([cup])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('Cup')).toBeDefined();
  });
});
