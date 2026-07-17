import { describe, it, expect } from 'vitest';
import { MONTH_ORDER, monthMap } from '@/data/month-config';

describe('MONTH_ORDER', () => {
  it('has 12 months', () => {
    expect(MONTH_ORDER).toHaveLength(12);
  });

  it('starts with july and ends with june (season window since 26/27)', () => {
    expect(MONTH_ORDER[0]).toBe('july');
    expect(MONTH_ORDER[11]).toBe('june');
  });

  it('has no duplicates', () => {
    const unique = new Set(MONTH_ORDER);
    expect(unique.size).toBe(12);
  });
});

describe('monthMap', () => {
  it('has entries for all 12 months', () => {
    expect(Object.keys(monthMap)).toHaveLength(12);
    for (const month of MONTH_ORDER) {
      expect(monthMap[month]).toBeDefined();
    }
  });

  it('September has correct monthIndex and start-year', () => {
    expect(monthMap.september.monthIndex).toBe(8);
    expect(monthMap.september.year).toBe(2026);
  });

  it('January has correct monthIndex and end-year', () => {
    expect(monthMap.january.monthIndex).toBe(0);
    expect(monthMap.january.year).toBe(2027);
  });

  it('all months have valid daysInMonth (28-31)', () => {
    for (const month of MONTH_ORDER) {
      expect(monthMap[month].daysInMonth).toBeGreaterThanOrEqual(28);
      expect(monthMap[month].daysInMonth).toBeLessThanOrEqual(31);
    }
  });

  it('all months have valid startDay (0-6)', () => {
    for (const month of MONTH_ORDER) {
      expect(monthMap[month].startDay).toBeGreaterThanOrEqual(0);
      expect(monthMap[month].startDay).toBeLessThanOrEqual(6);
    }
  });

  it('February 2026 has 28 days', () => {
    expect(monthMap.february.daysInMonth).toBe(28);
  });

  it('July 2026 starts on Wednesday (startDay=2)', () => {
    // July 1, 2026 is a Wednesday → 2 in Mon-based indexing
    expect(monthMap.july.startDay).toBe(2);
  });
});
