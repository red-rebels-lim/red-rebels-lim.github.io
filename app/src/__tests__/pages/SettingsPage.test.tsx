import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: unknown) => {
      if (typeof opts === 'string') return opts;
      return key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, ...props }: Record<string, unknown>) => {
    const className = typeof props.className === 'function'
      ? (props.className as (args: { isActive: boolean }) => string)({ isActive: false })
      : props.className;
    return <a href={to as string} className={className as string}>{children as React.ReactNode}</a>;
  },
  useLocation: () => ({ pathname: '/settings' }),
  useNavigate: () => mockNavigate,
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

vi.mock('@/lib/push', () => ({
  isPushSupported: vi.fn().mockReturnValue(true),
  getSubscriptionStatus: vi.fn().mockReturnValue('unsubscribed'),
  subscribeToPush: vi.fn().mockResolvedValue('test-id'),
  unsubscribeFromPush: vi.fn().mockResolvedValue(undefined),
  getStoredSubscriptionId: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/preferences', () => ({
  getPreferences: vi.fn().mockResolvedValue(null),
  updatePreferences: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({ canInstall: false, promptInstall: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

import { isPushSupported, getSubscriptionStatus, subscribeToPush } from '@/lib/push';
import { trackEvent } from '@/lib/analytics';
import { exportToCalendar } from '@/lib/ics-export';
import SettingsPage from '@/pages/SettingsPage';

describe('TASK-11: SettingsPage Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isPushSupported).mockReturnValue(true);
    vi.mocked(getSubscriptionStatus).mockReturnValue('unsubscribed');
    vi.mocked(subscribeToPush).mockResolvedValue('test-id');
  });

  describe('Header', () => {
    it('renders back button that navigates to home', () => {
      render(<SettingsPage />);
      const backBtn = screen.getByLabelText(/go back|back/i);
      expect(backBtn).toBeDefined();
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('renders centered title', () => {
      render(<SettingsPage />);
      screen.getByText(/Red Rebels/);
    });

    it('renders theme toggle in header', () => {
      render(<SettingsPage />);
      const themeBtn = screen.getByLabelText(/switch to.*mode|toggle.*mode|theme/i);
      expect(themeBtn).toBeDefined();
    });
  });

  describe('Notifications Section', () => {
    it('renders notifications section header', () => {
      render(<SettingsPage />);
      screen.getByText('settings.notifications');
    });

    it('renders Match Reminders toggle', () => {
      render(<SettingsPage />);
      screen.getByText('settings.matchReminders');
    });

    it('calls subscribeToPush when Match Reminders toggled on', async () => {
      render(<SettingsPage />);
      // The first switch on the page is the Match Reminders toggle
      const switches = screen.getAllByRole('switch');
      await act(async () => { fireEvent.click(switches[0]); });
      expect(subscribeToPush).toHaveBeenCalled();
    });

    it('shows not supported message when push not supported', () => {
      vi.mocked(isPushSupported).mockReturnValue(false);
      render(<SettingsPage />);
      screen.getByText('settings.notSupported');
    });

    it('shows denied state when permission denied', () => {
      vi.mocked(getSubscriptionStatus).mockReturnValue('denied');
      render(<SettingsPage />);
      screen.getByText('settings.permissionDenied');
    });
  });

  describe('Display Section', () => {
    it('renders display section header', () => {
      render(<SettingsPage />);
      screen.getByText('settings.display');
    });

    it('renders Language row with current language value', () => {
      render(<SettingsPage />);
      screen.getByText('settings.language');
      screen.getByText('settings.languageEnglish');
    });

    it('renders Dark Theme toggle', () => {
      render(<SettingsPage />);
      screen.getByText('settings.darkTheme');
    });
  });

  describe('Sports Filter Section', () => {
    it('renders sports filter section header', () => {
      render(<SettingsPage />);
      screen.getByText('settings.sportsFilter');
    });

    it('renders Football toggle', () => {
      render(<SettingsPage />);
      screen.getByText('settings.football');
    });

    it('renders Volleyball toggle', () => {
      render(<SettingsPage />);
      screen.getByText('settings.volleyball');
    });
  });

  describe('Tools Section', () => {
    it('renders tools section header', () => {
      render(<SettingsPage />);
      screen.getByText('settings.tools');
    });

    it('renders Export Calendar button', () => {
      render(<SettingsPage />);
      screen.getByText('settings.exportCalendar');
    });

    it('triggers export when Export Calendar clicked', () => {
      render(<SettingsPage />);
      fireEvent.click(screen.getByText('settings.exportCalendar'));
      expect(exportToCalendar).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('export_calendar');
    });

    it('renders Print Calendar button', () => {
      render(<SettingsPage />);
      screen.getByText('settings.printCalendar');
    });

    it('triggers print when Print Calendar clicked', () => {
      window.print = vi.fn();
      render(<SettingsPage />);
      fireEvent.click(screen.getByText('settings.printCalendar'));
      expect(window.print).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('print_calendar');
    });
  });

  describe('About Section', () => {
    it('renders about section header', () => {
      render(<SettingsPage />);
      screen.getByText('settings.about');
    });

    it('renders App Version row', () => {
      render(<SettingsPage />);
      screen.getByText('settings.appVersion');
    });

    it('renders View on GitHub link', () => {
      render(<SettingsPage />);
      const link = screen.getByText('settings.viewOnGithub');
      expect(link).toBeDefined();
      const anchor = link.closest('a');
      expect(anchor?.getAttribute('href')).toContain('github.com');
      expect(anchor?.getAttribute('target')).toBe('_blank');
    });
  });

  describe('Footer', () => {
    it('renders made with love footer', () => {
      render(<SettingsPage />);
      screen.getByText('settings.madeWith');
    });
  });

  describe('Existing Functionality Preserved', () => {
    it('shows enable button when unsubscribed', () => {
      render(<SettingsPage />);
      // Match Reminders toggle should be in OFF state
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThan(0);
    });

    it('handles subscribe error gracefully', async () => {
      vi.mocked(subscribeToPush).mockRejectedValue(new Error('fail'));
      render(<SettingsPage />);
      // Find the Match Reminders toggle and click
      const switches = screen.getAllByRole('switch');
      const matchRemindersSwitch = switches[0]; // first toggle is Match Reminders
      await act(async () => { fireEvent.click(matchRemindersSwitch); });
      // Should not crash
      screen.getByText('settings.matchReminders');
    });
  });

  describe('Layout', () => {
    it('does not render the old Navbar', () => {
      const { container } = render(<SettingsPage />);
      // Should not contain the old navbar (nav element with fixed positioning)
      const oldNavbar = container.querySelector('nav[class*="fixed"]');
      expect(oldNavbar).toBeNull();
    });

    it('renders all five sections in order', () => {
      const { container } = render(<SettingsPage />);
      const text = container.textContent || '';
      const notifIdx = text.indexOf('settings.notifications');
      const displayIdx = text.indexOf('settings.display');
      const sportsIdx = text.indexOf('settings.sportsFilter');
      const toolsIdx = text.indexOf('settings.tools');
      const aboutIdx = text.indexOf('settings.about');
      expect(notifIdx).toBeLessThan(displayIdx);
      expect(displayIdx).toBeLessThan(sportsIdx);
      expect(sportsIdx).toBeLessThan(toolsIdx);
      expect(toolsIdx).toBeLessThan(aboutIdx);
    });
  });
});
