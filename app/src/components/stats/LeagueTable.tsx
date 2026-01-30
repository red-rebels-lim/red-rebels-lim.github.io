import { useTranslation } from 'react-i18next';
import type { LeagueTableData } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';

interface LeagueTableProps {
  tables: LeagueTableData[];
}

const NEA_SALAMINA_ID = 8590;

const TH_CLASS = 'py-2 px-2 text-center text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]';

export function LeagueTable({ tables }: LeagueTableProps) {
  const { t } = useTranslation();

  // Only show tables that contain Nea Salamina
  const relevantTables = tables.filter((tbl) =>
    tbl.rows.some((r) => r.id === NEA_SALAMINA_ID)
  );

  if (relevantTables.length === 0) return null;

  return (
    <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg overflow-x-auto">
      <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
        {t('stats.leagueStanding')}
      </h2>

      <div className="space-y-8">
        {relevantTables.map((tbl) => (
          <div key={tbl.leagueName}>
            {relevantTables.length > 1 && (
              <h3 className="text-red-300/80 text-sm font-extrabold uppercase tracking-wide mb-3">
                {tApi(t, 'leagues', tbl.leagueName)}
              </h3>
            )}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgba(224,37,32,0.2)]">
                  <th className={`${TH_CLASS} text-left`}>#</th>
                  <th className={`${TH_CLASS} text-left`}>{t('stats.team')}</th>
                  <th className={TH_CLASS}>{t('stats.played')}</th>
                  <th className={TH_CLASS}>{t('stats.w')}</th>
                  <th className={TH_CLASS}>{t('stats.d')}</th>
                  <th className={TH_CLASS}>{t('stats.l')}</th>
                  <th className={TH_CLASS}>{t('stats.goalDifference')}</th>
                  <th className={TH_CLASS}>{t('stats.points')}</th>
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((row) => {
                  const isUs = row.id === NEA_SALAMINA_ID;
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[rgba(224,37,32,0.1)] transition-colors ${
                        isUs
                          ? 'bg-gradient-to-r from-[rgba(224,37,32,0.2)] to-[rgba(224,37,32,0.1)] font-bold'
                          : 'hover:bg-[rgba(224,37,32,0.05)]'
                      }`}
                    >
                      <td className="py-2 px-2">
                        <span className="flex items-center gap-1.5">
                          {row.qualColor && (
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: row.qualColor }}
                            />
                          )}
                          <span className={isUs ? 'text-[#E02520]' : 'text-muted-foreground'}>{row.position}</span>
                        </span>
                      </td>
                      <td className={`py-2 px-2 ${isUs ? 'text-[#E02520]' : 'text-foreground'}`}>
                        <span className="hidden sm:inline">{tApi(t, 'teams', row.name)}</span>
                        <span className="sm:hidden">{tApi(t, 'teams', row.shortName)}</span>
                      </td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{row.played}</td>
                      <td className="py-2 px-2 text-center text-green-400">{row.wins}</td>
                      <td className="py-2 px-2 text-center text-yellow-400">{row.draws}</td>
                      <td className="py-2 px-2 text-center text-red-400">{row.losses}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">
                        {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                      </td>
                      <td className={`py-2 px-2 text-center font-bold ${isUs ? 'text-[#E02520]' : 'text-foreground'}`}>{row.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tbl.legend.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                {tbl.legend.map((item) => (
                  <div key={item.title} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                    {tApi(t, 'legendEntries', item.title)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
