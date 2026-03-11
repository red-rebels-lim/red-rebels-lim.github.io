import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MonthNavigation } from '@/components/calendar/MonthNavigation';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { MobileCalendarGrid } from '@/components/calendar/MobileCalendarGrid';
import { UpcomingEventsList } from '@/components/calendar/UpcomingEventsList';
import { EventPopover } from '@/components/calendar/EventPopover';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/lib/analytics';
import { monthMap } from '@/data/month-config';
import type { CalendarEvent } from '@/types/events';

function findDefaultDay(currentMonth: string): number | null {
  const now = new Date();
  const info = monthMap[currentMonth as keyof typeof monthMap];
  const isCurrentMonth = info.monthIndex === now.getMonth() && info.year === now.getFullYear();
  // Default to today when viewing the current month
  return isCurrentMonth ? now.getDate() : null;
}

const INITIAL_SCROLL_DELAY_MS = 300;
const MONTH_CHANGE_SCROLL_DELAY_MS = 350;
const SAME_MONTH_SCROLL_DELAY_MS = 50;

export function CalendarPage() {
  const {
    currentMonth,
    monthData,
    filters,
    navigatePrevious,
    navigateNext,
    jumpToToday,
    applyFilters,
    clearFilters,
  } = useCalendar();

  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [userSelectedDay, setUserSelectedDay] = useState<number | null>(null);
  const swipe = useSwipeNavigation(navigateNext, navigatePrevious);

  // Default selected day is today when viewing the current month
  const defaultDay = useMemo(() => findDefaultDay(currentMonth), [currentMonth]);

  // Reset user selection when month changes
  const [prevMonth, setPrevMonth] = useState(currentMonth);
  if (prevMonth !== currentMonth) {
    setPrevMonth(currentMonth);
    setUserSelectedDay(null);
  }

  const selectedDay = userSelectedDay ?? defaultDay;

  const scrollToToday = useCallback(() => {
    // Multiple elements may carry data-today (desktop grid + mobile list).
    // Pick the first one that is actually visible (has layout dimensions).
    const candidates = [
      ...document.querySelectorAll('[data-today]'),
      ...document.querySelectorAll('[data-nearest-event]'),
    ];
    const el = candidates.find((e) => (e as HTMLElement).offsetHeight > 0);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Scroll to today on initial mount (mobile only — desktop starts from the top)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    const timer = setTimeout(scrollToToday, INITIAL_SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJumpToToday = useCallback(() => {
    const monthChanged = jumpToToday();
    // If month changed, wait for re-render before scrolling
    setTimeout(scrollToToday, monthChanged ? MONTH_CHANGE_SCROLL_DELAY_MS : SAME_MONTH_SCROLL_DELAY_MS);
  }, [jumpToToday, scrollToToday]);

  useKeyboardShortcuts({
    onPrevious: navigatePrevious,
    onNext: navigateNext,
    onToday: handleJumpToToday,
    onToggleFilters: () => setFiltersOpen((o) => !o),
  });

  const handlePrevious = () => {
    trackEvent('navigate_month', { direction: 'previous' });
    navigatePrevious();
  };

  const handleNext = () => {
    trackEvent('navigate_month', { direction: 'next' });
    navigateNext();
  };

  return (
    <div className="max-w-[1800px] w-full md:w-[95%] mx-auto pb-20 md:pb-0" {...swipe}>
      <h1 className="sr-only">Red Rebels Calendar</h1>

      {/* Desktop: full Navbar */}
      <div className="hidden md:block">
        <Navbar
          onToggleFilters={() => setFiltersOpen((o) => !o)}
          currentMonth={currentMonth}
          onPrevious={navigatePrevious}
          onNext={navigateNext}
          onToday={handleJumpToToday}
        />
      </div>

      {/* Mobile: simplified header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* Desktop: month navigation */}
      <MonthNavigation
        currentMonth={currentMonth}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onToday={handleJumpToToday}
      />

      <FilterPanel
        open={filtersOpen}
        filters={filters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* Desktop: existing CalendarGrid */}
      <div className="hidden md:block">
        <CalendarGrid monthData={monthData} currentMonth={currentMonth} />
      </div>

      {/* Mobile: new calendar grid + upcoming events */}
      <div className="md:hidden">
        <div className="bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none rounded-2xl px-2 mt-2">
          {/* Mobile month navigation */}
          <div className="flex items-center justify-between px-2 py-3">
            <button
              onClick={handlePrevious}
              aria-label={t('monthNav.previous', 'Previous month')}
              className="p-2 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1e293b]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">
              {t(`months.${currentMonth}`)} {monthMap[currentMonth].year}
            </h2>
            <button
              onClick={handleNext}
              aria-label={t('monthNav.next', 'Next month')}
              className="p-2 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1e293b]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <MobileCalendarGrid
            monthData={monthData}
            currentMonth={currentMonth}
            selectedDay={selectedDay}
            onDayClick={(day) => {
              setUserSelectedDay(day);
            }}
          />
        </div>

        <UpcomingEventsList
          monthData={monthData}
          currentMonth={currentMonth}
          selectedDay={selectedDay}
          onEventClick={setSelectedEvent}
        />
      </div>

      {/* Mobile event popover (triggered from grid/cards) */}
      <EventPopover
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <OnboardingTour />
    </div>
  );
}
