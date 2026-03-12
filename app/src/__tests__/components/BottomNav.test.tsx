import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
const mockUseLocation = vi.fn().mockReturnValue({ pathname: '/' });
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, className, ...rest }: { children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode); to: string; className?: string | ((props: { isActive: boolean }) => string); [key: string]: unknown }) => {
    const pathname = mockUseLocation().pathname;
    const isActive = to === pathname || (to === '/' && pathname === '');
    const cls = typeof className === 'function' ? className({ isActive }) : className;
    const rendered = typeof children === 'function' ? children({ isActive }) : children;
    return <a href={to} className={cls} data-testid={`nav-${to}`} {...rest}>{rendered}</a>;
  },
  useLocation: () => mockUseLocation(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { BottomNav } from '@/components/layout/BottomNav';

describe('TASK-10: BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/' });
  });

  describe('Acceptance Criteria', () => {
    it('renders three navigation tabs: Calendar, Stats, Settings', () => {
      render(<BottomNav />);
      screen.getByText('nav.calendar');
      screen.getByText('nav.stats');
      screen.getByText('nav.settings');
    });

    it('renders as a nav element with proper aria label', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');
      expect(nav).not.toBeNull();
      expect(nav?.getAttribute('aria-label')).toBeTruthy();
    });

    it('links to correct routes', () => {
      render(<BottomNav />);
      screen.getByTestId('nav-/');
      screen.getByTestId('nav-/stats');
      screen.getByTestId('nav-/settings');
    });

    it('highlights active tab (Calendar) with primary color when on /', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' });
      render(<BottomNav />);
      const calendarLink = screen.getByTestId('nav-/');
      expect(calendarLink.className).toContain('text-');
      // Active tab should have a distinct style
      const statsLink = screen.getByTestId('nav-/stats');
      expect(calendarLink.className).not.toBe(statsLink.className);
    });

    it('highlights Stats tab when on /stats', () => {
      mockUseLocation.mockReturnValue({ pathname: '/stats' });
      render(<BottomNav />);
      const statsLink = screen.getByTestId('nav-/stats');
      const calendarLink = screen.getByTestId('nav-/');
      expect(statsLink.className).not.toBe(calendarLink.className);
    });

    it('highlights Settings tab when on /settings', () => {
      mockUseLocation.mockReturnValue({ pathname: '/settings' });
      render(<BottomNav />);
      const settingsLink = screen.getByTestId('nav-/settings');
      const calendarLink = screen.getByTestId('nav-/');
      expect(settingsLink.className).not.toBe(calendarLink.className);
    });

    it('has fixed positioning at bottom', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toContain('fixed');
      expect(nav?.className).toContain('bottom-0');
    });

    it('is hidden on desktop (md breakpoint)', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toContain('md:hidden');
    });

    it('renders icons for each tab', () => {
      const { container } = render(<BottomNav />);
      // Each tab should have an SVG icon
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(3);
    });

    it('has tab labels with small text', () => {
      render(<BottomNav />);
      const calendarText = screen.getByText('nav.calendar');
      // The label span should have small text styling
      expect(calendarText.tagName.toLowerCase()).toBe('span');
      expect(calendarText.className).toContain('text-[10px]');
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly with unknown pathname', () => {
      mockUseLocation.mockReturnValue({ pathname: '/unknown' });
      const { container } = render(<BottomNav />);
      expect(container.innerHTML).not.toBe('');
    });
  });
});
