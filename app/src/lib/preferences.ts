import Parse from '@/lib/parse';

export interface NotifPrefs {
  notifyNewEvents: boolean;
  notifyTimeChanges: boolean;
  notifyScoreUpdates: boolean;
  reminderHours: number[];
  enabledSports: string[];
  disabled: boolean;
}

const DEFAULTS: NotifPrefs = {
  notifyNewEvents: true,
  notifyTimeChanges: true,
  notifyScoreUpdates: true,
  reminderHours: [24, 2],
  enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
  disabled: false,
};

export async function getPreferences(subscriptionId: string): Promise<NotifPrefs | null> {
  const NotifPreference = Parse.Object.extend('NotifPreference');
  const query = new Parse.Query(NotifPreference);
  const subPointer = Parse.Object.extend('PushSubscription').createWithoutData(subscriptionId);
  query.equalTo('subscription', subPointer);

  const result = await query.first();
  if (!result) return null;

  return {
    notifyNewEvents: result.get('notifyNewEvents') ?? DEFAULTS.notifyNewEvents,
    notifyTimeChanges: result.get('notifyTimeChanges') ?? DEFAULTS.notifyTimeChanges,
    notifyScoreUpdates: result.get('notifyScoreUpdates') ?? DEFAULTS.notifyScoreUpdates,
    reminderHours: result.get('reminderHours') ?? DEFAULTS.reminderHours,
    enabledSports: result.get('enabledSports') ?? DEFAULTS.enabledSports,
    disabled: result.get('disabled') ?? DEFAULTS.disabled,
  };
}

export async function updatePreferences(
  subscriptionId: string,
  prefs: Partial<NotifPrefs>
): Promise<void> {
  const NotifPreference = Parse.Object.extend('NotifPreference');
  const query = new Parse.Query(NotifPreference);
  const subPointer = Parse.Object.extend('PushSubscription').createWithoutData(subscriptionId);
  query.equalTo('subscription', subPointer);

  const result = await query.first();
  if (!result) return;

  for (const [key, value] of Object.entries(prefs)) {
    result.set(key, value);
  }
  await result.save();
}

export async function createDefaultPreferences(subscriptionId: string): Promise<void> {
  const NotifPreference = Parse.Object.extend('NotifPreference');
  const query = new Parse.Query(NotifPreference);
  const subPointer = Parse.Object.extend('PushSubscription').createWithoutData(subscriptionId);
  query.equalTo('subscription', subPointer);

  const existing = await query.first();
  if (existing) return; // Already has preferences

  const pref = new NotifPreference();
  pref.set('subscription', subPointer);
  pref.set('notifyNewEvents', DEFAULTS.notifyNewEvents);
  pref.set('notifyTimeChanges', DEFAULTS.notifyTimeChanges);
  pref.set('notifyScoreUpdates', DEFAULTS.notifyScoreUpdates);
  pref.set('reminderHours', DEFAULTS.reminderHours);
  pref.set('enabledSports', DEFAULTS.enabledSports);
  pref.set('disabled', DEFAULTS.disabled);
  await pref.save();
}
