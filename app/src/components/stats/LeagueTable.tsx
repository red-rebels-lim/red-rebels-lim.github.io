import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeagueTableData } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';
import { NEA_SALAMINA_ID } from '@/data/constants';

interface LeagueTableProps {
  tables: LeagueTableData[];
}

const TH_CLASS = 'py-2 px-2 text-center text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50';

function getCompactRows(
  rows: LeagueTableData['rows'],
  nsIndex: number
): LeagueTableData['rows'] {
  if (rows.length <= 3) return rows;

  // Show row above, Nea Salamina, row below
  const start = Math.max(0, nsIndex - 1);
  const end = Math.min(rows.length, start + 3);
  const adjustedStart = end - start < 3 ? Math.max(0, end - 3) : start;

  return rows.slice(adjustedStart, adjustedStart + 3);
}

export function LeagueTable({ tables }: LeagueTableProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const relevantTables = tables.filter((tbl) =>
    tbl.rows.some((r) => r.id === NEA_SALAMINA_ID)
  );

  if (relevantTables.length === 0) return null;

  return (
    <section className="stat-section overflow-x-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="stat-section-title mb-0">{t('stats.leagueStanding')}</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="text-xs font-bold text-[#E02520] uppercase tracking-wide hover:underline"
        >
          {t('stats.viewFull')}
        </button>
      </div>

      <div className="space-y-8">
        {relevantTables.map((tbl) => {
          const nsIndex = tbl.rows.findIndex((r) => r.id === NEA_SALAMINA_ID);
          const displayRows = expanded
            ? tbl.rows
            : getCompactRows(tbl.rows, nsIndex);

          return (
            <div key={tbl.leagueName}>
              {relevantTables.length > 1 && (
                <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-slate-600 dark:text-slate-300">
                  {tApi(t, 'leagues', tbl.leagueName)}
                </h3>
              )}
              <table className="w-full border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className={`${TH_CLASS} text-left`}>#</th>
                    <th className={`${TH_CLASS} text-left`}>{t('stats.team')}</th>
                    <th className={TH_CLASS}>{t('stats.goalDifference')}</th>
                    <th className={TH_CLASS}>{t('stats.points')}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const isUs = row.id === NEA_SALAMINA_ID;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-slate-200 dark:border-slate-800 transition-colors ${
                          isUs
                            ? 'bg-primary/10 border-l-2 border-l-primary font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
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
                        <td className="py-2 px-2 text-center text-muted-foreground">
                          {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                        </td>
                        <td className={`py-2 px-2 text-center font-bold ${isUs ? 'text-[#E02520]' : 'text-foreground'}`}>{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {expanded && tbl.legend.length > 0 && (
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
          );
        })}
      </div>
    </section>
  );
}
