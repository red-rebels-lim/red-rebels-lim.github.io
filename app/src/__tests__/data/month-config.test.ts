import { describe, it, expect } from 'vitest';
import { MONTH_ORDER, monthMap } from '@/data/month-config';

describe('MONTH_ORDER', () => {
  it('has 12 months', () => {
    expect(MONTH_ORDER).toHaveLength(12);
  });

  it('starts with september and ends with august', () => {
    expect(MONTH_ORDER[0]).toBe('september');
    expect(MONTH_ORDER[11]).toBe('august');
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

  it('September 2025 has correct monthIndex and year', () => {
    expect(monthMap.september.monthIndex).toBe(8);
    expect(monthMap.september.year).toBe(2025);
  });

  it('January 2026 has correct monthIndex and year', () => {
    expect(monthMap.january.monthIndex).toBe(0);
    expect(monthMap.january.year).toBe(2026);
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

  it('September 2025 starts on Monday (startDay=0)', () => {
    // September 1, 2025 is a Monday → 0 in Mon-based indexing
    expect(monthMap.september.startDay).toBe(0);
  });
});
