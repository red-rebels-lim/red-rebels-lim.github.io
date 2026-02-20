import { useState, useEffect, useCallback } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MonthNavigation } from '@/components/calendar/MonthNavigation';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';

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
    const el = document.querySelector('[data-today]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Scroll to today on initial mount
  useEffect(() => {
    const timer = setTimeout(scrollToToday, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJumpToToday = useCallback(() => {
    const monthChanged = jumpToToday();
    // If month changed, wait for re-render before scrolling
    setTimeout(scrollToToday, monthChanged ? 350 : 50);
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
