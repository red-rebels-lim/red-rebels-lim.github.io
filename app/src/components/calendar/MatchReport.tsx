import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MatchReportProps {
  reportEN?: string;
  reportEL?: string;
  lang?: string;
}

export function MatchReport({ reportEN, reportEL, lang }: MatchReportProps) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const language = lang ?? i18n.language;
  const text = (language === 'el' ? reportEL || reportEN : reportEN || reportEL) || '';

  if (!text) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left bg-white/5 border-2 border-[rgba(224,37,32,0.2)] rounded-xl p-3 hover:bg-white/8 transition-all cursor-pointer"
      >
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('matchReport.title')}
        </span>
        <span className="text-foreground/60 text-sm">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {expanded && (
        <div className="bg-white/5 border-2 border-t-0 border-[rgba(224,37,32,0.2)] rounded-b-xl p-3 -mt-0.5">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{text}</p>
        </div>
      )}
    </div>
  );
}
