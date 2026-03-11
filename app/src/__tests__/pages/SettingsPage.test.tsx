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
      expect(screen.getByText(/Red Rebels/)).toBeDefined();
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
      expect(screen.getByText('settings.notifications')).toBeDefined();
    });

    it('renders Match Reminders toggle', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.matchReminders')).toBeDefined();
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
      expect(screen.getByText('settings.notSupported')).toBeDefined();
    });

    it('shows denied state when permission denied', () => {
      vi.mocked(getSubscriptionStatus).mockReturnValue('denied');
      render(<SettingsPage />);
      expect(screen.getByText('settings.permissionDenied')).toBeDefined();
    });
  });

  describe('Display Section', () => {
    it('renders display section header', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.display')).toBeDefined();
    });

    it('renders Language row with current language value', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.language')).toBeDefined();
      expect(screen.getByText('settings.languageEnglish')).toBeDefined();
    });

    it('renders Dark Theme toggle', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.darkTheme')).toBeDefined();
    });
  });

  describe('Sports Filter Section', () => {
    it('renders sports filter section header', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.sportsFilter')).toBeDefined();
    });

    it('renders Football toggle', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.football')).toBeDefined();
    });

    it('renders Volleyball toggle', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.volleyball')).toBeDefined();
    });
  });

  describe('Tools Section', () => {
    it('renders tools section header', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.tools')).toBeDefined();
    });

    it('renders Export Calendar button', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.exportCalendar')).toBeDefined();
    });

    it('triggers export when Export Calendar clicked', () => {
      render(<SettingsPage />);
      fireEvent.click(screen.getByText('settings.exportCalendar'));
      expect(exportToCalendar).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('export_calendar');
    });

    it('renders Print Calendar button', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.printCalendar')).toBeDefined();
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
      expect(screen.getByText('settings.about')).toBeDefined();
    });

    it('renders App Version row', () => {
      render(<SettingsPage />);
      expect(screen.getByText('settings.appVersion')).toBeDefined();
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
      expect(screen.getByText('settings.madeWith')).toBeDefined();
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
      expect(screen.getByText('settings.matchReminders')).toBeDefined();
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
