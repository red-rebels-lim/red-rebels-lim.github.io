import type { MonthName, MonthInfo } from '@/types/events';

export const MONTH_ORDER: MonthName[] = [
  'september', 'october', 'november', 'december',
  'january', 'february', 'march', 'april',
  'may', 'june', 'july', 'august',
];

function getMonthInfo(monthName: MonthName): MonthInfo {
  const map: Record<MonthName, { monthIndex: number; year: number }> = {
    september: { monthIndex: 8, year: 2025 },
    october: { monthIndex: 9, year: 2025 },
    november: { monthIndex: 10, year: 2025 },
    december: { monthIndex: 11, year: 2025 },
    january: { monthIndex: 0, year: 2026 },
    february: { monthIndex: 1, year: 2026 },
    march: { monthIndex: 2, year: 2026 },
    april: { monthIndex: 3, year: 2026 },
    may: { monthIndex: 4, year: 2026 },
    june: { monthIndex: 5, year: 2026 },
    july: { monthIndex: 6, year: 2026 },
    august: { monthIndex: 7, year: 2026 },
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
