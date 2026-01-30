import { useState } from 'react';
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

  return (
    <div className="max-w-[1800px] w-[95%] mx-auto" {...swipe}>
      <Navbar onToggleFilters={() => setFiltersOpen((o) => !o)} />

      <MonthNavigation
        currentMonth={currentMonth}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onToday={jumpToToday}
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
