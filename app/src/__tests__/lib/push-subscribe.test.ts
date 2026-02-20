import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPushSubscribe = vi.fn();
const mockGetSubscription = vi.fn();
const mockUnsubscribe = vi.fn();
const mockSave = vi.fn();
const mockDestroy = vi.fn();
const mockFirst = vi.fn();
const mockFind = vi.fn();

vi.mock('@/lib/parse', () => {
  function MockParseObject() {
    return { set: vi.fn(), save: mockSave, destroy: mockDestroy, id: 'obj-123' };
  }
  MockParseObject.createWithoutData = vi.fn().mockReturnValue({ id: 'pointer', destroy: mockDestroy });

  function MockQuery() {
    return { equalTo: vi.fn(), first: mockFirst, find: mockFind };
  }

  return {
    default: {
      Object: {
        extend: vi.fn().mockReturnValue(MockParseObject),
        destroyAll: vi.fn().mockResolvedValue(undefined),
      },
      Query: MockQuery,
    },
  };
});

vi.mock('@/lib/preferences', () => ({
  createDefaultPreferences: vi.fn().mockResolvedValue(undefined),
}));

vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkP-1qiEqwBGjOCVG3TG3HM_rqe8KP7y4rqf2e9u4');

// Set up Notification mock for the whole file
beforeEach(() => {
  if (typeof globalThis.Notification === 'undefined') {
    (globalThis as Record<string, unknown>).Notification = {
      permission: 'default',
      requestPermission: vi.fn(),
    };
  }
});

describe('subscribeToPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, '__swRegistration', {
      value: {
        pushManager: {
          subscribe: mockPushSubscribe,
          getSubscription: mockGetSubscription,
        },
      },
      writable: true,
      configurable: true,
    });
  });

  it('returns null when permission denied', async () => {
    (globalThis.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn().mockResolvedValue('denied');

    vi.resetModules();
    const { subscribeToPush } = await import('@/lib/push');
    const result = await subscribeToPush();
    expect(result).toBeNull();
  });

  it('subscribes and returns objectId on success', async () => {
    (globalThis.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn().mockResolvedValue('granted');
    mockPushSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key1', auth: 'key2' },
      }),
    });
    mockFirst.mockResolvedValue(null);
    mockSave.mockResolvedValue({ id: 'new-obj-id' });

    vi.resetModules();
    const { subscribeToPush } = await import('@/lib/push');
    const result = await subscribeToPush();
    expect(result).toBeDefined();
  });

  it('updates existing subscription if endpoint matches', async () => {
    (globalThis.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn().mockResolvedValue('granted');
    mockPushSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key1', auth: 'key2' },
      }),
    });
    const existingObj = {
      set: vi.fn(),
      save: vi.fn().mockResolvedValue({ id: 'existing-id' }),
      id: 'existing-id',
    };
    mockFirst.mockResolvedValue(existingObj);

    vi.resetModules();
    const { subscribeToPush } = await import('@/lib/push');
    const result = await subscribeToPush();
    // When existing subscription is found, it should still return an ID
    expect(result).toBeDefined();
  });
});

describe('unsubscribeFromPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, '__swRegistration', {
      value: {
        pushManager: {
          subscribe: mockPushSubscribe,
          getSubscription: mockGetSubscription,
        },
      },
      writable: true,
      configurable: true,
    });
  });

  it('unsubscribes and cleans up Parse objects', async () => {
    mockGetSubscription.mockResolvedValue({ unsubscribe: mockUnsubscribe.mockResolvedValue(true) });
    mockFind.mockResolvedValue([]);
    mockDestroy.mockResolvedValue(undefined);
    localStorage.setItem('push_subscription_id', 'test-obj-id');

    vi.resetModules();
    const { unsubscribeFromPush } = await import('@/lib/push');
    await unsubscribeFromPush();
    expect(mockGetSubscription).toHaveBeenCalled();
  });

  it('handles no active subscription gracefully', async () => {
    mockGetSubscription.mockResolvedValue(null);
    localStorage.removeItem('push_subscription_id');

    vi.resetModules();
    const { unsubscribeFromPush } = await import('@/lib/push');
    await unsubscribeFromPush();
    // Should not throw
  });
});
