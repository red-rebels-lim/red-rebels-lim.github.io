import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock state ───────────────────────────────────────────────────────
const { mockSendFcm } = vi.hoisted(() => ({
  mockSendFcm: vi.fn(),
}));

vi.mock('./lib/fcm-sender.js', () => ({
  sendFcmMessage: mockSendFcm,
  isFcmConfigured: () => true,
}));

import { main } from './send-test-push.js';

// ── main() ───────────────────────────────────────────────────────────────────

describe('main()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    mockSendFcm.mockResolvedValue({ ok: true, unregistered: false });
  });

  it('sends one clearly-labeled test push with deep-link data', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    vi.stubEnv('TEST_FCM_TOKEN', 'fcm-token-1');

    await main();

    expect(mockSendFcm).toHaveBeenCalledOnce();
    const [token, msg] = mockSendFcm.mock.calls[0];
    expect(token).toBe('fcm-token-1');
    expect(msg.title).toMatch(/^\[TEST\] /);
    expect(msg.title).toContain('24h');
    expect(msg.body).toContain('TEST OPPONENT');
    expect(msg.data.eventKey).toBe('september-1-football-men-TEST OPPONENT');
    expect(msg.data.sport).toBe('football-men');
    expect(msg.data.tag).toBe('reminder-24h-september-1-football-men-TEST OPPONENT');
    expect(msg.data.url).toBe('/');
  });

  it('uses TEST_EVENT_KEY (and its sport) in the data payload when provided', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    vi.stubEnv('TEST_FCM_TOKEN', 'fcm-token-1');
    vi.stubEnv('TEST_EVENT_KEY', 'november-1-volleyball-women-ΑΕΚ ΛΑΡΝΑΚΑΣ (Γ)');

    await main();

    expect(mockSendFcm).toHaveBeenCalledOnce();
    const [, msg] = mockSendFcm.mock.calls[0];
    expect(msg.data.eventKey).toBe('november-1-volleyball-women-ΑΕΚ ΛΑΡΝΑΚΑΣ (Γ)');
    expect(msg.data.sport).toBe('volleyball-women');
  });

  it('exits non-zero when TEST_FCM_TOKEN is missing', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    vi.stubEnv('TEST_FCM_TOKEN', '');

    await expect(main()).rejects.toThrow('process.exit');

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(mockSendFcm).not.toHaveBeenCalled();
  });

  it('exits non-zero when FIREBASE_SERVICE_ACCOUNT is missing', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '');
    vi.stubEnv('TEST_FCM_TOKEN', 'fcm-token-1');

    await expect(main()).rejects.toThrow('process.exit');

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(mockSendFcm).not.toHaveBeenCalled();
  });

  it('exits non-zero when the FCM send fails', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"project_id":"p"}');
    vi.stubEnv('TEST_FCM_TOKEN', 'fcm-token-1');
    mockSendFcm.mockResolvedValue({ ok: false, unregistered: true, statusCode: 404 });

    await expect(main()).rejects.toThrow('process.exit');

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
