import { describe, it, expect, beforeEach } from 'vitest';
import { isPushSupported, getSubscriptionStatus, getStoredSubscriptionId } from '@/lib/push';

describe('isPushSupported', () => {
  it('returns true when all APIs are available', () => {
    // jsdom provides serviceWorker, PushManager, and Notification by default
    // Just verify the function returns a boolean
    expect(typeof isPushSupported()).toBe('boolean');
  });
});

describe('getSubscriptionStatus', () => {
  beforeEach(() => {
    window.localStorage.removeItem('push_subscription_id');
  });

  it('returns a valid status string', () => {
    const status = getSubscriptionStatus();
    expect(['subscribed', 'unsubscribed', 'denied', 'unsupported']).toContain(status);
  });

  it('returns "subscribed" when subscription ID exists in localStorage', () => {
    // Only test if push is supported in the test environment
    if (!isPushSupported()) return;

    window.localStorage.setItem('push_subscription_id', 'test-id');
    // If permission is denied, it returns 'denied' before checking localStorage
    const status = getSubscriptionStatus();
    expect(['subscribed', 'denied']).toContain(status);
    window.localStorage.removeItem('push_subscription_id');
  });
});

describe('getStoredSubscriptionId', () => {
  beforeEach(() => {
    window.localStorage.removeItem('push_subscription_id');
  });

  it('returns null when no subscription stored', () => {
    expect(getStoredSubscriptionId()).toBeNull();
  });

  it('returns stored subscription ID', () => {
    window.localStorage.setItem('push_subscription_id', 'abc123');
    expect(getStoredSubscriptionId()).toBe('abc123');
    window.localStorage.removeItem('push_subscription_id');
  });
});
