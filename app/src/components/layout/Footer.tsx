import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  const items = [
    { emoji: '\u{1F468}\u26BD', label: 'sports.footballMen' },
    { emoji: '\u{1F468}\u{1F3D0}', label: 'sports.volleyballMen' },
    { emoji: '\u{1F469}\u{1F3FB}\u{1F3D0}', label: 'sports.volleyballWomen' },
  ];

  return (
    <footer className="mt-8 print:hidden">
      <h3 className="text-center text-lg font-extrabold uppercase tracking-wide text-foreground mb-4">
        {t('legend.title')}
      </h3>
      <div className="flex flex-wrap justify-center gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-4 py-3 bg-[rgba(224,37,32,0.12)] border border-[rgba(224,37,32,0.2)] rounded-xl font-semibold text-secondary-foreground hover:bg-[rgba(224,37,32,0.2)] hover:border-[rgba(224,37,32,0.4)] transition-all"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span>{t(item.label)}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}
