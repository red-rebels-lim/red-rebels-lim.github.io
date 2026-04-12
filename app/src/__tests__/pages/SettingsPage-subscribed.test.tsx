import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: unknown) => {
      if (typeof opts === 'string') return opts;
      return key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/ics-export', () => ({ exportToCalendar: vi.fn() }));

vi.mock('@/lib/push', () => ({
  isPushSupported: vi.fn().mockReturnValue(true),
  getSubscriptionStatus: vi.fn().mockReturnValue('subscribed'),
  subscribeToPush: vi.fn().mockResolvedValue('test-id'),
  unsubscribeFromPush: vi.fn().mockResolvedValue(undefined),
  getStoredSubscriptionId: vi.fn().mockReturnValue('test-sub-id'),
}));

vi.mock('@/lib/preferences', () => ({
  getPreferences: vi.fn().mockResolvedValue({
    notifyNewEvents: true,
    notifyTimeChanges: true,
    notifyScoreUpdates: false,
    reminderHours: [24, 2],
    enabledSports: ['football-men', 'volleyball-men'],
    disabled: false,
  }),
  updatePreferences: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({ canInstall: false, promptInstall: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

import { unsubscribeFromPush } from '@/lib/push';
import SettingsPage from '@/pages/SettingsPage';

describe('SettingsPage (subscribed)', () => {
  beforeEach(() => {
    vi.mocked(unsubscribeFromPush).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.removeItem('notification_channels');
  });

  it('renders Web Push toggle in ON state when subscribed', async () => {
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    // First toggle is Match Reminders — should be checked
    expect(switches[0].getAttribute('aria-checked')).toBe('true');
  });

  it('calls unsubscribeFromPush when Web Push toggled off', async () => {
    // Enable another channel so the guard allows disabling Web Push
    localStorage.setItem('notification_channels', JSON.stringify({ telegram: true, calendar: false }));
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    await act(async () => { fireEvent.click(switches[0]); });
    expect(unsubscribeFromPush).toHaveBeenCalled();
  });

  it('handles unsubscribe error gracefully', async () => {
    // Enable another channel so the guard allows disabling Web Push
    localStorage.setItem('notification_channels', JSON.stringify({ telegram: true, calendar: false }));
    vi.mocked(unsubscribeFromPush).mockRejectedValue(new Error('Unsubscribe failed'));
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('switch')[0]);
    });
    // Should show push error inline
    screen.getByText('settings.pushError');
  });

  it('renders all sections even when subscribed', async () => {
    await act(async () => { render(<SettingsPage />); });
    screen.getByText('settings.notifications');
    screen.getByText('settings.display');
    screen.getByText('settings.sportsFilter');
    screen.getByText('settings.tools');
    screen.getByText('settings.about');
  });

  it('renders toggle switches for all settings', async () => {
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    // Web Push + Telegram + Calendar + Dark Theme + Football + Volleyball = 6 minimum
    expect(switches.length).toBeGreaterThanOrEqual(6);
  });

  it('toggles dark theme switch', async () => {
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    // Fourth toggle is Dark Theme (after Web Push, Telegram, Calendar)
    await act(async () => { fireEvent.click(switches[3]); });
    // Should not crash
    expect(switches[1]).toBeDefined();
  });
});
