import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children as React.ReactNode}</a>,
  useLocation: () => ({ pathname: '/' }),
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

  it('renders the footer legend', () => {
    render(<CalendarPage />);
    expect(screen.getByText('legend.title')).toBeDefined();
  });
});
