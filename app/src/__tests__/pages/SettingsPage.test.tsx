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

import SettingsPage from '@/pages/SettingsPage';

describe('SettingsPage', () => {
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
});
