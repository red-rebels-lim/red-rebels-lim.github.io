import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { trackEvent } from '@/lib/analytics';

interface MobileHeaderProps {
  showBack?: boolean;
}

export function MobileHeader({ showBack }: MobileHeaderProps) {
  const { t } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleToggleTheme = () => {
    toggleTheme();
    trackEvent('toggle_theme', { theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
      {showBack ? (
        <button
          onClick={() => navigate('/')}
          aria-label="Go back"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors text-slate-600 dark:text-slate-400"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-9" />
      )}
      <h1 className="text-xl font-bold tracking-tight text-[#dc2828]">
        {t('common.appName', 'Red Rebels')} {t('common.calendarLabel', 'Calendar')}
      </h1>
      <button
        onClick={handleToggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors text-slate-600 dark:text-slate-400"
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
    </header>
  );
}
