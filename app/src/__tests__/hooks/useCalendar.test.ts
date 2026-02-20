import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '@/hooks/useCalendar';
import { MONTH_ORDER } from '@/data/month-config';

describe('useCalendar', () => {
  it('returns expected properties', () => {
    const { result } = renderHook(() => useCalendar());

    expect(result.current).toHaveProperty('currentMonth');
    expect(result.current).toHaveProperty('monthData');
    expect(result.current).toHaveProperty('calendarData');
    expect(result.current).toHaveProperty('filters');
    expect(result.current).toHaveProperty('navigatePrevious');
    expect(result.current).toHaveProperty('navigateNext');
    expect(result.current).toHaveProperty('jumpToToday');
    expect(result.current).toHaveProperty('applyFilters');
    expect(result.current).toHaveProperty('clearFilters');
  });

  it('currentMonth is a valid month name', () => {
    const { result } = renderHook(() => useCalendar());
    expect(MONTH_ORDER).toContain(result.current.currentMonth);
  });

  it('monthData has days array', () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.monthData).toHaveProperty('days');
    expect(Array.isArray(result.current.monthData.days)).toBe(true);
  });

  it('calendarData has entries for all months', () => {
    const { result } = renderHook(() => useCalendar());
    for (const month of MONTH_ORDER) {
      expect(result.current.calendarData[month]).toBeDefined();
      expect(result.current.calendarData[month].days.length).toBeGreaterThan(0);
    }
  });

  it('default filters are all-inclusive', () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.filters).toEqual({
      sport: 'all',
      location: 'all',
      status: 'all',
      search: '',
    });
  });

  it('navigateNext advances to next month', () => {
    const { result } = renderHook(() => useCalendar());
    const startMonth = result.current.currentMonth;
    const startIdx = MONTH_ORDER.indexOf(startMonth);

    // Only test if we're not already at the last month
    if (startIdx < MONTH_ORDER.length - 1) {
      act(() => {
        result.current.navigateNext();
      });

      expect(result.current.currentMonth).toBe(MONTH_ORDER[startIdx + 1]);
    }
  });

  it('navigatePrevious goes to previous month', () => {
    const { result } = renderHook(() => useCalendar());
    const startMonth = result.current.currentMonth;
    const startIdx = MONTH_ORDER.indexOf(startMonth);

    // Only test if we're not already at the first month
    if (startIdx > 0) {
      act(() => {
        result.current.navigatePrevious();
      });

      expect(result.current.currentMonth).toBe(MONTH_ORDER[startIdx - 1]);
    }
  });

  it('navigatePrevious does not go before september', () => {
    const { result } = renderHook(() => useCalendar());

    // Navigate backwards one step at a time
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.navigatePrevious();
      });
    }

    expect(result.current.currentMonth).toBe('september');
  });

  it('navigateNext does not go past august', () => {
    const { result } = renderHook(() => useCalendar());

    // Navigate forward one step at a time
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.navigateNext();
      });
    }

    expect(result.current.currentMonth).toBe('august');
  });

  it('applyFilters updates filter state', () => {
    const { result } = renderHook(() => useCalendar());

    act(() => {
      result.current.applyFilters({
        sport: 'football-men',
        location: 'home',
        status: 'played',
        search: 'test',
      });
    });

    expect(result.current.filters).toEqual({
      sport: 'football-men',
      location: 'home',
      status: 'played',
      search: 'test',
    });
  });

  it('clearFilters resets to defaults', () => {
    const { result } = renderHook(() => useCalendar());

    act(() => {
      result.current.applyFilters({
        sport: 'football-men',
        location: 'home',
        status: 'played',
        search: 'test',
      });
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({
      sport: 'all',
      location: 'all',
      status: 'all',
      search: '',
    });
  });

  it('sport filter reduces events', () => {
    const { result } = renderHook(() => useCalendar());

    // Get total event count for a month with mixed sports
    const allEvents = result.current.calendarData.october.days
      .filter((d: { events?: unknown[] }) => d.events)
      .flatMap((d: { events?: unknown[] }) => d.events || []);

    act(() => {
      result.current.applyFilters({
        sport: 'football-men',
        location: 'all',
        status: 'all',
        search: '',
      });
    });

    const filteredEvents = result.current.calendarData.october.days
      .filter((d: { events?: unknown[] }) => d.events)
      .flatMap((d: { events?: unknown[] }) => d.events || []);

    expect(filteredEvents.length).toBeLessThanOrEqual(allEvents.length);
  });

  it('calendar days array has correct total cells (multiple of 7)', () => {
    const { result } = renderHook(() => useCalendar());

    for (const month of MONTH_ORDER) {
      const days = result.current.calendarData[month].days;
      expect(days.length % 7).toBe(0);
    }
  });
});
