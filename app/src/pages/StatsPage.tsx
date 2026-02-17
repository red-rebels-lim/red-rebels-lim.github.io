import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { calculateStatistics, getFormColor } from '@/lib/stats';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  fetchTeamData,
  parseLeagueTables,
  parseTopScorers,
  parseLeagueRankings,
  parseVenueInfo,
  parseNextMatch,
} from '@/lib/fotmob';
import type {
  FotMobTeamData,
  LeagueTableData,
  TopScorer,
  LeagueRanking,
  VenueInfo as VenueInfoType,
  NextMatchInfo,
} from '@/lib/fotmob';
import { LeagueTable } from '@/components/stats/LeagueTable';
import { TopScorers } from '@/components/stats/TopScorers';
import { LeagueRankings } from '@/components/stats/LeagueRankings';
import { VenueInfo } from '@/components/stats/VenueInfo';
import { NextMatch } from '@/components/stats/NextMatch';

interface FotMobParsed {
  tables: LeagueTableData[];
  topScorers: TopScorer[];
  rankings: LeagueRanking[];
  venue: VenueInfoType | null;
  nextMatch: NextMatchInfo | null;
}

function parseFotMobData(data: FotMobTeamData): FotMobParsed {
  return {
    tables: parseLeagueTables(data),
    topScorers: parseTopScorers(data),
    rankings: parseLeagueRankings(data),
    venue: parseVenueInfo(data),
    nextMatch: parseNextMatch(data),
  };
}

