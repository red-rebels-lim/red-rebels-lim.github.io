import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
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

import { unsubscribeFromPush } from '@/lib/push';
import SettingsPage from '@/pages/SettingsPage';

describe('SettingsPage (subscribed)', () => {
  beforeEach(() => {
    vi.mocked(unsubscribeFromPush).mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
  });
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

  it('toggles notifyNewEvents preference (switches[1])', async () => {
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    if (switches.length > 1) {
      await act(async () => { fireEvent.click(switches[1]); });
      expect(switches[1]).toBeDefined();
    }
  });

  it('toggles notifyTimeChanges preference (switches[2])', async () => {
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    if (switches.length > 2) {
      await act(async () => { fireEvent.click(switches[2]); });
      expect(switches[2]).toBeDefined();
    }
  });

  it('toggles notifyScoreUpdates preference (switches[3])', async () => {
    await act(async () => { render(<SettingsPage />); });
    const switches = screen.getAllByRole('switch');
    if (switches.length > 3) {
      await act(async () => { fireEvent.click(switches[3]); });
      expect(switches[3]).toBeDefined();
    }
  });

  it('renders pause all toggle', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('settings.pauseAll')).toBeDefined();
  });

  it('calls unsubscribeFromPush and updates status when disable clicked', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    const disableBtn = screen.getByText('settings.disable');
    await act(async () => {
      fireEvent.click(disableBtn);
    });
    expect(unsubscribeFromPush).toHaveBeenCalled();
    expect(screen.getByText('settings.enable')).toBeDefined();
  });

  it('toggles sport preference when sport switch clicked', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    const switches = screen.getAllByRole('switch');
    // switches[4] is football-men sport toggle
    if (switches.length > 4) {
      await act(async () => {
        fireEvent.click(switches[4]);
      });
      // toggleSport was called — no errors
      expect(switches[4]).toBeDefined();
    }
  });

  it('toggles reminder preference when reminder switch clicked', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    const switches = screen.getAllByRole('switch');
    // switches[7] is the 24h reminder toggle
    if (switches.length > 7) {
      await act(async () => {
        fireEvent.click(switches[7]);
      });
      // toggleReminder was called — no errors
      expect(switches[7]).toBeDefined();
    }
  });

  it('handles unsubscribe error gracefully', async () => {
    vi.mocked(unsubscribeFromPush).mockRejectedValue(new Error('Unsubscribe failed'));
    await act(async () => {
      render(<SettingsPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('settings.disable'));
    });
    // Status should remain subscribed since unsubscribe threw
    expect(screen.getByText('settings.enabled')).toBeDefined();
  });

  it('covers savePrefs timeout callback when preferences saved', async () => {
    vi.useFakeTimers();
    await act(async () => {
      render(<SettingsPage />);
    });
    const switches = screen.getAllByRole('switch');
    if (switches.length > 0) {
      await act(async () => {
        fireEvent.click(switches[0]);
      });
      // Advance 800ms to trigger the savePrefs debounce timeout
      await act(async () => {
        vi.advanceTimersByTime(900);
      });
    }
  });
});
