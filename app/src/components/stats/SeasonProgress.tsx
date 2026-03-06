import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import type { PointsProgressionEntry } from '@/types/events';

interface SeasonProgressProps {
  pointsProgression: PointsProgressionEntry[];
}

export function SeasonProgress({ pointsProgression }: SeasonProgressProps) {
  const { t } = useTranslation();

  if (pointsProgression.length === 0) return null;

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.seasonProgress')}</h2>
      <div className="w-full h-[300px]" role="img" aria-label={t('stats.seasonProgress')}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <LineChart data={pointsProgression} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                const entry = pointsProgression.find(p => p.match === label);
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
  );
}
