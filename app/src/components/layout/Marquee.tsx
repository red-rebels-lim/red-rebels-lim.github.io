import { useTranslation } from 'react-i18next';
import { useVisualTheme } from '@/hooks/useVisualTheme';

const items = [
  { key: 'common.appName', accent: true },
  { key: 'sports.footballMen', accent: false },
  { key: 'sports.volleyballMen', accent: false },
  { key: 'sports.volleyballWomen', accent: false },
  { key: 'common.rebels', accent: true },
];

export function Marquee() {
  const { theme } = useVisualTheme();
  const { t } = useTranslation();

  if (theme !== 'brutalism') return null;

  const content = items.map((item) => (
    <span key={item.key} className={item.accent ? 'text-primary' : ''}>
      {t(item.key)}
    </span>
  ));

  return (
    <div className="marquee" role="presentation" aria-hidden="true">
      <div className="marquee-inner">
        {content}
        {content}
      </div>
    </div>
  );
}
