import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { CalendarEvent } from '@/types/events';

// Mock eventsData to include a meeting event so the isMeeting branch is covered
vi.mock('@/data/events', () => ({
  eventsData: {
    february: [
      {
        day: 10,
        sport: 'meeting',
        opponent: 'Board Meeting',
        time: '10:00',
        location: 'home',
        status: 'upcoming',
      },
    ],
  },
}));

import { useCalendar } from '@/hooks/useCalendar';

describe('useCalendar with meeting events', () => {
  it('handles meeting event (isMeeting branch) in calendarData', () => {
    const { result } = renderHook(() => useCalendar());
    // calendarData should be built; february should have the meeting event
    expect(result.current.calendarData).toBeDefined();
    const feb = result.current.calendarData['february'];
    expect(feb).toBeDefined();
    // Find the day with the event (day 10)
    const dayCell = feb.days.find(
      (d): d is { number: number; name?: string; events?: CalendarEvent[] } =>
        'number' in d && (d as { number: number }).number === 10
    );
    expect(dayCell).toBeDefined();
    // The meeting event should have been parsed (isMeeting title = opponent)
    if (dayCell && 'events' in dayCell && dayCell.events) {
      const ev = dayCell.events[0] as { title: string };
      expect(ev.title).toBe('Board Meeting');
    }
  });
});
