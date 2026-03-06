import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  useLocation: () => ({ pathname: '/settings' }),
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

import { isPushSupported, getSubscriptionStatus, subscribeToPush } from '@/lib/push';
import SettingsPage from '@/pages/SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(isPushSupported).mockReturnValue(true);
    vi.mocked(getSubscriptionStatus).mockReturnValue('unsubscribed');
    vi.mocked(subscribeToPush).mockResolvedValue('test-id');
  });

  it('renders page title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('settings.title')).toBeDefined();
  });

  it('renders notifications section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('settings.notifications')).toBeDefined();
  });

  it('shows enable button when unsubscribed', () => {
    render(<SettingsPage />);
    expect(screen.getByText('settings.enable')).toBeDefined();
  });

  it('shows unsubscribed status badge', () => {
    render(<SettingsPage />);
    expect(screen.getByText('settings.disabled')).toBeDefined();
  });

  it('shows not supported message when push not supported', () => {
    vi.mocked(isPushSupported).mockReturnValue(false);
    render(<SettingsPage />);
    expect(screen.getByText('settings.notSupported')).toBeDefined();
  });

  it('shows denied message when push permission is denied', () => {
    vi.mocked(getSubscriptionStatus).mockReturnValue('denied');
    render(<SettingsPage />);
    expect(screen.getByText('settings.permissionDenied')).toBeDefined();
    expect(screen.getByText('settings.deniedHelp')).toBeDefined();
  });

  it('shows processing state and calls subscribeToPush when enable clicked', async () => {
    render(<SettingsPage />);
    const enableBtn = screen.getByText('settings.enable');
    await act(async () => {
      fireEvent.click(enableBtn);
    });
    expect(subscribeToPush).toHaveBeenCalled();
  });

  it('updates status to subscribed after successful subscribe', async () => {
    vi.mocked(subscribeToPush).mockResolvedValue('new-sub-id');
    render(<SettingsPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('settings.enable'));
    });
    expect(screen.getByText('settings.enabled')).toBeDefined();
  });

  it('sets denied status when subscribe returns null and Notification permission is denied', async () => {
    vi.mocked(subscribeToPush).mockResolvedValue(null);
    // Replace the Notification global so permission returns 'denied'
    vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn() });
    render(<SettingsPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('settings.enable'));
    });
    // status should be 'denied' now — permissionDenied message shown
    expect(screen.getByText('settings.permissionDenied')).toBeDefined();
    vi.unstubAllGlobals();
  });

  it('handles subscribe error gracefully and restores button', async () => {
    vi.mocked(subscribeToPush).mockRejectedValue(new Error('Subscribe failed'));
    render(<SettingsPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('settings.enable'));
    });
    // Should not crash - loading state restored
    expect(screen.getByText('settings.enable')).toBeDefined();
  });

});
