import { useState, useEffect, useCallback } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MonthNavigation } from '@/components/calendar/MonthNavigation';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';

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

  const [filtersOpen, setFiltersOpen] = useState(false);
  const swipe = useSwipeNavigation(navigateNext, navigatePrevious);

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

  // Scroll to today on initial mount
  useEffect(() => {
    const timer = setTimeout(scrollToToday, INITIAL_SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJumpToToday = useCallback(() => {
    const monthChanged = jumpToToday();
    // If month changed, wait for re-render before scrolling
    setTimeout(scrollToToday, monthChanged ? MONTH_CHANGE_SCROLL_DELAY_MS : SAME_MONTH_SCROLL_DELAY_MS);
  }, [jumpToToday, scrollToToday]);

  return (
    <div className="max-w-[1800px] w-[95%] mx-auto" {...swipe}>
      <Navbar
        onToggleFilters={() => setFiltersOpen((o) => !o)}
        currentMonth={currentMonth}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onToday={handleJumpToToday}
      />

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

      <CalendarGrid monthData={monthData} currentMonth={currentMonth} />

      <Footer />
    </div>
  );
}
