import { describe, it, expect } from 'vitest';
import { sportConfig } from '@/data/sport-config';

describe('sportConfig', () => {
  it('has all four sport types', () => {
    expect(Object.keys(sportConfig)).toHaveLength(4);
    expect(sportConfig).toHaveProperty('football-men');
    expect(sportConfig).toHaveProperty('volleyball-men');
    expect(sportConfig).toHaveProperty('volleyball-women');
    expect(sportConfig).toHaveProperty('meeting');
  });

  it('each sport has emoji and name', () => {
    for (const [, config] of Object.entries(sportConfig)) {
      expect(config).toHaveProperty('emoji');
      expect(config).toHaveProperty('name');
      expect(typeof config.name).toBe('string');
      expect(config.name.length).toBeGreaterThan(0);
    }
  });

  it("football-men has Men's Football name", () => {
    expect(sportConfig['football-men'].name).toBe("Men's Football");
  });

  it('meeting has empty emoji', () => {
    expect(sportConfig['meeting'].emoji).toBe('');
  });

  it('non-meeting sports have non-empty emoji', () => {
    expect(sportConfig['football-men'].emoji.length).toBeGreaterThan(0);
    expect(sportConfig['volleyball-men'].emoji.length).toBeGreaterThan(0);
    expect(sportConfig['volleyball-women'].emoji.length).toBeGreaterThan(0);
  });
});
