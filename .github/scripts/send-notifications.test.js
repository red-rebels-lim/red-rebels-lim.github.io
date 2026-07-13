import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock state ───────────────────────────────────────────────────────
const {
  mockSendNotification,
  mockPrefFind,
  mockDestroyAll,
  mockSubDestroy,
  mockSendFcm,
} = vi.hoisted(() => ({
  mockSendNotification: vi.fn(),
  mockPrefFind: vi.fn(),
  mockDestroyAll: vi.fn(),
  mockSubDestroy: vi.fn(),
  mockSendFcm: vi.fn(),
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: mockSendNotification,
  },
}));

vi.mock('parse/node.js', () => {
  const MockParseObjectClass = vi.fn();
  MockParseObjectClass.createWithoutData = vi.fn().mockReturnValue({
    destroy: mockSubDestroy,
  });

  const MockQuery = vi.fn().mockImplementation(() => ({
    equalTo: vi.fn().mockReturnThis(),
    include: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    find: mockPrefFind,
  }));

  return {
    default: {
      initialize: vi.fn(),
      serverURL: '',
      masterKey: '',
      Object: {
        extend: vi.fn().mockReturnValue(MockParseObjectClass),
        destroyAll: mockDestroyAll,
      },
      Query: MockQuery,
    },
  };
});

vi.mock('./lib/fcm-sender.js', () => ({
  sendFcmMessage: mockSendFcm,
  isFcmConfigured: () => true,
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn(),
  },
}));

import fs from 'fs';
import { main, extractSport } from './send-notifications.js';
import { buildChangePayload as buildPayload, sportEmoji } from './lib/message-builder.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePref({
  notifyNewEvents = true,
  notifyScoreUpdates = true,
  notifyTimeChanges = true,
  enabledSports = ['football-men', 'volleyball-men', 'volleyball-women'],
  subId = 'sub-1',
  endpoint = 'https://push.example.com/1',
  p256dh = 'key1',
  auth = 'auth1',
} = {}) {
  const sub = { id: subId, get: vi.fn((f) => ({ endpoint, p256dh, auth }[f])) };
  return {
    get: vi.fn((f) => ({
      notifyNewEvents, notifyScoreUpdates, notifyTimeChanges, enabledSports, subscription: sub,
    }[f])),
  };
}

function makeFcmPref({
  notifyNewEvents = true,
  notifyScoreUpdates = true,
  notifyTimeChanges = true,
  enabledSports = ['football-men', 'volleyball-men', 'volleyball-women'],
  subId = 'fcm-sub-1',
  token = 'fcm-token-1',
} = {}) {
  const sub = { id: subId, get: vi.fn((f) => ({ platform: 'fcm', token }[f])) };
  return {
    get: vi.fn((f) => ({
      notifyNewEvents, notifyScoreUpdates, notifyTimeChanges, enabledSports, subscription: sub,
    }[f])),
  };
}

function changesJson(overrides = {}) {
  return JSON.stringify({ added: [], scoreUpdated: [], timeUpdated: [], venueUpdated: [], unchanged: 0, ...overrides });
}

