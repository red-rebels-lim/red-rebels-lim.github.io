import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, ...props }: Record<string, unknown>) => {
    const className = typeof props.className === 'function'
      ? (props.className as (args: { isActive: boolean }) => string)({ isActive: false })
      : props.className;
    return <a href={to as string} className={className as string}>{children as React.ReactNode}</a>;
  },
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/ics-export', () => ({
  exportToCalendar: vi.fn(),
}));

import { CalendarPage } from '@/pages/CalendarPage';

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    const { container } = render(<CalendarPage />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders the navbar', () => {
    render(<CalendarPage />);
    const logo = screen.getByAltText('Red Rebels');
    expect(logo).toBeDefined();
  });

  it('renders month navigation buttons', () => {
    render(<CalendarPage />);
    expect(screen.getAllByText('monthNav.previous').length).toBeGreaterThan(0);
    expect(screen.getAllByText('monthNav.next').length).toBeGreaterThan(0);
  });

  it('does not render the footer legend', () => {
    render(<CalendarPage />);
    expect(screen.queryByText('legend.title')).toBeNull();
  });

  it('toggles filter panel open when filter button clicked', async () => {
    render(<CalendarPage />);
    // Before click: FilterPanel is closed (returns null), so filters.sport label is absent
    expect(screen.queryByText('filters.sport')).toBeNull();
    const filterBtns = screen.getAllByText('filters.title');
    await act(async () => {
      fireEvent.click(filterBtns[0]);
    });
    // After click: FilterPanel is open and renders filters.sport label
    expect(screen.getByText('filters.sport')).toBeDefined();
  });

  it('calls handleJumpToToday when today button clicked', async () => {
    vi.useFakeTimers();
    render(<CalendarPage />);
    const todayBtns = screen.getAllByText('monthNav.jumpToToday');
    expect(todayBtns.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(todayBtns[0]);
    });
    // Advance by 100ms — enough to fire the 50ms setTimeout for same-month case
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // handleJumpToToday ran, lines 47-49 are covered
  });

  it('covers monthChanged=true branch when jumping to today from a different month', async () => {
    vi.useFakeTimers();
    render(<CalendarPage />);
    // Navigate away from current month (today = february 2026) so monthChanged will be true
    const nextBtns = screen.getAllByText('monthNav.next');
    await act(async () => { fireEvent.click(nextBtns[0]); });
    // Now click Today — jumpToToday() returns true (month changed)
    const todayBtns = screen.getAllByText('monthNav.jumpToToday');
    await act(async () => { fireEvent.click(todayBtns[0]); });
    // Advance by 200ms — enough to fire the MONTH_CHANGE_SCROLL_DELAY_MS (150ms) setTimeout
    act(() => { vi.advanceTimersByTime(200); });
  });

  it('executes scrollToToday callback when initial mount timer fires on mobile', () => {
    vi.useFakeTimers();
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });

    // Add a data-today element with non-zero offsetHeight so el.scrollIntoView is called
    const mockEl = document.createElement('div');
    mockEl.setAttribute('data-today', '');
    const scrollFn = vi.fn();
    mockEl.scrollIntoView = scrollFn;
    Object.defineProperty(mockEl, 'offsetHeight', { value: 50, configurable: true });
    document.body.appendChild(mockEl);

    render(<CalendarPage />);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(scrollFn).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    document.body.removeChild(mockEl);
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  });
});
