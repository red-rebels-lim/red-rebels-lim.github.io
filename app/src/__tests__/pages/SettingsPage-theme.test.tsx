import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

const mockSetTheme = vi.fn();
vi.mock('@/hooks/useVisualTheme', () => ({
  useVisualTheme: () => ({
    theme: 'default' as const,
    setTheme: mockSetTheme,
    themes: ['default', 'brutalism', 'cinema', 'neon'] as const,
  }),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/ics-export', () => ({ exportToCalendar: vi.fn() }));
vi.mock('@/lib/push', () => ({
  isPushSupported: vi.fn().mockReturnValue(false),
  getSubscriptionStatus: vi.fn().mockReturnValue('unsupported'),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
  getStoredSubscriptionId: vi.fn().mockReturnValue(null),
}));
vi.mock('@/lib/preferences', () => ({
  getPreferences: vi.fn().mockResolvedValue(null),
  updatePreferences: vi.fn(),
}));
vi.mock('@/hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({ canInstall: false, promptInstall: vi.fn() }),
}));
vi.mock('@/lib/logger', () => ({ logError: vi.fn() }));

import SettingsPage from '@/pages/SettingsPage';

describe('SettingsPage — Theme Selector', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders Visual Theme section', async () => {
    await act(async () => { render(<SettingsPage />); });
    const matches = screen.getAllByText('settings.visualTheme');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('displays current theme name', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByText('settings.themeDefault')).toBeDefined();
  });

  it('theme selector is a dropdown', async () => {
    await act(async () => { render(<SettingsPage />); });
    // The theme selector should be a combobox (Select trigger)
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });
});
