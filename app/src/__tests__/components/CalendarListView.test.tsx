import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MonthData, CalendarEvent } from '@/types/events';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'calendar.played': 'Played',
        'calendar.upcomingSection': 'Upcoming',
        'calendar.noEvents': 'No events this month',
        'sports.footballMen': 'Football',
        'sports.volleyballMen': 'Volleyball Men',
        'sports.volleyballWomen': 'Volleyball Women',
        'locations.home': 'Home',
        'locations.away': 'Away',
        'popover.win': 'Win',
        'popover.loss': 'Loss',
        'popover.draw': 'Draw',
        'calendar.cup': 'Cup',
      };
      return map[key] ?? key;
    },
  }),
}));

import { CalendarListView } from '@/components/calendar/CalendarListView';

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    title: 'Test vs Opponent',
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

describe('CalendarListView', () => {
  const played = makeEvent({ day: 4, status: 'played', score: '3-0', title: 'Nea Salamina vs AOAN' });
  const upcoming = makeEvent({ day: 19, title: 'Karmiotissa vs Nea Salamina', location: 'away' });

  it('renders played matches with scores', () => {
    render(<CalendarListView monthData={makeMonthData([played])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('3-0')).toBeDefined();
  });

  it('renders upcoming matches with day number', () => {
    render(<CalendarListView monthData={makeMonthData([upcoming])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('19')).toBeDefined();
  });

  it('separates played and upcoming into sections', () => {
    render(<CalendarListView monthData={makeMonthData([played, upcoming])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('Played')).toBeDefined();
    expect(screen.getByText('Upcoming')).toBeDefined();
  });

  it('clicking an event calls onEventClick', () => {
    const onClick = vi.fn();
    render(<CalendarListView monthData={makeMonthData([played])} currentMonth="april" onEventClick={onClick} />);
    fireEvent.click(screen.getByText('3-0').closest('[role="button"]')!);
    expect(onClick).toHaveBeenCalledWith(played);
  });

  it('renders empty state when no events', () => {
    render(<CalendarListView monthData={makeMonthData([])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('No events this month')).toBeDefined();
  });

  it('shows cup badge for cup matches', () => {
    const cup = makeEvent({ day: 7, competition: 'cup', status: 'played', score: '1-3' });
    render(<CalendarListView monthData={makeMonthData([cup])} currentMonth="april" onEventClick={() => {}} />);
    expect(screen.getByText('Cup')).toBeDefined();
  });
});
