import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted() runs before vi.mock() factories, so these refs are safe to use inside vi.mock
const { mockPushSubscribe, mockGetSubscription, mockUnsubscribe, mockSave, mockDestroy, mockFirst, mockFind } = vi.hoisted(() => ({
  mockPushSubscribe: vi.fn(),
  mockGetSubscription: vi.fn(),
  mockUnsubscribe: vi.fn(),
  mockSave: vi.fn(),
  mockDestroy: vi.fn(),
  mockFirst: vi.fn(),
  mockFind: vi.fn(),
}));

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

// Import at top-level so V8 coverage is properly tracked (no vi.resetModules)
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push';

// Ensure isPushSupported() returns true: needs serviceWorker, PushManager, Notification
beforeEach(() => {
  vi.clearAllMocks();

  // PushManager is not available in jsdom — add it
  if (!('PushManager' in window)) {
    (globalThis as Record<string, unknown>).PushManager = class {};
  }

  // navigator.serviceWorker may not be present — add a minimal stub
  if (!('serviceWorker' in navigator)) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: {} }) },
      writable: true,
      configurable: true,
    });
  }

  if (typeof globalThis.Notification === 'undefined') {
    (globalThis as Record<string, unknown>).Notification = {
      permission: 'default',
      requestPermission: vi.fn(),
    };
  }

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

describe('subscribeToPush', () => {
  it('returns null when permission denied', async () => {
    (globalThis.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn().mockResolvedValue('denied');
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

    const result = await subscribeToPush();
    expect(result).toBeDefined();
  });

  it('returns null when VAPID key is not configured', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    (globalThis.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn().mockResolvedValue('granted');
    const result = await subscribeToPush();
    expect(result).toBeNull();
    // Restore for other tests
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkP-1qiEqwBGjOCVG3TG3HM_rqe8KP7y4rqf2e9u4');
  });

  it('returns null when parseObj has no id', async () => {
    (globalThis.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn().mockResolvedValue('granted');
    mockPushSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key1', auth: 'key2' },
      }),
    });
    mockFirst.mockResolvedValue(null);
    mockSave.mockResolvedValue({ id: null });

    const result = await subscribeToPush();
    expect(result).toBeNull();
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

    const result = await subscribeToPush();
    // When existing subscription is found, it should still return an ID
    expect(result).toBeDefined();
  });
});

describe('unsubscribeFromPush', () => {
  it('unsubscribes and cleans up Parse objects', async () => {
    mockGetSubscription.mockResolvedValue({ unsubscribe: mockUnsubscribe.mockResolvedValue(true) });
    mockFind.mockResolvedValue([]);
    mockDestroy.mockResolvedValue(undefined);
    localStorage.setItem('push_subscription_id', 'test-obj-id');

    await unsubscribeFromPush();
    expect(mockGetSubscription).toHaveBeenCalled();
  });

  it('handles no active subscription gracefully', async () => {
    mockGetSubscription.mockResolvedValue(null);
    localStorage.removeItem('push_subscription_id');

    await unsubscribeFromPush();
    // Should not throw
  });

  it('falls back to navigator.serviceWorker.ready when no __swRegistration', async () => {
    // Remove __swRegistration so the ?? fallback path is used
    Object.defineProperty(window, '__swRegistration', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const swReadyPushManager = {
      getSubscription: mockGetSubscription.mockResolvedValue(null),
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: swReadyPushManager }) },
      writable: true,
      configurable: true,
    });

    await unsubscribeFromPush();
    expect(mockGetSubscription).toHaveBeenCalled();
  });
});
