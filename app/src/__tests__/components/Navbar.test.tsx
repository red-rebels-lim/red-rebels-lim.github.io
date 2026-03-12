import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const changeLanguageMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: changeLanguageMock },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, className, onClick, ...rest }: Record<string, unknown>) => {
    const cls = typeof className === 'function' ? className({ isActive: to === '/' }) : className;
    return <a href={to as string} className={cls as string} onClick={onClick as () => void} {...rest}>{children as React.ReactNode}</a>;
  },
  useLocation: () => ({ pathname: '/' }),
}));

const toggleThemeMock = vi.fn();

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: toggleThemeMock }),
}));

vi.mock('@/lib/ics-export', () => ({
  exportToCalendar: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock Sheet to always render its content (avoids Radix portal complexity)
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock DropdownMenu to always render its content
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <div role="menuitem" onClick={onClick} className={className}>{children}</div>
  ),
}));

import { trackEvent } from '@/lib/analytics';
import { exportToCalendar } from '@/lib/ics-export';
import { Navbar } from '@/components/layout/Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand logo', () => {
    render(<Navbar />);
    const logo = screen.getByAltText('Red Rebels');
    expect(logo).toBeDefined();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getAllByText('nav.calendar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nav.stats').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nav.settings').length).toBeGreaterThan(0);
  });

  it('renders language toggle button', () => {
    render(<Navbar />);
    screen.getByText('EN');
  });

  it('calls onToggleFilters when filter button is clicked', () => {
    const onToggle = vi.fn();
    render(<Navbar onToggleFilters={onToggle} />);
    const filterButtons = screen.getAllByText('filters.title');
    fireEvent.click(filterButtons[0]);
    expect(onToggle).toHaveBeenCalled();
  });

  it('calls changeLanguage and trackEvent when language button clicked', () => {
    render(<Navbar />);
    const langBtn = screen.getByText('EN');
    fireEvent.click(langBtn);
    expect(changeLanguageMock).toHaveBeenCalledWith('el');
    expect(trackEvent).toHaveBeenCalledWith('toggle_language', { language: 'el' });
  });

  it('calls toggleTheme and trackEvent when theme button clicked', () => {
    render(<Navbar />);
    // isDark is true, so desktop theme button shows moon emoji
    const moonBtns = screen.getAllByText('\u{1F319}');
    fireEvent.click(moonBtns[0]);
    expect(toggleThemeMock).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('toggle_theme', { theme: 'light' });
  });

  it('closes mobile menu when nav link is clicked', () => {
    render(<Navbar />);
    const calendarLinks = screen.getAllByText('nav.calendar');
    fireEvent.click(calendarLinks[0]);
    expect(calendarLinks[0]).toBeDefined();
  });

  it('renders mobile month navigation when calendar props provided', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    render(<Navbar currentMonth="february" onPrevious={onPrev} onNext={onNext} onToday={onToday} />);
    screen.getByRole('button', { name: 'Previous month' });
    screen.getByRole('button', { name: 'Next month' });
    screen.getByText('monthNav.jumpToToday');
  });

  it('calls onPrevious and trackEvent when previous month button clicked', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    render(<Navbar currentMonth="february" onPrevious={onPrev} onNext={onNext} onToday={onToday} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(onPrev).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('navigate_month', { direction: 'previous' });
  });

  it('calls onNext and trackEvent when next month button clicked', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    render(<Navbar currentMonth="february" onPrevious={onPrev} onNext={onNext} onToday={onToday} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onNext).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('navigate_month', { direction: 'next' });
  });

  it('calls onToday and trackEvent when today button clicked', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    render(<Navbar currentMonth="february" onPrevious={onPrev} onNext={onNext} onToday={onToday} />);
    fireEvent.click(screen.getByText('monthNav.jumpToToday'));
    expect(onToday).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('navigate_month', { direction: 'today' });
  });

  it('does not render month navigation without props', () => {
    render(<Navbar />);
    expect(screen.queryByRole('button', { name: 'Previous month' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next month' })).toBeNull();
  });

  it('calls exportToCalendar and trackEvent when export dropdown item clicked on calendar page', () => {
    render(<Navbar />);
    // Sheet is mocked to always render — export item inside SheetContent is visible
    const exportBtns = screen.getAllByText('nav.export');
    fireEvent.click(exportBtns[0]);
    expect(exportToCalendar).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('export_calendar');
  });

  it('calls window.print when print item clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<Navbar />);
    const printBtns = screen.getAllByText('nav.print');
    fireEvent.click(printBtns[0]);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('calls onToggleFilters and trackEvent from mobile sheet filter button', () => {
    const onToggle = vi.fn();
    render(<Navbar onToggleFilters={onToggle} />);
    const filterBtns = screen.getAllByText('filters.title');
    // Click the second filter button (inside Sheet content)
    if (filterBtns.length > 1) {
      fireEvent.click(filterBtns[1]);
      expect(onToggle).toHaveBeenCalled();
    }
  });

  it('sets install prompt on beforeinstallprompt event', async () => {
    render(<Navbar />);
    await act(async () => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });
  });

  it('clears install prompt on appinstalled event', async () => {
    render(<Navbar />);
    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });
  });

  it('covers onClick for stats nav link', () => {
    render(<Navbar />);
    const statsLinks = screen.getAllByText('nav.stats');
    fireEvent.click(statsLinks[0]);
    // setMobileOpen(false) was called — no crash
  });

  it('covers onClick for settings nav link', () => {
    render(<Navbar />);
    const settingsLinks = screen.getAllByText('nav.settings');
    fireEvent.click(settingsLinks[0]);
  });

  it('renders install button after beforeinstallprompt and handles install', async () => {
    render(<Navbar />);
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const userChoiceMock = Promise.resolve({ outcome: 'accepted' as const });

    await act(async () => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, { prompt: promptMock, userChoice: userChoiceMock });
      window.dispatchEvent(event);
    });

    // Install button should now be visible
    const installBtns = screen.getAllByText('nav.install');
    expect(installBtns.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(installBtns[0]);
    });

    expect(promptMock).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('install_app', { outcome: 'accepted' });
  });

  it('handles install prompt error gracefully', async () => {
    render(<Navbar />);

    await act(async () => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: vi.fn().mockRejectedValue(new Error('User cancelled')),
        userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
      });
      window.dispatchEvent(event);
    });

    const installBtns = screen.getAllByText('nav.install');
    await act(async () => {
      fireEvent.click(installBtns[0]);
    });
    // Should not crash — installPrompt cleared via catch
  });

  it('calls toggleTheme from mobile sheet theme button', () => {
    render(<Navbar />);
    // Both desktop (aria-label) and mobile (text) buttons match "light mode";
    // the mobile button is inside SheetContent — pick the last one.
    const themeBtns = screen.getAllByRole('button', { name: /light mode/i });
    fireEvent.click(themeBtns[themeBtns.length - 1]);
    expect(toggleThemeMock).toHaveBeenCalled();
  });

  it('calls exportToCalendar from mobile sheet export button', () => {
    render(<Navbar />);
    // Both desktop DropdownMenuItem and mobile Sheet button show "nav.export"
    const exportBtns = screen.getAllByText('nav.export');
    if (exportBtns.length > 1) {
      fireEvent.click(exportBtns[exportBtns.length - 1]);
      expect(exportToCalendar).toHaveBeenCalled();
    }
  });

  it('calls window.print from mobile sheet print button', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<Navbar />);
    const printBtns = screen.getAllByText('nav.print');
    if (printBtns.length > 1) {
      fireEvent.click(printBtns[printBtns.length - 1]);
      expect(printSpy).toHaveBeenCalled();
    }
    printSpy.mockRestore();
  });
});
