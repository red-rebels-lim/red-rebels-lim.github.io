import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { trackEvent } from '@/lib/analytics';
import type { ReactNode } from 'react';
import type { CalendarView } from '@/hooks/useCalendarView';

interface MobileHeaderProps {
  showBack?: boolean;
  calendarView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
}

const viewIcons: Record<CalendarView, ReactNode> = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  cards: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="7" rx="1" /><rect x="2" y="14" width="20" height="7" rx="1" />
    </svg>
  ),
};

const viewOrder: CalendarView[] = ['grid', 'list', 'cards'];

export function MobileHeader({ showBack, calendarView, onViewChange }: MobileHeaderProps) {
  const { t } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleToggleTheme = () => {
    toggleTheme();
    trackEvent('toggle_theme', { theme: isDark ? 'light' : 'dark' });
  };

  const handleShare = async () => {
    const shareData = {
      title: t('common.appName', 'Red Rebels') + ' ' + t('common.calendarLabel', 'Calendar'),
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
      trackEvent('share', { method: 'share' in navigator ? 'native' : 'clipboard' });
    } catch {
      // User cancelled share dialog
    }
  };

  const cycleView = () => {
    if (!calendarView || !onViewChange) return;
    const idx = viewOrder.indexOf(calendarView);
    const next = viewOrder[(idx + 1) % viewOrder.length];
    onViewChange(next);
    trackEvent('switch_calendar_view', { view: next });
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-[var(--border-subtle)] dark:backdrop-blur-[var(--glass-blur)] dark:bg-background/80">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate('/')}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-full bg-slate-100 dark:bg-[#1e293b] text-[#dc2828] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight text-[#dc2828] font-condensed">
          {t('common.appName', 'Red Rebels')} {t('common.calendarLabel', 'Calendar')}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Layout switcher — calendar page only */}
        {calendarView && onViewChange && (
          <button
            data-tour="layout"
            onClick={cycleView}
            aria-label={t('calendar.viewLabel', 'Switch layout')}
            className="p-2 rounded-full bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 transition-colors"
          >
            {viewIcons[calendarView]}
          </button>
        )}
        {/* Share button */}
        <button
          onClick={handleShare}
          aria-label={t('calendar.shareMatch', 'Share')}
          className="p-2 rounded-full bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        {/* Dark/light toggle */}
        <button
          onClick={handleToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-full bg-slate-100 dark:bg-[#1e293b] text-[#dc2828] transition-colors"
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
