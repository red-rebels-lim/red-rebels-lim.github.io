import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock state ───────────────────────────────────────────────────────
const {
  mockSendNotification,
  mockReminderLogFirst,
  mockPrefFind,
  mockReminderLogSave,
  mockDestroyAll,
  mockSubDestroy,
} = vi.hoisted(() => ({
  mockSendNotification: vi.fn(),
  mockReminderLogFirst: vi.fn(),
  mockPrefFind: vi.fn(),
  mockReminderLogSave: vi.fn(),
  mockDestroyAll: vi.fn(),
  mockSubDestroy: vi.fn(),
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: mockSendNotification,
  },
}));

vi.mock('parse/node.js', () => {
  // Every Query instance exposes both first and find.
  // Tests control behaviour via mockResolvedValueOnce chains.
  const MockQuery = vi.fn().mockImplementation(() => ({
    equalTo: vi.fn().mockReturnThis(),
    containedIn: vi.fn().mockReturnThis(),
    include: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    first: mockReminderLogFirst,
    find: mockPrefFind,
  }));

  const MockReminderLog = vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    save: mockReminderLogSave,
  }));

  const MockParseObjectClass = vi.fn();
  MockParseObjectClass.createWithoutData = vi.fn().mockReturnValue({
    id: 'sub-1',
    destroy: mockSubDestroy,
  });

  return {
    default: {
      initialize: vi.fn(),
      serverURL: '',
      masterKey: '',
      Object: {
        extend: vi.fn().mockImplementation((className) => {
          if (className === 'ReminderLog') return MockReminderLog;
          return MockParseObjectClass;
        }),
        destroyAll: mockDestroyAll,
      },
      Query: MockQuery,
    },
  };
});

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

import fs from 'fs';
import { main, sportEmoji } from './send-reminders.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePref({
  disabled = false,
  reminderHours = [24, 2],
  enabledSports = ['football-men', 'volleyball-men', 'volleyball-women'],
  subId = 'sub-1',
  endpoint = 'https://push.example.com/1',
  p256dh = 'key1',
  auth = 'auth1',
} = {}) {
  const sub = {
    id: subId,
    get: vi.fn((field) => ({ endpoint, p256dh, auth }[field])),
  };
  return {
    get: vi.fn((field) => ({
      disabled,
      reminderHours,
      enabledSports,
      subscription: sub,
    }[field])),
  };
}

/**
 * Build a minimal events.ts string with a single upcoming match.
 * hoursUntil controls when the match is (relative to now).
 */
function makeEventsTs(hoursUntil = 24, sport = 'football-men') {
  const matchDate = new Date(Date.now() + hoursUntil * 60 * 60 * 1000);
  const monthNames = ['january','february','march','april','may','june',
                      'july','august','september','october','november','december'];
  const month = monthNames[matchDate.getMonth()];
  const day = matchDate.getDate();
  const timeStr = `${String(matchDate.getHours()).padStart(2,'0')}:${String(matchDate.getMinutes()).padStart(2,'0')}`;

  return `export const eventsData = ${JSON.stringify({
    [month]: [{ day, sport, opponent: 'Omonia', location: 'home', time: timeStr, venue: 'GSP' }],
  })};`;
}

// ── Pure helper tests ────────────────────────────────────────────────────────

describe('sportEmoji', () => {
  it('returns football emoji', () => expect(sportEmoji('football-men')).toContain('\u26BD'));
  it('returns volleyball emoji for women', () => expect(sportEmoji('volleyball-women')).toBeTruthy());
  it('returns empty string for unknown sport', () => expect(sportEmoji('x')).toBe(''));
});

// ── Integration tests (main()) ───────────────────────────────────────────────

describe('main()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    mockReminderLogSave.mockResolvedValue(undefined);
    mockDestroyAll.mockResolvedValue(undefined);
    mockSubDestroy.mockResolvedValue(undefined);
  });

  it('exits early when no upcoming matches in 25h window', async () => {
    // Match 48h away — outside the window
    fs.readFileSync.mockReturnValue(makeEventsTs(48));
    await expect(main()).rejects.toThrow('process.exit');
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('sends 24h reminder to subscriber who has 24h enabled', async () => {
    fs.readFileSync.mockReturnValue(makeEventsTs(24));
    mockReminderLogFirst.mockResolvedValue(null); // not already sent
    mockPrefFind.mockResolvedValue([makePref({ reminderHours: [24, 2] })]);

    await main();

    expect(mockSendNotification).toHaveBeenCalledOnce();
    const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
    expect(payload.title).toContain('24h');
  });

  it('sends 2h reminder to subscriber who has 2h enabled', async () => {
    fs.readFileSync.mockReturnValue(makeEventsTs(2));
    mockReminderLogFirst.mockResolvedValue(null);
    mockPrefFind.mockResolvedValue([makePref({ reminderHours: [24, 2] })]);

    await main();

    expect(mockSendNotification).toHaveBeenCalledOnce();
    const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
    expect(payload.title).toContain('2h');
  });

  it('does not send if reminder already logged (dedup)', async () => {
    fs.readFileSync.mockReturnValue(makeEventsTs(24));
    // ReminderLog.first() returns an existing record
    mockReminderLogFirst.mockResolvedValue({ id: 'existing-log' });

    await main();

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('skips match with no kick-off time', async () => {
    const eventsTs = `export const eventsData = ${JSON.stringify({
      march: [{ day: 20, sport: 'football-men', opponent: 'Omonia', location: 'home', time: '' }],
    })};`;
    fs.readFileSync.mockReturnValue(eventsTs);

    await expect(main()).rejects.toThrow('process.exit');
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('cleans up expired subscription on 410', async () => {
    fs.readFileSync.mockReturnValue(makeEventsTs(24));
    mockReminderLogFirst.mockResolvedValue(null);
    mockPrefFind
      .mockResolvedValueOnce([makePref({ subId: 'expired' })])  // prefs query
      .mockResolvedValueOnce([]);                                // cleanup find
    mockSendNotification.mockRejectedValue({ statusCode: 410, message: 'Gone' });

    await main();

    expect(mockDestroyAll).toHaveBeenCalled();
  });

  it('logs summary after sending', async () => {
    fs.readFileSync.mockReturnValue(makeEventsTs(24));
    mockReminderLogFirst.mockResolvedValue(null);
    mockPrefFind.mockResolvedValue([makePref()]);
    mockSendNotification.mockResolvedValue(undefined);

    await main();

    expect(mockReminderLogSave).toHaveBeenCalled(); // ReminderLog entry written
  });
});
