import type { MonthName, MonthInfo } from '@/types/events';
import { SEASON_START_YEAR, SEASON_END_YEAR } from './constants';

export const MONTH_ORDER: MonthName[] = [
  'september', 'october', 'november', 'december',
  'january', 'february', 'march', 'april',
  'may', 'june', 'july', 'august',
];

function getMonthInfo(monthName: MonthName): MonthInfo {
  const map: Record<MonthName, { monthIndex: number; year: number }> = {
    september: { monthIndex: 8, year: SEASON_START_YEAR },
    october: { monthIndex: 9, year: SEASON_START_YEAR },
    november: { monthIndex: 10, year: SEASON_START_YEAR },
    december: { monthIndex: 11, year: SEASON_START_YEAR },
    january: { monthIndex: 0, year: SEASON_END_YEAR },
    february: { monthIndex: 1, year: SEASON_END_YEAR },
    march: { monthIndex: 2, year: SEASON_END_YEAR },
    april: { monthIndex: 3, year: SEASON_END_YEAR },
    may: { monthIndex: 4, year: SEASON_END_YEAR },
    june: { monthIndex: 5, year: SEASON_END_YEAR },
    july: { monthIndex: 6, year: SEASON_END_YEAR },
    august: { monthIndex: 7, year: SEASON_END_YEAR },
  };

  const { monthIndex, year } = map[monthName];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // getDay() returns 0=Sunday, we want 0=Monday
  const jsDay = new Date(year, monthIndex, 1).getDay();
  const startDay = jsDay === 0 ? 6 : jsDay - 1;

  return { monthIndex, year, daysInMonth, startDay };
}

export const monthMap: Record<MonthName, MonthInfo> = Object.fromEntries(
  MONTH_ORDER.map((name) => [name, getMonthInfo(name)])
) as Record<MonthName, MonthInfo>;
