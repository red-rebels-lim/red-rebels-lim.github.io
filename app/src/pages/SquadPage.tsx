import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PlayerRow } from '@/components/squad/PlayerRow';
import { PositionSection } from '@/components/squad/PositionSection';
import { PlayerSheet } from '@/components/squad/PlayerSheet';
import { aggregateSquadStats } from '@/lib/football-stats';
import { players } from '@/data/players';
import { cn } from '@/lib/utils';
import type { Sport } from '@/types/events';
import type { Player, Position } from '@/types/players';

type SquadSport = Extract<Sport, 'football-men' | 'volleyball-men' | 'volleyball-women'>;

const POSITION_ORDER: Record<SquadSport, Position[]> = {
  'football-men': ['GK', 'DEF', 'MID', 'FWD'],
  'volleyball-men': ['SETTER', 'OUTSIDE', 'OPPOSITE', 'MIDDLE', 'LIBERO'],
  'volleyball-women': ['SETTER', 'OUTSIDE', 'OPPOSITE', 'MIDDLE', 'LIBERO'],
};

export default function SquadPage() {
  const { t } = useTranslation();
  const [activeSport, setActiveSport] = useState<SquadSport>('football-men');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const roster = useMemo(
    () => players.filter((p) => p.active && p.sport === activeSport),
    [activeSport],
  );

  // Per-player season stats only exist for football (aggregated from events.ts).
  const isFootball = activeSport === 'football-men';
  const stats = useMemo(
    () => (isFootball ? aggregateSquadStats({ roster }) : null),
    [isFootball, roster],
  );

  const positionOrder = POSITION_ORDER[activeSport];

  const grouped = useMemo(() => {
    const groups = new Map<Position, Player[]>(positionOrder.map((pos) => [pos, []]));
    for (const p of roster) groups.get(p.position)?.push(p);
    for (const list of groups.values()) {
      list.sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999));
    }
    return groups;
  }, [roster, positionOrder]);

  const selectedStats = selectedPlayer ? stats?.get(selectedPlayer.key) ?? null : null;

  return (
    <div className="w-full mx-auto pb-24">
      <MobileHeader showBack />

      <h1 className="sr-only">{t('nav.squad')}</h1>

      <div className="bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none rounded-2xl mx-2 p-3 mt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{t('nav.squad')}</h2>

        <div role="tablist" className="flex flex-wrap gap-2 py-2 mb-2">
          {(
            [
              { value: 'football-men', label: t('stats.mensFootball') },
              { value: 'volleyball-men', label: t('stats.mensVolleyball') },
              { value: 'volleyball-women', label: t('stats.womensVolleyball') },
            ] as { value: SquadSport; label: string }[]
          ).map((tab) => (
            <button
              key={tab.value}
              id={`squad-tab-${tab.value}`}
              role="tab"
              aria-selected={activeSport === tab.value}
              aria-controls="squad-tabpanel"
              onClick={() => setActiveSport(tab.value)}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-all',
                activeSport === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div id="squad-tabpanel" role="tabpanel" aria-labelledby={`squad-tab-${activeSport}`}>
          {positionOrder.map((pos) => {
            const group = grouped.get(pos) ?? [];
            return (
              group.length > 0 && (
                <PositionSection
                  key={`${activeSport}-${pos}`}
                  position={pos}
                  count={group.length}
                  showStatColumns={isFootball}
                >
                  {group.map((player) => {
                    const playerStats = isFootball
                      ? stats?.get(player.key) ?? {
                          key: player.key,
                          apps: 0,
                          starts: 0,
                          subAppearances: 0,
                          goals: 0,
                          goalsOpenPlay: 0,
                          goalsPenalty: 0,
                          ownGoals: 0,
                          yellowCards: 0,
                          redCards: 0,
                          matchLog: [],
                        }
                      : null;
                    return (
                      <PlayerRow
                        key={player.key}
                        player={player}
                        stats={playerStats}
                        onSelect={setSelectedPlayer}
                      />
                    );
                  })}
                </PositionSection>
              )
            );
          })}
        </div>
      </div>

      <PlayerSheet
        player={selectedPlayer}
        stats={selectedStats}
        open={selectedPlayer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayer(null);
        }}
      />
    </div>
  );
}
