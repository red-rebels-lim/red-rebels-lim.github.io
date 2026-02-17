import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import {
  isPushSupported,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  getStoredSubscriptionId,
  type PushStatus,
} from '@/lib/push';
import { getPreferences, updatePreferences, type NotifPrefs } from '@/lib/preferences';

const SPORTS = [
  { key: 'football-men', labelKey: 'sports.footballMen' },
  { key: 'volleyball-men', labelKey: 'sports.volleyballMen' },
  { key: 'volleyball-women', labelKey: 'sports.volleyballWomen' },
] as const;

const REMINDER_OPTIONS = [
  { hours: 24, labelKey: 'settings.reminder24h' },
  { hours: 12, labelKey: 'settings.reminder12h' },
  { hours: 2, labelKey: 'settings.reminder2h' },
  { hours: 1, labelKey: 'settings.reminder1h' },
] as const;

export default function SettingsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PushStatus>(() => getSubscriptionStatus());
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const supported = isPushSupported();

  // Load preferences
  useEffect(() => {
    const subId = getStoredSubscriptionId();
    if (subId) {
      getPreferences(subId).then(setPrefs).catch(console.error);
    }
  }, [status]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const id = await subscribeToPush();
      if (id) {
        setStatus('subscribed');
      } else if (Notification.permission === 'denied') {
        setStatus('denied');
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setStatus('unsubscribed');
      setPrefs(null);
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced save
  const savePrefs = useCallback(
    (updated: NotifPrefs) => {
      setPrefs(updated);
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(() => {
        const subId = getStoredSubscriptionId();
        if (subId) {
          updatePreferences(subId, updated).catch(console.error);
        }
      }, 800);
      setSaveTimeout(timeout);
    },
    [saveTimeout]
  );

  const togglePref = (key: keyof Pick<NotifPrefs, 'notifyNewEvents' | 'notifyTimeChanges' | 'notifyScoreUpdates' | 'disabled'>) => {
    if (!prefs) return;
    savePrefs({ ...prefs, [key]: !prefs[key] });
  };

  const toggleSport = (sport: string) => {
    if (!prefs) return;
    const sports = prefs.enabledSports.includes(sport)
      ? prefs.enabledSports.filter((s) => s !== sport)
      : [...prefs.enabledSports, sport];
    savePrefs({ ...prefs, enabledSports: sports });
  };

  const toggleReminder = (hours: number) => {
    if (!prefs) return;
    const reminders = prefs.reminderHours.includes(hours)
      ? prefs.reminderHours.filter((h) => h !== hours)
      : [...prefs.reminderHours, hours];
    savePrefs({ ...prefs, reminderHours: reminders });
  };

  const cardClass =
    'bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(224,37,32,0.2)] rounded-2xl p-6';

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>

        {/* Push Status */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.notifications')}</h2>

          {!supported ? (
            <p className="text-sm text-muted-foreground">{t('settings.notSupported')}</p>
          ) : status === 'denied' ? (
            <div className="space-y-2">
              <StatusBadge status="denied" label={t('settings.permissionDenied')} />
              <p className="text-sm text-muted-foreground">{t('settings.deniedHelp')}</p>
            </div>
          ) : status === 'subscribed' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status="subscribed" label={t('settings.enabled')} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,37,32,0.15)] text-foreground"
                >
                  {loading ? t('settings.processing') : t('settings.disable')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <StatusBadge status="unsubscribed" label={t('settings.disabled')} />
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-[#E02520] hover:bg-[#c41f1b] text-white font-semibold"
              >
                {loading ? t('settings.processing') : t('settings.enable')}
              </Button>
            </div>
          )}
        </div>

        {/* Preferences — only shown when subscribed */}
        {status === 'subscribed' && prefs && (
          <>
            {/* Master disable */}
            <div className={cardClass}>
              <ToggleRow
                label={t('settings.pauseAll')}
                description={t('settings.pauseAllDesc')}
                checked={!prefs.disabled}
                onChange={() => togglePref('disabled')}
              />
            </div>

            {/* Event Types */}
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.eventTypes')}</h2>
              <div className="space-y-3">
                <ToggleRow
                  label={t('settings.newEvents')}
                  checked={prefs.notifyNewEvents}
                  onChange={() => togglePref('notifyNewEvents')}
                />
                <ToggleRow
                  label={t('settings.timeChanges')}
                  checked={prefs.notifyTimeChanges}
                  onChange={() => togglePref('notifyTimeChanges')}
                />
                <ToggleRow
                  label={t('settings.scoreUpdates')}
                  checked={prefs.notifyScoreUpdates}
                  onChange={() => togglePref('notifyScoreUpdates')}
                />
              </div>
            </div>

            {/* Sports */}
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.sports')}</h2>
              <div className="space-y-3">
                {SPORTS.map(({ key, labelKey }) => (
                  <ToggleRow
                    key={key}
                    label={t(labelKey)}
                    checked={prefs.enabledSports.includes(key)}
                    onChange={() => toggleSport(key)}
                  />
                ))}
              </div>
            </div>

            {/* Reminders */}
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.reminders')}</h2>
              <div className="space-y-3">
                {REMINDER_OPTIONS.map(({ hours, labelKey }) => (
                  <ToggleRow
                    key={hours}
                    label={t(labelKey)}
                    checked={prefs.reminderHours.includes(hours)}
                    onChange={() => toggleReminder(hours)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* iOS tip */}
        {supported && /iPad|iPhone|iPod/.test(navigator.userAgent) && (
          <div className={cardClass}>
            <p className="text-sm text-muted-foreground">{t('settings.iosTip')}</p>
          </div>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status, label }: { status: PushStatus; label: string }) {
  const colors: Record<string, string> = {
    subscribed: 'bg-green-500/20 text-green-400 border-green-500/30',
    denied: 'bg-red-500/20 text-red-400 border-red-500/30',
    unsubscribed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    unsupported: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
      {label}
    </span>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-[#E02520]' : 'bg-zinc-600'
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
