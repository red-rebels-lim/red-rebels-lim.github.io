import { useTranslation } from 'react-i18next';
import type { VenueInfo as VenueInfoType } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';

interface VenueInfoProps {
  venue: VenueInfoType;
}

export function VenueInfo({ venue }: VenueInfoProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
      <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
        {t('stats.venueInfo')}
      </h2>
      <div className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border-2 border-[rgba(224,37,32,0.3)] rounded-xl p-5">
        <div className="text-xl font-black text-[#E02520] mb-3 drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
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
