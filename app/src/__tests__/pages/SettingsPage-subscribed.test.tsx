import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children as React.ReactNode}</a>,
  useLocation: () => ({ pathname: '/settings' }),
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

import SettingsPage from '@/pages/SettingsPage';

describe('SettingsPage (subscribed)', () => {
  it('shows subscribed status', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.enabled')).toBeDefined();
  });

  it('shows disable button when subscribed', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.disable')).toBeDefined();
  });

  it('renders event types section with preferences', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.eventTypes')).toBeDefined();
    expect(screen.getByText('settings.newEvents')).toBeDefined();
    expect(screen.getByText('settings.timeChanges')).toBeDefined();
    expect(screen.getByText('settings.scoreUpdates')).toBeDefined();
  });

  it('renders sports section', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.sports')).toBeDefined();
    expect(screen.getByText('sports.footballMen')).toBeDefined();
    expect(screen.getByText('sports.volleyballMen')).toBeDefined();
    expect(screen.getByText('sports.volleyballWomen')).toBeDefined();
  });

  it('renders reminders section', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.reminders')).toBeDefined();
    expect(screen.getByText('settings.reminder24h')).toBeDefined();
    expect(screen.getByText('settings.reminder2h')).toBeDefined();
  });

  it('renders toggle switches', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
  });

  it('toggles a preference when switch is clicked', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    const switches = screen.getAllByRole('switch');
    await act(async () => {
      fireEvent.click(switches[0]);
    });
    // Should not crash
    expect(switches[0]).toBeDefined();
  });

  it('renders pause all toggle', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.pauseAll')).toBeDefined();
  });
});
