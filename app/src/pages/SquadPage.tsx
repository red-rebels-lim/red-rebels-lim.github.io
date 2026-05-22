import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PlayerRow } from '@/components/squad/PlayerRow';
import { PositionSection } from '@/components/squad/PositionSection';
import { PlayerSheet } from '@/components/squad/PlayerSheet';
import { aggregateSquadStats } from '@/lib/football-stats';
import { players } from '@/data/players';
import type { Player, Position } from '@/types/players';

const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

export default function SquadPage() {
  const { t } = useTranslation();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const roster = useMemo(
    () => players.filter((p) => p.active && p.sport === 'football-men'),
    [],
  );

  const stats = useMemo(() => aggregateSquadStats({ roster }), [roster]);

  const grouped = useMemo(() => {
    const groups: Record<Position, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of roster) groups[p.position].push(p);
    for (const pos of POSITION_ORDER) {
      groups[pos].sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999));
    }
    return groups;
  }, [roster]);

  const selectedStats = selectedPlayer ? stats.get(selectedPlayer.key) ?? null : null;

  return (
    <div className="w-full mx-auto pb-24">
      <MobileHeader showBack />

      <h1 className="sr-only">{t('nav.squad')}</h1>

      <div className="bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none rounded-2xl mx-2 p-3 mt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{t('nav.squad')}</h2>

        {POSITION_ORDER.map(
          (pos) =>
            grouped[pos].length > 0 && (
              <PositionSection key={pos} position={pos} count={grouped[pos].length}>
                {grouped[pos].map((player) => {
                  const playerStats =
                    stats.get(player.key) ?? {
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
                    };
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
            ),
        )}
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
