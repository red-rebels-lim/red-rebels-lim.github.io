import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, className, onClick, ...rest }: Record<string, unknown>) => {
    const cls = typeof className === 'function' ? className({ isActive: to === '/' }) : className;
    return <a href={to as string} className={cls as string} onClick={onClick as () => void} {...rest}>{children as React.ReactNode}</a>;
  },
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

vi.mock('@/lib/ics-export', () => ({
  exportToCalendar: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { Navbar } from '@/components/layout/Navbar';

describe('Navbar', () => {
  it('renders brand logo', () => {
    render(<Navbar />);
    const logo = screen.getByAltText('Red Rebels');
    expect(logo).toBeDefined();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getAllByText('nav.calendar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nav.stats').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nav.settings').length).toBeGreaterThan(0);
  });

  it('renders language toggle button', () => {
    render(<Navbar />);
    expect(screen.getByText('EN')).toBeDefined();
  });

  it('calls onToggleFilters when filter button is clicked', () => {
    const onToggle = vi.fn();
    render(<Navbar onToggleFilters={onToggle} />);
    const filterButtons = screen.getAllByText('filters.title');
    fireEvent.click(filterButtons[0]);
    expect(onToggle).toHaveBeenCalled();
  });
});
