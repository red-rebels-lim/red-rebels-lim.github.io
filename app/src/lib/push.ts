import Parse from '@/lib/parse';
import { createDefaultPreferences } from '@/lib/preferences';

const STORAGE_KEY = 'push_subscription_id';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export type PushStatus = 'subscribed' | 'unsubscribed' | 'denied' | 'unsupported';

export function getSubscriptionStatus(): PushStatus {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (localStorage.getItem(STORAGE_KEY)) return 'subscribed';
  return 'unsubscribed';
}

export async function subscribeToPush(): Promise<string | null> {
  if (!isPushSupported()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = window.__swRegistration ?? await navigator.serviceWorker.ready;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.error('VAPID public key not configured');
    return null;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
  });

  const json = subscription.toJSON();
  const keys = json.keys!;

  // Save to Back4App
  const PushSubscription = Parse.Object.extend('PushSubscription');

  // Check for existing subscription with same endpoint
  const query = new Parse.Query(PushSubscription);
  query.equalTo('endpoint', json.endpoint);
  const existing = await query.first();

  let parseObj: Parse.Object;
  if (existing) {
    existing.set('p256dh', keys.p256dh);
    existing.set('auth', keys.auth);
    parseObj = await existing.save();
  } else {
    const sub = new PushSubscription();
    sub.set('endpoint', json.endpoint);
    sub.set('p256dh', keys.p256dh);
    sub.set('auth', keys.auth);
    parseObj = await sub.save();
  }

  const objectId = parseObj.id;
  localStorage.setItem(STORAGE_KEY, objectId);

  // Create default preferences if they don't exist yet
  await createDefaultPreferences(objectId);

  return objectId;
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = window.__swRegistration ?? await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  const objectId = localStorage.getItem(STORAGE_KEY);
  if (objectId) {
    // Delete preferences first
    const NotifPreference = Parse.Object.extend('NotifPreference');
    const prefQuery = new Parse.Query(NotifPreference);
    const subPointer = Parse.Object.extend('PushSubscription').createWithoutData(objectId);
    prefQuery.equalTo('subscription', subPointer);
    const prefs = await prefQuery.find();
    await Parse.Object.destroyAll(prefs);

    // Delete subscription
    const PushSubscription = Parse.Object.extend('PushSubscription');
    const sub = PushSubscription.createWithoutData(objectId);
    await sub.destroy();

    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getStoredSubscriptionId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