function eventsTs() {
  return `export const eventsData = ${JSON.stringify({
    february: [{ day: 20, sport: 'football-men', opponent: 'Omonia', location: 'home', time: '15:00' }],
  })};`;
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

describe('sportEmoji', () => {
  it('football-men', () => expect(sportEmoji('football-men')).toContain('\u26BD'));
  it('volleyball-men', () => expect(sportEmoji('volleyball-men')).toContain('\uD83C\uDFD0'));
  it('unknown → empty', () => expect(sportEmoji('x')).toBe(''));
});

describe('extractSport', () => {
  it('extracts football-men', () =>
    expect(extractSport('February 20: football-men vs Omonia')).toBe('football-men'));
  it('extracts volleyball-women', () =>
    expect(extractSport('March 5: volleyball-women vs Anagennisi')).toBe('volleyball-women'));
  it('returns null on no match', () =>
    expect(extractSport('random string')).toBeNull());
});

describe('buildPayload', () => {
  it('added → New Match with home marker', () => {
    const p = buildPayload('added', 'February 20: football-men vs Omonia', 'football-men', 'home');
    expect(p.title).toContain('New Match');
    expect(p.body).toContain('Omonia');
    expect(p.body).toContain('(H)');
    expect(p.tag).toMatch(/^new-/);
  });

  it('scoreUpdated → Score Update with change detail', () => {
    const p = buildPayload('scoreUpdated', 'March 1: football-men vs AEL (none → 2-1)', 'football-men', 'away');
    expect(p.title).toContain('Score Update');
    expect(p.body).toContain('2-1');
    expect(p.body).toContain('(A)');
  });

  it('timeUpdated → Time Changed with time detail', () => {
    const p = buildPayload('timeUpdated', 'March 8: football-men vs Apoel (15:00 → 17:00)', 'football-men', null);
    expect(p.title).toContain('Time Changed');
    expect(p.body).toContain('15:00 → 17:00');
  });

  it('unknown type → null', () =>
    expect(buildPayload('venueUpdated', 'desc', 'football-men', null)).toBeNull());
});

// ── main() ───────────────────────────────────────────────────────────────────

describe('main()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    // FCM channel is off by default; individual tests opt in.
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json') ? changesJson() : eventsTs()
    );
    mockDestroyAll.mockResolvedValue(undefined);
    mockSubDestroy.mockResolvedValue(undefined);
    mockSendFcm.mockResolvedValue({ ok: true, unregistered: false });
  });

  it('exits early when changes.json is missing', async () => {
    fs.existsSync.mockReturnValue(false);
    await expect(main()).rejects.toThrow('process.exit');
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('exits early when no relevant changes', async () => {
    // changes.json has no entries → process.exit(0) called
    mockPrefFind.mockResolvedValue([]);
    await expect(main()).rejects.toThrow('process.exit');
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('sends notification to subscriber with matching pref + sport', async () => {
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json')
        ? changesJson({ scoreUpdated: ['February 20: football-men vs Omonia (none → 2-1)'] })
        : eventsTs()
    );
    mockPrefFind.mockResolvedValue([makePref({ notifyScoreUpdates: true })]);

    await main();

    expect(mockSendNotification).toHaveBeenCalledOnce();
    const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
    expect(payload.title).toContain('Score Update');
  });

  it('skips subscriber with notifyScoreUpdates: false', async () => {
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json')
        ? changesJson({ scoreUpdated: ['February 20: football-men vs Omonia (none → 2-1)'] })
        : eventsTs()
    );
    mockPrefFind.mockResolvedValue([makePref({ notifyScoreUpdates: false })]);

    await main();

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('skips subscriber whose enabledSports excludes the event sport', async () => {
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json')
        ? changesJson({ added: ['February 20: football-men vs Omonia'] })
        : eventsTs()
    );
    mockPrefFind.mockResolvedValue([makePref({ enabledSports: ['volleyball-men'] })]);

    await main();

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('cleans up expired subscription on 410', async () => {
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json')
        ? changesJson({ scoreUpdated: ['February 20: football-men vs Omonia (none → 2-1)'] })
        : eventsTs()
    );
    mockPrefFind
      .mockResolvedValueOnce([makePref({ subId: 'expired' })])  // main prefs query
      .mockResolvedValueOnce([]);                                // cleanup find
    mockSendNotification.mockRejectedValue({ statusCode: 410, message: 'Gone' });

    await main();

    expect(mockDestroyAll).toHaveBeenCalled();
    expect(mockSubDestroy).toHaveBeenCalled();
  });

  it('continues delivering after a non-fatal send error', async () => {
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json')
        ? changesJson({ scoreUpdated: ['February 20: football-men vs Omonia (none → 2-1)'] })
        : eventsTs()
    );
    const pref2 = makePref({ subId: 'sub-2', endpoint: 'https://push.example.com/2', p256dh: 'k2', auth: 'a2' });
    mockPrefFind.mockResolvedValue([makePref(), pref2]);
    mockSendNotification
      .mockRejectedValueOnce({ statusCode: 500, message: 'Server Error' })
      .mockResolvedValueOnce(undefined);

    await main();

    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });

  // ── FCM channel ────────────────────────────────────────────────────────────

  function mockScoreChange() {
    fs.readFileSync.mockImplementation((p) =>
      String(p).endsWith('changes.json')
        ? changesJson({ scoreUpdated: ['February 20: football-men vs Omonia (none → 2-1)'] })
        : eventsTs()
    );
  }

  it('sends FCM notification to fcm subscriber when FIREBASE_SERVICE_ACCOUNT is set', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    mockScoreChange();
    mockPrefFind.mockResolvedValue([makeFcmPref()]);

    await main();

    expect(mockSendFcm).toHaveBeenCalledOnce();
    const [token, msg] = mockSendFcm.mock.calls[0];
    expect(token).toBe('fcm-token-1');
    expect(msg.title).toContain('Score Update');
    // The web-push loop must not try to deliver to the fcm subscription
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('delivers to both web and fcm subscribers in one pass', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    mockScoreChange();
    mockPrefFind.mockResolvedValue([makePref(), makeFcmPref()]);
    mockSendNotification.mockResolvedValue(undefined);

    await main();

    expect(mockSendNotification).toHaveBeenCalledOnce();
    expect(mockSendFcm).toHaveBeenCalledOnce();
  });

  it('skips FCM subscriber when FIREBASE_SERVICE_ACCOUNT is not set', async () => {
    mockScoreChange();
    mockPrefFind.mockResolvedValue([makeFcmPref()]);

    await main();

    expect(mockSendFcm).not.toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('skips fcm subscriber with notifyScoreUpdates: false', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    mockScoreChange();
    mockPrefFind.mockResolvedValue([makeFcmPref({ notifyScoreUpdates: false })]);

    await main();

    expect(mockSendFcm).not.toHaveBeenCalled();
  });

  it('skips fcm subscriber whose enabledSports excludes the event sport', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    mockScoreChange();
    mockPrefFind.mockResolvedValue([makeFcmPref({ enabledSports: ['volleyball-men'] })]);

    await main();

    expect(mockSendFcm).not.toHaveBeenCalled();
  });

  it('destroys subscription and preferences on unregistered FCM token', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    mockScoreChange();
    mockPrefFind
      .mockResolvedValueOnce([makeFcmPref({ subId: 'fcm-dead' })])  // main prefs query
      .mockResolvedValueOnce([]);                                    // cleanup find
    mockSendFcm.mockResolvedValue({ ok: false, unregistered: true });

    await main();

    expect(mockDestroyAll).toHaveBeenCalled();
    expect(mockSubDestroy).toHaveBeenCalled();
  });
});
