import { useTranslation } from 'react-i18next';
import type { VenueInfo as VenueInfoType } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';

interface VenueInfoProps {
  venue: VenueInfoType;
}

export function VenueInfo({ venue }: VenueInfoProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-surface-overlay backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-primary-border shadow-lg">
      <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
        {t('stats.venueInfo')}
      </h2>
      <div className="bg-gradient-to-br from-primary-bg-subtle to-primary-bg-subtle/60 border-2 border-primary-border rounded-xl p-5">
        <div className="text-xl font-black text-primary mb-3 drop-shadow-[0_2px_10px_var(--primary-glow)]">
          {tApi(t, 'venue', venue.name)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
              {t('stats.venueCity')}
            </div>
            <div className="text-sm font-bold text-foreground">{tApi(t, 'venue', venue.city)}</div>
          </div>
          {venue.capacity && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                {t('stats.venueCapacity')}
              </div>
              <div className="text-sm font-bold text-foreground">{venue.capacity}</div>
            </div>
          )}
          {venue.surface && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                {t('stats.venueSurface')}
              </div>
              <div className="text-sm font-bold text-foreground">{tApi(t, 'venue', venue.surface)}</div>
            </div>
          )}
          {venue.yearOpened && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                {t('stats.venueYear')}
              </div>
              <div className="text-sm font-bold text-foreground">{venue.yearOpened}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
