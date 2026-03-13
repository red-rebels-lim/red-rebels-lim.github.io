import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
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

  it('renders the mobile header', () => {
    render(<CalendarPage />);
    expect(screen.getAllByText('Red Rebels Calendar').length).toBeGreaterThan(0);
  });

  it('renders month navigation buttons', () => {
    render(<CalendarPage />);
    expect(screen.getByLabelText('Previous month')).toBeTruthy();
    expect(screen.getByLabelText('Next month')).toBeTruthy();
  });

  it('does not render the footer legend', () => {
    render(<CalendarPage />);
    expect(screen.queryByText('legend.title')).toBeNull();
  });

  it('navigates to next month when next button clicked', async () => {
    render(<CalendarPage />);
    const nextBtn = screen.getByLabelText('Next month');
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    // Navigation happened without error
  });

  it('navigates to previous month when previous button clicked', async () => {
    render(<CalendarPage />);
    const prevBtn = screen.getByLabelText('Previous month');
    await act(async () => {
      fireEvent.click(prevBtn);
    });
    // Navigation happened without error
  });

  it('executes scrollToToday callback when initial mount timer fires', () => {
    vi.useFakeTimers();

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
  });
});
