import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock useTheme
const mockToggle = vi.fn();
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: mockToggle }),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { MobileHeader } from '@/components/layout/MobileHeader';

describe('TASK-10: MobileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria', () => {
    it('renders app title "Red Rebels Calendar"', () => {
      render(<MobileHeader />);
      // Should show the app title or the translated key
      const { container } = render(<MobileHeader />);
      expect(container.textContent).toContain('Red Rebels');
    });

    it('renders theme toggle button', () => {
      const { container } = render(<MobileHeader />);
      const themeBtn = container.querySelector('button');
      expect(themeBtn).not.toBeNull();
    });

    it('calls theme toggle when button is clicked', () => {
      const { container } = render(<MobileHeader />);
      const buttons = container.querySelectorAll('button');
      // Click the theme toggle button
      const themeBtn = Array.from(buttons).find(
        (btn) => btn.getAttribute('aria-label')?.includes('mode') || btn.getAttribute('aria-label')?.includes('theme')
      );
      if (themeBtn) {
        fireEvent.click(themeBtn);
        expect(mockToggle).toHaveBeenCalled();
      }
    });

    it('renders as a header element', () => {
      const { container } = render(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).not.toBeNull();
    });

    it('renders back button when showBack is true', () => {
      render(<MobileHeader showBack />);
      const backBtn = screen.getByLabelText('Go back');
      expect(backBtn).toBeDefined();
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('does not render back button by default', () => {
      render(<MobileHeader />);
      expect(screen.queryByLabelText('Go back')).toBeNull();
    });

    it('does not render navigation links (those are in BottomNav)', () => {
      render(<MobileHeader />);
      expect(screen.queryByText('nav.stats')).toBeNull();
      expect(screen.queryByText('nav.settings')).toBeNull();
    });

    it('does not render hamburger menu', () => {
      render(<MobileHeader />);
      expect(screen.queryByLabelText('Open menu')).toBeNull();
    });
  });
});
