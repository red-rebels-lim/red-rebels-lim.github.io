import { useTranslation } from 'react-i18next';
import type { CalendarEvent, MonthName } from '@/types/events';
import { monthMap } from '@/data/month-config';

interface UpcomingEventCardProps {
  event: CalendarEvent;
  monthName: MonthName;
  onClick: () => void;
}

function isVolleyball(sport: string): boolean {
  return sport === 'volleyball-men' || sport === 'volleyball-women';
}

function getMatchResult(event: CalendarEvent): 'win' | 'draw' | 'loss' | null {
  if (event.status !== 'played' || !event.score) return null;
  const parts = event.score.split('-').map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  const [home, away] = parts;
  const isHome = event.location === 'home';
  const ours = isHome ? home : away;
  const theirs = isHome ? away : home;
  if (ours > theirs) return 'win';
  if (ours === theirs) return 'draw';
  return 'loss';
}

const resultAccent = {
  win: { text: 'text-green-500', bg: 'bg-green-500/10' },
  draw: { text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  loss: { text: 'text-[#dc2828]', bg: 'bg-[#dc2828]/10' },
};

function getCompetitionLabel(event: CalendarEvent, t: (key: string) => string): string {
  const sportLabels: Record<string, string> = {
    'football-men': t('sports.footballMen'),
    'volleyball-men': t('sports.volleyballMen'),
    'volleyball-women': t('sports.volleyballWomen'),
    'meeting': t('sports.meeting'),
  };
  const sportLabel = sportLabels[event.sport] || event.sport;
  if (event.competition === 'cup') return `${sportLabel} ${t('calendar.cup')}`;
  return sportLabel;
}

function getTimeFromSubtitle(subtitle: string): string {
  const match = subtitle.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
}

function getOpponent(title: string): string {
  // Title format: "Team A vs Team B" — extract opponent
  return title;
}

export function UpcomingEventCard({ event, monthName, onClick }: UpcomingEventCardProps) {
  const { t } = useTranslation();
  const isVB = isVolleyball(event.sport);
  const result = getMatchResult(event);
  const accent = result
    ? resultAccent[result]
    : { text: isVB ? 'text-blue-500' : 'text-[#dc2828]', bg: isVB ? 'bg-blue-500/10' : 'bg-[#dc2828]/10' };
  const time = getTimeFromSubtitle(event.subtitle);
  const monthAbbrev = t(`months.${monthName}`).slice(0, 3).toUpperCase();

  return (
    <div
      className={`flex items-center gap-4 bg-slate-100 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isVB ? 'opacity-80' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {/* Date/Score badge */}
      <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0 ${accent.bg}`}>
        {event.status === 'played' && event.score ? (
          <>
            <span className={`font-bold text-lg ${accent.text}`}>{event.score}</span>
            <span className={`text-[10px] uppercase font-bold ${accent.text}`}>{t(`popover.${result ?? 'upcoming'}`)}</span>
          </>
        ) : (
          <>
            <span className={`font-bold text-lg ${accent.text}`}>{event.day}</span>
            <span className={`text-[10px] uppercase font-bold ${accent.text}`}>{monthAbbrev}</span>
          </>
        )}
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isVB ? (
            <svg width="14" height="14" viewBox="0 0 407.021 407.021" fill="currentColor" className={`${accent.text} shrink-0`} aria-hidden="true">
              <path d="M203.323,0c-22.188,0-44.173,3.651-65.346,10.853c-20.882,7.106-40.301,17.429-57.717,30.683 c-69.719,53.059-97.588,144.46-69.35,227.44c17.492,51.464,53.977,93.018,102.732,117.007c28.327,13.959,58.5,21.038,89.682,21.039 c0.001,0,0.007,0,0.008,0c22.243,0,44.351-3.681,65.713-10.942c20.88-7.104,40.304-17.432,57.73-30.693 c69.711-53.054,97.575-144.45,69.334-227.429C368.041,55.44,290.565,0,203.323,0z M223.014,44.855 c2.916-2.218,5.921-4.422,8.932-6.55l2.337-1.652l2.804,0.57c13.714,2.778,27.099,7.269,39.781,13.347l9.257,4.436l-7.856,6.609 c-65.569,55.148-78.947,111.623-81.086,140.377l-0.316,4.222l-3.96,1.488c-7.51,2.824-15.628,4.255-24.127,4.255 c-9.49,0-19.639-1.783-30.165-5.3l-4.495-1.502l-0.03-4.741C133.958,179.899,139.986,108.044,223.014,44.855z M47.079,137.765 c11.536-27.453,30.082-51.437,53.632-69.359c14.56-11.08,30.764-19.69,48.164-25.593c5.162-1.765,10.725-3.354,16.531-4.719 l22.376-5.266l-16.141,16.366c-47.471,48.128-62.472,97.256-66.697,129.994l-1.388,10.74l-8.931-6.124 c-19.268-13.211-35.716-28.386-46.122-38.79l-3.148-3.148L47.079,137.765z M40.998,251.928l-0.718-2.54 c-5.585-19.759-7.538-40.106-5.804-60.476l1.117-13.101l9.865,8.692c24.67,21.737,73.522,58.204,123.524,58.204 c14.167,0,27.715-2.922,40.266-8.687l3.138-1.44l2.979,1.748c14.843,8.709,28.282,18.883,39.945,30.238l5.988,5.832l-7.043,4.5 c-14.506,9.262-39.18,20.436-74.354,21.068c-1.042,0.02-2.092,0.027-3.14,0.027c-41.043,0-85.958-14.373-133.497-42.717 L40.998,251.928z M298.867,343.746c-12.746,8.673-26.445,15.526-40.719,20.372c-17.807,6.062-36.249,9.139-54.813,9.139 c-25.989,0-51.146-5.898-74.774-17.531c-18.458-9.089-34.916-21.271-48.917-36.208L59.87,298.423l26.987,10.381 c31.207,12.004,61.478,18.091,89.973,18.091c46.053,0,78.588-15.668,97.771-28.812l5.705-3.904l3.66,5.859 c7.154,11.455,13.014,23.574,17.418,36.021l1.703,4.813L298.867,343.746z M360.992,266.742 c-6.417,16.033-15.229,30.951-26.192,44.338l-6.777,8.277l-4.389-9.755c-13.185-29.289-39.941-70.68-92.537-101.539l-3.629-2.13 l0.384-4.189c1.065-11.571,4.759-29.984,16.308-51.995l2.813-5.36l5.591,2.318c26.511,10.985,75.838,40.522,108.35,114.922 l1.108,2.541L360.992,266.742z M360.824,198.522c-29.794-42.697-64.423-65.068-88.227-76.316l-7.943-3.754l5.792-6.605 c10.655-12.142,23.38-23.922,37.821-35.014l4.354-3.346l4.095,3.662c21.682,19.379,38.089,44.169,47.444,71.689 c4.93,14.447,7.86,29.769,8.713,45.537l1.25,23.206L360.824,198.522z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor" className={`${accent.text} shrink-0`} aria-hidden="true">
              <path d="M255.03 33.813c-1.834-.007-3.664-.007-5.5.03-6.73.14-13.462.605-20.155 1.344.333.166.544.32.47.438L204.78 75.063l73.907 49.437-.125.188 70.625.28L371 79.282 342.844 52c-15.866-6.796-32.493-11.776-49.47-14.78-12.65-2.24-25.497-3.36-38.343-3.407zM190.907 88.25l-73.656 36.78-13.813 98.407 51.344 33.657 94.345-43.438 14.875-76.5-73.094-48.906zm196.344.344l-21.25 44.5 36.75 72.72 62.063 38.905 11.312-21.282c.225.143.45.403.656.75-.77-4.954-1.71-9.893-2.81-14.782-6.446-28.59-18.59-55.962-35.5-79.97-9.07-12.872-19.526-24.778-31.095-35.5l-20.125-5.342zm-302.656 23c-6.906 8.045-13.257 16.56-18.938 25.5-15.676 24.664-26.44 52.494-31.437 81.312C31.783 232.446 30.714 246.73 31 261l20.25 5.094 33.03-40.5L98.75 122.53l-14.156-10.936zm312.719 112.844l-55.813 44.75-3.47 101.093 39.626 21.126 77.188-49.594 4.406-78.75-.094.157-61.844-38.783zm-140.844 6.406l-94.033 43.312-1.218 76.625 89.155 57.376 68.938-36.437 3.437-101.75-66.28-39.126zm-224.22 49.75c.91 8.436 2.29 16.816 4.156 25.094 6.445 28.59 18.62 55.96 35.532 79.968 3.873 5.5 8.02 10.805 12.374 15.938l-9.374-48.156.124-.032-27.03-68.844-15.782-3.968zm117.188 84.844l-51.532 8.156 10.125 52.094c8.577 7.49 17.707 14.332 27.314 20.437 14.612 9.287 30.332 16.88 46.687 22.594l62.626-13.69-4.344-31.124-90.875-58.47zm302.437.5l-64.22 41.25-42 47.375 4.408 6.156c12.027-5.545 23.57-12.144 34.406-19.72 23.97-16.76 44.604-38.304 60.28-62.97 2.51-3.947 4.87-7.99 7.125-12.092zm-122.78 97.656l-79.94 9.625-25.968 5.655c26.993 4 54.717 3.044 81.313-2.813 9.412-2.072 18.684-4.79 27.75-8.062l-3.156-4.406z" />
            </svg>
          )}
          <span className={`text-[10px] font-bold uppercase ${accent.text}`}>
            {getCompetitionLabel(event, t)}
          </span>
        </div>
        <h4 className="font-bold text-sm leading-tight mb-1 text-slate-900 dark:text-slate-100 truncate">
          {getOpponent(event.title)}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t(`months.${monthName}`).slice(0, 3)} {event.day}, {monthMap[monthName].year} {time ? `\u2022 ${time}` : ''}
        </p>
      </div>

      {/* Chevron */}
      <button
        className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0"
        aria-label="View details"
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
