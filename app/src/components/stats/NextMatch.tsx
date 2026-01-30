import { useTranslation } from 'react-i18next';
import type { NextMatchInfo } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';

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
    <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
      <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
        {t('stats.nextMatch')}
      </h2>
      <div className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border-2 border-[rgba(224,37,32,0.3)] rounded-xl p-5 text-center">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
          {match.isHome ? t('stats.homeMatch') : t('stats.awayMatch')}
        </div>
        <div className="text-sm font-bold text-muted-foreground mb-1">
          {tApi(t, 'teams', 'Nea Salamis')}
        </div>
        <div className="text-xs text-muted-foreground/70 mb-2">vs</div>
        <div className="text-xl font-black text-foreground mb-3">
          {tApi(t, 'teams', match.opponentName)}
        </div>
        {match.utcTime && (
          <div className="text-sm font-bold text-[#E02520]">
            {formatMatchDate(match.utcTime, i18n.language)}
          </div>
        )}
      </div>
    </section>
  );
}
