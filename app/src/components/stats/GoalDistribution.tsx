import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { GoalDistributionEntry } from '@/types/events';
import { translateTeamName } from '@/lib/translate';

interface GoalDistributionProps {
  goalDistribution: GoalDistributionEntry[];
}

export function GoalDistribution({ goalDistribution }: GoalDistributionProps) {
  const { t } = useTranslation();

  const translatedData = useMemo(() =>
    goalDistribution.map(entry => {
      const name = translateTeamName(entry.opponent, t);
      return { ...entry, match: name.length > 10 ? name.substring(0, 10) + '\u2026' : name };
    }),
    [goalDistribution, t]
  );

  if (goalDistribution.length === 0) return null;

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.goalDistribution')}</h2>
      <div className="w-full h-[300px]" role="img" aria-label={`${t('stats.goalDistribution')}: ${t('stats.goalDistSummary')}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={translatedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey="match" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface-dark)', border: '1px solid var(--primary-border)', borderRadius: '8px' }}
              labelStyle={{ color: '#fca5a5' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Bar dataKey="goalsFor" name={t('stats.scored')} fill="#4CAF50" radius={[4, 4, 0, 0]} />
            <Bar dataKey="goalsAgainst" name={t('stats.conceded')} fill="#F44336" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
