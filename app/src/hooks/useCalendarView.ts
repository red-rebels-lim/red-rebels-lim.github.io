import { useState, useCallback } from 'react';

export type CalendarView = 'grid' | 'list' | 'cards';

const VIEWS: readonly CalendarView[] = ['grid', 'list', 'cards'] as const;
const STORAGE_KEY = 'calendar_view';

function getInitialView(): CalendarView {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (VIEWS as readonly string[]).includes(saved)) return saved as CalendarView;
  return 'grid';
}

export function useCalendarView() {
  const [view, setViewState] = useState<CalendarView>(getInitialView);

  const setView = useCallback((next: CalendarView) => {
    setViewState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { view, setView } as const;
}
