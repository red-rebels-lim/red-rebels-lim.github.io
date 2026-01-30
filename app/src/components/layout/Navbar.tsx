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

interface NavbarProps {
  onToggleFilters?: () => void;
}

export function Navbar({ onToggleFilters }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const isCalendar = location.pathname === '/' || location.pathname === '';
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'el' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang === 'el' ? 'gr' : 'en');
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
    </>
  );

  return (
    <nav className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border-2 border-[rgba(224,37,32,0.3)] rounded-2xl p-4 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 text-foreground font-bold text-xl no-underline hover:text-[#E02520] transition-all">
          <img src="/images/clear_logo.png" alt="Red Rebels" className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(224,37,32,0.3)]" />
          <span className="tracking-wide">{t('common.brandText')}</span>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-[rgba(224,37,32,0.4)] bg-[rgba(224,37,32,0.2)] hover:bg-[rgba(224,37,32,0.3)] hover:border-[#E02520] text-foreground font-semibold"
              >
                {t('nav.options')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[rgba(26,15,15,0.95)] backdrop-blur-xl border-[rgba(224,37,32,0.3)]">
              {isCalendar && (
                <DropdownMenuItem onClick={exportToCalendar} className="text-foreground hover:text-[#E02520] cursor-pointer">
                  {t('nav.export')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => window.print()} className="text-foreground hover:text-[#E02520] cursor-pointer">
                {t('nav.print')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground font-bold text-sm"
          >
            {langCode}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground text-xl"
          >
            {isDark ? '\u{1F319}' : '\u2600\uFE0F'}
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden w-10 h-10 border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] text-foreground"
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
