import { useState, useMemo, useCallback } from 'react';
import type { MonthName, CalendarData, CalendarEvent, FilterState } from '@/types/events';
import { eventsData } from '@/data/events';
import { sportConfig } from '@/data/sport-config';
import { monthMap, MONTH_ORDER } from '@/data/month-config';

const TEAM_NAME = 'Νέα Σαλαμίνα';

function getDayName(year: number, monthIndex: number, day: number): string {
  const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
  return dayNames[new Date(year, monthIndex, day).getDay()];
}

function parseEvent(eventData: {
  day: number;
  sport: string;
  location: string;
  opponent: string;
  time: string;
  venue?: string;
  logo?: string;
  status?: string;
  score?: string;
  competition?: string;
  penalties?: string;
}): CalendarEvent {
  const info = sportConfig[eventData.sport as keyof typeof sportConfig];
  const isMeeting = eventData.sport === 'meeting';

  let title: string;
  if (isMeeting) {
    title = eventData.opponent;
  } else if (eventData.location === 'home') {
    title = `${TEAM_NAME} vs ${eventData.opponent}`;
  } else {
    title = `${eventData.opponent} vs ${TEAM_NAME}`;
  }

  const subtitle = info?.emoji
    ? `${info.emoji} - ${eventData.time}`
    : `${info?.name ?? ''} - ${eventData.time}`;

  return {
    day: eventData.day,
    title,
    subtitle,
    venue: eventData.venue,
    logo: eventData.logo,
    status: eventData.status as CalendarEvent['status'],
    score: eventData.score,
    location: eventData.location as CalendarEvent['location'],
    sport: eventData.sport as CalendarEvent['sport'],
    isMeeting,
    competition: eventData.competition as CalendarEvent['competition'],
    penalties: eventData.penalties,
  };
}

function buildCalendarData(filters?: FilterState): CalendarData {
  const calendar: CalendarData = {};

  for (const monthName of MONTH_ORDER) {
    let events = eventsData[monthName] || [];

    if (filters) {
      events = events.filter((event) => {
        if (filters.sport !== 'all' && event.sport !== filters.sport) return false;
        if (filters.location !== 'all' && event.location !== filters.location) return false;
        if (filters.status !== 'all') {
          const isPlayed = event.status === 'played';
          if (filters.status === 'played' && !isPlayed) return false;
          if (filters.status === 'upcoming' && isPlayed) return false;
        }
        if (filters.search && !event.opponent.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
    }

    const info = monthMap[monthName];
    const days = [];

    for (let i = 0; i < info.startDay; i++) {
      days.push({ empty: true as const });
    }

    const eventsByDay: Record<number, CalendarEvent[]> = {};
    for (const ev of events) {
      const parsed = parseEvent(ev);
      if (!eventsByDay[parsed.day]) eventsByDay[parsed.day] = [];
      eventsByDay[parsed.day].push(parsed);
    }

    for (let day = 1; day <= info.daysInMonth; day++) {
      const dayData: { number: number; name?: string; events?: CalendarEvent[] } = { number: day };
      if (eventsByDay[day]) {
        dayData.events = eventsByDay[day];
        dayData.name = getDayName(info.year, info.monthIndex, day);
      }
      days.push(dayData);
    }

    // Pad end to complete the grid row
    const totalCells = days.length;
    const cellsNeeded = Math.ceil(totalCells / 7) * 7;
    for (let i = totalCells; i < cellsNeeded; i++) {
      days.push({ empty: true as const });
    }

    calendar[monthName] = { days };
  }

  return calendar;
}

function getCurrentMonthName(): MonthName {
  const now = new Date();
  const monthNames: MonthName[] = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const name = monthNames[now.getMonth()];
  return MONTH_ORDER.includes(name) ? name : 'september';
}

export function useCalendar() {
  const [currentMonth, setCurrentMonth] = useState<MonthName>(getCurrentMonthName);
  const [filters, setFilters] = useState<FilterState>({
    sport: 'all',
    location: 'all',
    status: 'all',
    search: '',
  });

  const calendarData = useMemo(() => buildCalendarData(filters), [filters]);
  const monthData = calendarData[currentMonth];

  const navigatePrevious = useCallback(() => {
    const idx = MONTH_ORDER.indexOf(currentMonth);
    if (idx > 0) setCurrentMonth(MONTH_ORDER[idx - 1]);
  }, [currentMonth]);

  const navigateNext = useCallback(() => {
    const idx = MONTH_ORDER.indexOf(currentMonth);
    if (idx < MONTH_ORDER.length - 1) setCurrentMonth(MONTH_ORDER[idx + 1]);
  }, [currentMonth]);

  const jumpToToday = useCallback(() => {
    setCurrentMonth(getCurrentMonthName());
  }, []);

  const applyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ sport: 'all', location: 'all', status: 'all', search: '' });
  }, []);

  return {
    currentMonth,
    monthData,
    calendarData,
    filters,
    navigatePrevious,
    navigateNext,
    jumpToToday,
    applyFilters,
    clearFilters,
  };
}
