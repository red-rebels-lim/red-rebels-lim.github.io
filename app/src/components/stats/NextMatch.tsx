import { useTranslation } from 'react-i18next';
import type { NextMatchInfo } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';
import { TEAM_LOGOS } from '@/data/constants';

interface NextMatchProps {
  match: NextMatchInfo;
}

function formatMatchDate(utcTime: string | undefined, lang: string): string {
  if (!utcTime) return '';
  try {
    const date = new Date(utcTime);
    return date.toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return utcTime;
  }
}

export function NextMatch({ match }: NextMatchProps) {
  const { t, i18n } = useTranslation();

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.nextMatch')}</h2>
      <div className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 text-center">
          {match.isHome ? t('stats.homeMatch') : t('stats.awayMatch')}
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={TEAM_LOGOS['Nea Salamis']}
                alt="Nea Salamis"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="text-sm font-bold">{tApi(t, 'teams', 'Nea Salamis')}</div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">vs</div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 overflow-hidden border border-slate-200 dark:border-slate-700">
              {TEAM_LOGOS[match.opponentName] ? (
                <img
                  src={TEAM_LOGOS[match.opponentName]}
                  alt={match.opponentName}
                  loading="lazy"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
                  {match.opponentName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-sm font-bold">{tApi(t, 'teams', match.opponentName)}</div>
          </div>
        </div>
        {match.utcTime && (
          <div className="text-sm font-bold text-primary text-center mt-3">
            {formatMatchDate(match.utcTime, i18n.language)}
          </div>
        )}
      </div>
    </section>
  );
}
