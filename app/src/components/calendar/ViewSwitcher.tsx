import { useTranslation } from 'react-i18next';
import type { CalendarView } from '@/hooks/useCalendarView';

interface ViewSwitcherProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const views: { key: CalendarView; labelKey: string }[] = [
  { key: 'grid', labelKey: 'calendar.viewGrid' },
  { key: 'list', labelKey: 'calendar.viewList' },
  { key: 'cards', labelKey: 'calendar.viewCards' },
];

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 px-2 py-3" role="group" aria-label={t('calendar.viewLabel', 'View mode')}>
      {views.map(({ key, labelKey }) => (
        <button
          key={key}
          type="button"
          aria-pressed={view === key}
          onClick={() => { if (view !== key) onViewChange(key); }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all font-condensed ${
            view === key
              ? 'bg-primary text-white shadow-sm'
              : 'bg-slate-200/50 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
