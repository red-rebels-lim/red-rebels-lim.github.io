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

import { EventCard } from '@/components/calendar/EventCard';
import type { CalendarEvent } from '@/types/events';

const baseEvent: CalendarEvent = {
  day: 15,
  title: 'Νέα Σαλαμίνα vs APOEL',
  subtitle: '⚽ - 17:00',
  opponent: 'APOEL',
  location: 'home',
  sport: 'football-men',
  isMeeting: false,
};

describe('EventCard', () => {
  it('renders opponent name', () => {
    render(<EventCard event={baseEvent} dayNumber={15} monthName="february" onClick={vi.fn()} />);
    screen.getByText('APOEL');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<EventCard event={baseEvent} dayNumber={15} monthName="february" onClick={onClick} />);
    fireEvent.click(screen.getByText('APOEL'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows score for played matches', () => {
    const playedEvent: CalendarEvent = {
      ...baseEvent,
      status: 'played',
      score: '2-1',
    };
    render(<EventCard event={playedEvent} dayNumber={15} monthName="february" onClick={vi.fn()} />);
    screen.getByText('2-1');
  });

  it('shows penalties indicator', () => {
    const penEvent: CalendarEvent = {
      ...baseEvent,
      status: 'played',
      score: '1-1',
      penalties: '4-3',
    };
    render(<EventCard event={penEvent} dayNumber={15} monthName="february" onClick={vi.fn()} />);
    screen.getByText(/calendar\.penAbbrev/);
  });

  it('shows cup icon for cup matches', () => {
    const cupEvent: CalendarEvent = {
      ...baseEvent,
      competition: 'cup',
    };
    const { container } = render(<EventCard event={cupEvent} dayNumber={15} monthName="february" onClick={vi.fn()} />);
    expect(container.textContent).toContain('🏆');
  });

  it('renders meeting events with calendar icon', () => {
    const meetingEvent: CalendarEvent = {
      day: 10,
      title: 'Team Meeting',
      subtitle: 'Συνάντηση - 19:00',
      opponent: '',
      location: 'home',
      sport: 'meeting',
      isMeeting: true,
    };
    const { container } = render(<EventCard event={meetingEvent} dayNumber={10} monthName="february" onClick={vi.fn()} />);
    expect(container.textContent).toContain('Team Meeting');
  });

  it('shows opponent logo when available', () => {
    const eventWithLogo: CalendarEvent = {
      ...baseEvent,
      logo: 'images/logos/apoel.webp',
    };
    render(<EventCard event={eventWithLogo} dayNumber={15} monthName="february" onClick={vi.fn()} />);
    const img = screen.getByAltText('APOEL');
    expect(img).toBeDefined();
  });
});