export default function StatsPage() {
  const { t } = useTranslation();
  const stats = useMemo(() => calculateStatistics(), []);

  const [fotmob, setFotmob] = useState<FotMobParsed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData()
      .then((data) => {
        if (data) setFotmob(parseFotMobData(data));
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'stats.matches', value: stats.overall.played },
    { label: 'stats.wins', value: stats.overall.wins },
    { label: 'stats.draws', value: stats.overall.draws },
    { label: 'stats.losses', value: stats.overall.losses },
    { label: 'stats.goals', value: `${stats.overall.goalsFor}-${stats.overall.goalsAgainst}` },
    { label: 'stats.points', value: stats.overall.points },
    { label: 'stats.cleanSheets', value: stats.cleanSheets },
    { label: 'stats.avgGoalsFor', value: stats.avgGoalsFor },
    { label: 'stats.avgGoalsAgainst', value: stats.avgGoalsAgainst },
  ];

  const streakLabel = (s: typeof stats.currentStreak) => {
    switch (s.type) {
      case 'W': return `${s.count} ${t('stats.wins').toLowerCase()}`;
      case 'D': return `${s.count} ${t('stats.draws').toLowerCase()}`;
      case 'L': return `${s.count} ${t('stats.losses').toLowerCase()}`;
      case 'unbeaten': return `${s.count} ${t('stats.longestUnbeatenStreak').toLowerCase()}`;
    }
  };

  // Loading skeleton for FotMob sections
  const LoadingSkeleton = () => (
    <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-[rgba(224,37,32,0.15)] rounded w-1/3" />
        <div className="h-32 bg-[rgba(224,37,32,0.1)] rounded" />
      </div>
    </section>
  );

  return (
    <div className="max-w-[1800px] w-[95%] mx-auto">
      <Navbar />

      {/* 1. Next Match (FotMob) */}
      {loading && <LoadingSkeleton />}
      {fotmob?.nextMatch && <NextMatch match={fotmob.nextMatch} />}

      {/* 2. League Standing (FotMob) */}
      {loading && <LoadingSkeleton />}
      {fotmob && fotmob.tables.length > 0 && (
        <LeagueTable tables={fotmob.tables} />
      )}

      {/* 3. Overall stats (existing) */}
      <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
        <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
          {t('stats.overallStats')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border-2 border-[rgba(224,37,32,0.3)] rounded-xl p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[rgba(224,37,32,0.5)]"
            >
              <div className="text-4xl font-black text-[#E02520] mb-2 drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
                {card.value}
              </div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                {t(card.label)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. League Rankings (FotMob) */}
      {loading && <LoadingSkeleton />}
      {fotmob && fotmob.rankings.length > 0 && (
        <LeagueRankings rankings={fotmob.rankings} />
      )}

      {/* 5. Top Scorers (FotMob) */}
      {loading && <LoadingSkeleton />}
      {fotmob && fotmob.topScorers.length > 0 && (
        <TopScorers scorers={fotmob.topScorers} />
      )}

      {/* 6. Home vs Away (existing) */}
      <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
        <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
          {t('stats.homeVsAway')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'stats.home', data: stats.home },
            { label: 'stats.away', data: stats.away },
          ].map(({ label, data }) => (
            <div key={label} className="bg-white/[0.03] rounded-xl p-4 border border-[rgba(224,37,32,0.15)]">
              <h3 className="text-red-300 text-lg font-extrabold uppercase tracking-wide text-center mb-4">
                {t(label)}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'stats.wins', v: data.wins, color: 'text-green-400' },
                  { l: 'stats.draws', v: data.draws, color: 'text-yellow-400' },
                  { l: 'stats.losses', v: data.losses, color: 'text-red-400' },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className={`text-2xl font-black ${s.color}`}>{s.v}</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase">{t(s.l)}</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-3 text-sm text-muted-foreground">
                {t('stats.goals')}: {data.goalsFor}-{data.goalsAgainst} ({data.goalDifference > 0 ? '+' : ''}{data.goalDifference})
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Recent form + Streaks (existing) */}
      <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
        <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
          {t('stats.recentForm')}
        </h2>
        <div className="flex justify-center gap-3 flex-wrap mb-4">
          {stats.recentForm.length === 0 ? (
            <p className="text-muted-foreground">{t('stats.noData')}</p>
          ) : (
            stats.recentForm.map((match, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-md cursor-pointer transition-all hover:-translate-y-1 hover:scale-110"
                style={{ background: getFormColor(match.result) }}
                title={`${match.opponent} (${match.score})`}
              >
                {match.result}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-center gap-6 flex-wrap text-sm mb-4">
          {[
            { label: 'W', color: '#4CAF50', text: t('stats.wins') },
            { label: 'D', color: '#FFC107', text: t('stats.draws') },
            { label: 'L', color: '#F44336', text: t('stats.losses') },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-muted-foreground font-semibold">
              <div className="w-7 h-7 rounded flex items-center justify-center text-sm font-black text-white" style={{ background: item.color }}>
                {item.label}
              </div>
              {item.text}
            </div>
          ))}
        </div>

        {/* Streaks info */}
        {stats.overall.played > 0 && (
          <div className="border-t border-[rgba(224,37,32,0.2)] pt-4 mt-2">
            <h3 className="text-red-300 text-sm font-extrabold uppercase tracking-wide text-center mb-3">
              {t('stats.streaks')}
            </h3>
            <div className="flex justify-center gap-6 flex-wrap text-sm text-muted-foreground">
              <div className="text-center">
                <div className="text-lg font-black text-foreground">{streakLabel(stats.currentStreak)}</div>
                <div className="text-xs font-bold uppercase">{t('stats.currentStreak')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-green-400">{stats.longestWinStreak}</div>
                <div className="text-xs font-bold uppercase">{t('stats.longestWinStreak')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-blue-400">{stats.longestUnbeatenStreak}</div>
                <div className="text-xs font-bold uppercase">{t('stats.longestUnbeatenStreak')}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 8. Head to Head (existing) */}
      <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg overflow-x-auto">
        <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
          {t('stats.headToHead')}
        </h2>
        {stats.headToHead.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t('stats.noData')}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(224,37,32,0.2)]">
                <th className="text-left py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.opponent')}</th>
                <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.played')}</th>
                <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.w')}</th>
                <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.d')}</th>
                <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.l')}</th>
                <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.goalsCol')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.headToHead.slice(0, 10).map((h2h) => (
                <tr key={h2h.opponent} className="border-b border-[rgba(224,37,32,0.2)] hover:bg-[rgba(224,37,32,0.1)] transition-colors">
                  <td className="py-3 px-3 font-bold text-foreground">{h2h.opponent}</td>
                  <td className="py-3 px-3 text-center text-muted-foreground">{h2h.played}</td>
                  <td className="py-3 px-3 text-center font-bold text-green-400">{h2h.wins}</td>
                  <td className="py-3 px-3 text-center font-bold text-yellow-400">{h2h.draws}</td>
                  <td className="py-3 px-3 text-center font-bold text-red-400">{h2h.losses}</td>
                  <td className="py-3 px-3 text-center text-muted-foreground">{h2h.goalsFor}-{h2h.goalsAgainst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 9. Goal Distribution Chart (existing) */}
      {stats.goalDistribution.length > 0 && (
        <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
          <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
            {t('stats.goalDistribution')}
          </h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={stats.goalDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="match" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a0f0f', border: '1px solid rgba(224,37,32,0.3)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fca5a5' }}
                />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Bar dataKey="goalsFor" name={t('stats.scored')} fill="#4CAF50" radius={[4, 4, 0, 0]} />
                <Bar dataKey="goalsAgainst" name={t('stats.conceded')} fill="#F44336" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 10. Records (existing) */}
      {(stats.biggestWin || stats.heaviestDefeat) && (
        <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
          <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
            {t('stats.records')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.biggestWin && (
              <div className="bg-gradient-to-br from-[rgba(76,175,80,0.15)] to-[rgba(56,142,60,0.1)] border-2 border-[rgba(76,175,80,0.3)] rounded-xl p-5 text-center">
                <div className="text-xs font-bold text-green-300 uppercase tracking-wider mb-2">{t('stats.biggestWin')}</div>
                <div className="text-2xl font-black text-green-400 mb-1">{stats.biggestWin.score}</div>
                <div className="text-sm font-bold text-muted-foreground">vs {stats.biggestWin.opponent}</div>
              </div>
            )}
            {stats.heaviestDefeat && (
              <div className="bg-gradient-to-br from-[rgba(244,67,54,0.15)] to-[rgba(211,47,47,0.1)] border-2 border-[rgba(244,67,54,0.3)] rounded-xl p-5 text-center">
                <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">{t('stats.heaviestDefeat')}</div>
                <div className="text-2xl font-black text-red-400 mb-1">{stats.heaviestDefeat.score}</div>
                <div className="text-sm font-bold text-muted-foreground">vs {stats.heaviestDefeat.opponent}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 11. Season Progress Chart (existing) */}
      {stats.pointsProgression.length > 0 && (
        <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
          <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
            {t('stats.seasonProgress')}
          </h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={stats.pointsProgression} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,37,32,0.15)" />
                <XAxis
                  dataKey="match"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: t('stats.matchday'), position: 'insideBottom', offset: -2, fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a0f0f', border: '1px solid rgba(224,37,32,0.3)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fca5a5' }}
                  labelFormatter={(label) => {
                    const entry = stats.pointsProgression.find(p => p.match === label);
                    return entry ? `${t('stats.matchday')} ${label} - ${entry.opponent}` : `${t('stats.matchday')} ${label}`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#E02520"
                  strokeWidth={3}
                  dot={{ fill: '#E02520', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#E02520', strokeWidth: 2 }}
                  name={t('stats.points')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 12. Venue Info (FotMob) */}
      {fotmob?.venue && <VenueInfo venue={fotmob.venue} />}
    </div>
  );
}
