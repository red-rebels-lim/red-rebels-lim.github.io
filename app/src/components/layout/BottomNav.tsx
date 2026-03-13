import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { to: '/', labelKey: 'nav.calendar', Icon: Calendar },
  { to: '/stats', labelKey: 'nav.stats', Icon: BarChart3 },
  { to: '/settings', labelKey: 'nav.settings', Icon: Settings },
] as const;

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-100 dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 z-50 print:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {tabs.map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive
                  ? 'text-[#dc2828]'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-bold">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
