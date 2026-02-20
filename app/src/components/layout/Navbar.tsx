import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { exportToCalendar } from '@/lib/ics-export';
import { trackEvent } from '@/lib/analytics';
import type { MonthName } from '@/types/events';

interface NavbarProps {
  onToggleFilters?: () => void;
  currentMonth?: MonthName;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
}

export function Navbar({ onToggleFilters, currentMonth, onPrevious, onNext, onToday }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const isCalendar = location.pathname === '/' || location.pathname === '';
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'el' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang === 'el' ? 'gr' : 'en');
    trackEvent('toggle_language', { language: newLang });
  };

  const langCode = i18n.language === 'el' ? 'GR' : 'EN';

  const navLinks = (
    <>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg font-semibold transition-all hover:bg-[rgba(224,37,32,0.15)] ${
            isActive ? 'text-[#E02520] bg-[rgba(224,37,32,0.15)] font-bold' : 'text-secondary-foreground'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        {t('nav.calendar')}
      </NavLink>
      <NavLink
        to="/stats"
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg font-semibold transition-all hover:bg-[rgba(224,37,32,0.15)] ${
            isActive ? 'text-[#E02520] bg-[rgba(224,37,32,0.15)] font-bold' : 'text-secondary-foreground'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        {t('nav.stats')}
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg font-semibold transition-all hover:bg-[rgba(224,37,32,0.15)] flex items-center gap-2 ${
            isActive ? 'text-[#E02520] bg-[rgba(224,37,32,0.15)] font-bold' : 'text-secondary-foreground'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {t('nav.settings')}
      </NavLink>
    </>
  );

  return (
    <nav className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border-2 border-[rgba(224,37,32,0.3)] rounded-2xl p-4 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-4 z-50 md:relative md:top-0 md:z-auto">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 text-foreground font-bold text-xl no-underline hover:text-[#E02520] transition-all">
          <img src="/images/clear_logo_sm.webp" alt="Red Rebels" width={40} height={40} fetchPriority="high" className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(224,37,32,0.3)]" />
          <span className="hidden md:inline tracking-wide">{t('common.brandText')}</span>
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isCalendar && onToggleFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFilters}
              className="hidden md:flex border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground"
            >
              {t('filters.title')}
            </Button>
          )}

          {/* Tools dropdown — desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex min-h-[44px] border-[rgba(224,37,32,0.4)] bg-[rgba(224,37,32,0.2)] hover:bg-[rgba(224,37,32,0.3)] hover:border-[#E02520] text-foreground font-semibold"
              >
                {t('nav.options')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[rgba(26,15,15,0.95)] backdrop-blur-xl border-[rgba(224,37,32,0.3)]">
              {isCalendar && (
                <DropdownMenuItem onClick={() => { exportToCalendar(); trackEvent('export_calendar'); }} className="text-foreground hover:text-[#E02520] cursor-pointer">
                  {t('nav.export')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => { window.print(); trackEvent('print_calendar'); }} className="text-foreground hover:text-[#E02520] cursor-pointer">
                {t('nav.print')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleLanguage}
            className="w-11 h-11 rounded-full border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground font-bold text-sm"
          >
            {langCode}
          </Button>

          {/* Theme toggle — desktop only */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => { toggleTheme(); trackEvent('toggle_theme', { theme: isDark ? 'light' : 'dark' }); }}
            className="hidden md:inline-flex w-11 h-11 rounded-full border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground text-xl"
          >
            {isDark ? '\u{1F319}' : '\u2600\uFE0F'}
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open menu"
                className="md:hidden w-11 h-11 border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] text-foreground"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5h14M3 10h14M3 15h14" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0a1810] border-[rgba(224,37,32,0.3)]">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks}
                {isCalendar && onToggleFilters && (
                  <Button
                    variant="outline"
                    onClick={() => { onToggleFilters(); setMobileOpen(false); }}
                    className="border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] text-foreground"
                  >
                    {t('filters.title')}
                  </Button>
                )}

                <div className="border-t border-[rgba(224,37,32,0.2)] my-2" />

                {/* Theme toggle */}
                <Button
                  variant="outline"
                  onClick={() => { toggleTheme(); trackEvent('toggle_theme', { theme: isDark ? 'light' : 'dark' }); setMobileOpen(false); }}
                  className="border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] text-foreground justify-start gap-3"
                >
                  <span className="text-xl">{isDark ? '\u{1F319}' : '\u2600\uFE0F'}</span>
                  {isDark ? t('nav.lightMode', 'Light Mode') : t('nav.darkMode', 'Dark Mode')}
                </Button>

                {/* Tools */}
                {isCalendar && (
                  <Button
                    variant="outline"
                    onClick={() => { exportToCalendar(); trackEvent('export_calendar'); setMobileOpen(false); }}
                    className="border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] text-foreground justify-start"
                  >
                    {t('nav.export')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { window.print(); setMobileOpen(false); }}
                  className="border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] text-foreground justify-start"
                >
                  {t('nav.print')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile month navigation */}
      {isCalendar && currentMonth && onPrevious && onNext && onToday && (
        <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-[rgba(224,37,32,0.2)]">
          <Button
            variant="outline"
            size="icon"
            onClick={() => { trackEvent('navigate_month', { direction: 'previous' }); onPrevious(); }}
            className="w-10 h-10 border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Button>

          <div className="text-center px-4 py-1.5 text-base font-extrabold uppercase tracking-wide text-foreground">
            {t(`months.${currentMonth}`)}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => { trackEvent('navigate_month', { direction: 'next' }); onNext(); }}
            className="w-10 h-10 border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </Button>

          <Button
            onClick={() => { trackEvent('navigate_month', { direction: 'today' }); onToday(); }}
            className="ml-2 h-10 px-3 bg-gradient-to-br from-[#E02520] to-[#b91c1c] text-white border-2 border-[#E02520] font-bold text-sm uppercase shadow-[0_4px_12px_rgba(224,37,32,0.4)] hover:from-[#b91c1c] hover:to-[#991b1b]"
          >
            {t('monthNav.jumpToToday')}
          </Button>
        </div>
      )}
    </nav>
  );
}
