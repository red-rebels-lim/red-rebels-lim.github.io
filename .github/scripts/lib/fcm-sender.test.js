import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mock state ───────────────────────────────────────────────────────
const { mockGetAccessToken, MockGoogleAuth } = vi.hoisted(() => {
  const mockGetAccessToken = vi.fn();
  const MockGoogleAuth = vi.fn().mockImplementation(() => ({
    getAccessToken: mockGetAccessToken,
  }));
  return { mockGetAccessToken, MockGoogleAuth };
});

vi.mock('google-auth-library', () => ({ GoogleAuth: MockGoogleAuth }));

import { sendFcmMessage, isFcmConfigured } from './fcm-sender.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_ACCOUNT = JSON.stringify({
  project_id: 'test-project',
  client_email: 'sa@test-project.iam.gserviceaccount.com',
  private_key: 'fake-key',
});

const mockFetch = vi.fn();

function fetchResponse({ ok = true, status = 200, json = {} } = {}) {
  return {
    ok,
    status,
    json: async () => json,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubGlobal('fetch', mockFetch);
  mockGetAccessToken.mockResolvedValue('minted-access-token');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ── isFcmConfigured ──────────────────────────────────────────────────────────

describe('isFcmConfigured', () => {
  it('false when FIREBASE_SERVICE_ACCOUNT is unset', () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '');
    expect(isFcmConfigured()).toBe(false);
  });

  it('true when FIREBASE_SERVICE_ACCOUNT is set', () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);
    expect(isFcmConfigured()).toBe(true);
  });
});

// ── sendFcmMessage ───────────────────────────────────────────────────────────

describe('sendFcmMessage', () => {
  it('does nothing when FIREBASE_SERVICE_ACCOUNT is unset', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '');
    const result = await sendFcmMessage('tok', { title: 't', body: 'b' });
    expect(result).toEqual({ ok: false, unregistered: false });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockGetAccessToken).not.toHaveBeenCalled();
  });

  it('mints a token and posts to the project messages:send endpoint', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);
    mockFetch.mockResolvedValue(fetchResponse());

    const result = await sendFcmMessage('device-token-1', {
      title: 'Match in 24h',
      body: 'vs Omonia (H) — 19:00',
      data: { tag: 'reminder-24h', url: '/' },
    });

    expect(result).toEqual({ ok: true, unregistered: false });
    expect(mockGetAccessToken).toHaveBeenCalled();

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://fcm.googleapis.com/v1/projects/test-project/messages:send');
    expect(opts.headers.Authorization).toBe('Bearer minted-access-token');

    const body = JSON.parse(opts.body);
    expect(body.message.token).toBe('device-token-1');
    expect(body.message.notification).toEqual({ title: 'Match in 24h', body: 'vs Omonia (H) — 19:00' });
    expect(body.message.data).toEqual({ tag: 'reminder-24h', url: '/' });
  });

  it('coerces data values to strings (FCM v1 requirement)', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);
    mockFetch.mockResolvedValue(fetchResponse());

    await sendFcmMessage('tok', { title: 't', body: 'b', data: { hours: 24, skip: undefined } });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message.data).toEqual({ hours: '24' });
  });

  it('reports unregistered on 404/UNREGISTERED', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);
    mockFetch.mockResolvedValue(fetchResponse({
      ok: false, status: 404, json: { error: { status: 'UNREGISTERED' } },
    }));

    const result = await sendFcmMessage('dead-token', { title: 't', body: 'b' });
    expect(result.ok).toBe(false);
    expect(result.unregistered).toBe(true);
  });

  it('reports unregistered on plain 404 with a non-JSON body', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);
    mockFetch.mockResolvedValue({
      ok: false, status: 404, json: async () => { throw new Error('not json'); },
    });

    const result = await sendFcmMessage('dead-token', { title: 't', body: 'b' });
    expect(result.unregistered).toBe(true);
  });

  it('reports unregistered on 400/INVALID_ARGUMENT', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);
    mockFetch.mockResolvedValue(fetchResponse({
      ok: false, status: 400, json: { error: { status: 'INVALID_ARGUMENT' } },
    }));

    const result = await sendFcmMessage('malformed-token', { title: 't', body: 'b' });
    expect(result.unregistered).toBe(true);
  });

  it('does not report unregistered on other errors (403, 500)', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', SERVICE_ACCOUNT);

    mockFetch.mockResolvedValueOnce(fetchResponse({
      ok: false, status: 403, json: { error: { status: 'SENDER_ID_MISMATCH' } },
    }));
    let result = await sendFcmMessage('tok', { title: 't', body: 'b' });
    expect(result).toEqual({ ok: false, unregistered: false, statusCode: 403 });

    mockFetch.mockResolvedValueOnce(fetchResponse({
      ok: false, status: 500, json: { error: { status: 'INTERNAL' } },
    }));
    result = await sendFcmMessage('tok', { title: 't', body: 'b' });
    expect(result).toEqual({ ok: false, unregistered: false, statusCode: 500 });
  });
});
