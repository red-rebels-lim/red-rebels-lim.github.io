import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { EventPopover } from '@/components/calendar/EventPopover';
import type { CalendarEvent } from '@/types/events';

const baseEvent: CalendarEvent = {
  day: 15,
  title: 'Νέα Σαλαμίνα vs APOEL',
  subtitle: '⚽ - 17:00',
  location: 'home',
  sport: 'football-men',
  isMeeting: false,
};

describe('EventPopover', () => {
  it('renders nothing when event is null', () => {
    const { container } = render(<EventPopover event={null} open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders event title when open', () => {
    render(<EventPopover event={baseEvent} open={true} onClose={vi.fn()} />);
    // Title appears in sr-only DialogTitle and in the header
    const elements = screen.getAllByText('Νέα Σαλαμίνα vs APOEL');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows time from subtitle', () => {
    render(<EventPopover event={baseEvent} open={true} onClose={vi.fn()} />);
    // The popover extracts time from subtitle
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('17:00');
  });

  it('shows home indicator for home matches', () => {
    render(<EventPopover event={baseEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('popover.homeGround');
  });

  it('shows score for played matches', () => {
    const playedEvent: CalendarEvent = {
      ...baseEvent,
      status: 'played',
      score: '3-0',
    };
    render(<EventPopover event={playedEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/3-0/)).toBeDefined();
  });

  it('renders meeting events differently', () => {
    const meetingEvent: CalendarEvent = {
      day: 10,
      title: 'Team Meeting',
      subtitle: 'Συνάντηση - 19:00',
      location: 'home',
      sport: 'meeting',
      isMeeting: true,
    };
    render(<EventPopover event={meetingEvent} open={true} onClose={vi.fn()} />);
    // Title appears in sr-only DialogTitle and in the meeting view
    const elements = screen.getAllByText('Team Meeting');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows penalties when available', () => {
    const penEvent: CalendarEvent = {
      ...baseEvent,
      status: 'played',
      score: '1-1',
      penalties: '5-4',
    };
    render(<EventPopover event={penEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/5-4/)).toBeDefined();
  });

  it('shows cup badge for cup matches', () => {
    const cupEvent: CalendarEvent = {
      ...baseEvent,
      competition: 'cup',
    };
    render(<EventPopover event={cupEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Κύπελλο');
  });
});
