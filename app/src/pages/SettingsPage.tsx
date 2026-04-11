import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useVisualTheme, type VisualTheme } from '@/hooks/useVisualTheme';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
  isPushSupported,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  getStoredSubscriptionId,
  type PushStatus,
} from '@/lib/push';
import { getPreferences, updatePreferences, type NotifPrefs } from '@/lib/preferences';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToCalendar } from '@/lib/ics-export';
import { trackEvent } from '@/lib/analytics';
import { logError } from '@/lib/logger';

// ── Reusable components ─────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-3 inline-block ml-1 px-2 py-0.5 rounded bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none">
        {title}
      </h3>
      <div className="bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent">
        {children}
      </div>
    </div>
  );
}

function SettingsToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-all duration-200 ${
        checked ? 'justify-end bg-[#dc2828]' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-transform duration-200" />
    </button>
  );
}

function ReminderChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors min-h-[36px] ${
        active
          ? 'bg-primary text-white'
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  labelClass?: string;
  value?: string;
  hasChevron?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
  isLast?: boolean;
}

function SettingsRow({ icon, iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400', label, labelClass, value, hasChevron, trailing, onClick, isLast }: SettingsRowProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      className={`flex items-center gap-4 px-4 min-h-[56px] justify-between w-full ${
        !isLast ? 'border-b border-slate-100 dark:border-slate-700/50' : ''
      } ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center rounded-lg shrink-0 size-10 ${iconBg}`}>
          {icon}
        </div>
        <p className={`text-base font-medium leading-normal flex-1 truncate ${labelClass || ''}`}>{label}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <p className="text-sm font-normal leading-normal text-slate-500 dark:text-slate-400">{value}</p>
        )}
        {hasChevron && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" aria-hidden="true">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {trailing}
      </div>
    </Wrapper>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15 15 0 0 0 0 20M12 2a15 15 0 0 1 0 20M2 12h20" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function FootballIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M255.03 33.813c-1.834-.007-3.664-.007-5.5.03-6.73.14-13.462.605-20.155 1.344.333.166.544.32.47.438L204.78 75.063l73.907 49.437-.125.188 70.625.28L371 79.282 342.844 52c-15.866-6.796-32.493-11.776-49.47-14.78-12.65-2.24-25.497-3.36-38.343-3.407zM190.907 88.25l-73.656 36.78-13.813 98.407 51.344 33.657 94.345-43.438 14.875-76.5-73.094-48.906zm196.344.344l-21.25 44.5 36.75 72.72 62.063 38.905 11.312-21.282c.225.143.45.403.656.75-.77-4.954-1.71-9.893-2.81-14.782-6.446-28.59-18.59-55.962-35.5-79.97-9.07-12.872-19.526-24.778-31.095-35.5l-20.125-5.342zm-302.656 23c-6.906 8.045-13.257 16.56-18.938 25.5-15.676 24.664-26.44 52.494-31.437 81.312C31.783 232.446 30.714 246.73 31 261l20.25 5.094 33.03-40.5L98.75 122.53l-14.156-10.936zm312.719 112.844l-55.813 44.75-3.47 101.093 39.626 21.126 77.188-49.594 4.406-78.75-.094.157-61.844-38.783zm-140.844 6.406l-94.033 43.312-1.218 76.625 89.155 57.376 68.938-36.437 3.437-101.75-66.28-39.126zm-224.22 49.75c.91 8.436 2.29 16.816 4.156 25.094 6.445 28.59 18.62 55.96 35.532 79.968 3.873 5.5 8.02 10.805 12.374 15.938l-9.374-48.156.124-.032-27.03-68.844-15.782-3.968zm117.188 84.844l-51.532 8.156 10.125 52.094c8.577 7.49 17.707 14.332 27.314 20.437 14.612 9.287 30.332 16.88 46.687 22.594l62.626-13.69-4.344-31.124-90.875-58.47zm302.437.5l-64.22 41.25-42 47.375 4.408 6.156c12.027-5.545 23.57-12.144 34.406-19.72 23.97-16.76 44.604-38.304 60.28-62.97 2.51-3.947 4.87-7.99 7.125-12.092zm-122.78 97.656l-79.94 9.625-25.968 5.655c26.993 4 54.717 3.044 81.313-2.813 9.412-2.072 18.684-4.79 27.75-8.062l-3.156-4.406z" />
    </svg>
  );
}

function VolleyballIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 407.021 407.021" fill="currentColor" aria-hidden="true">
      <path d="M203.323,0c-22.188,0-44.173,3.651-65.346,10.853c-20.882,7.106-40.301,17.429-57.717,30.683 c-69.719,53.059-97.588,144.46-69.35,227.44c17.492,51.464,53.977,93.018,102.732,117.007c28.327,13.959,58.5,21.038,89.682,21.039 c0.001,0,0.007,0,0.008,0c22.243,0,44.351-3.681,65.713-10.942c20.88-7.104,40.304-17.432,57.73-30.693 c69.711-53.054,97.575-144.45,69.334-227.429C368.041,55.44,290.565,0,203.323,0z M223.014,44.855 c2.916-2.218,5.921-4.422,8.932-6.55l2.337-1.652l2.804,0.57c13.714,2.778,27.099,7.269,39.781,13.347l9.257,4.436l-7.856,6.609 c-65.569,55.148-78.947,111.623-81.086,140.377l-0.316,4.222l-3.96,1.488c-7.51,2.824-15.628,4.255-24.127,4.255 c-9.49,0-19.639-1.783-30.165-5.3l-4.495-1.502l-0.03-4.741C133.958,179.899,139.986,108.044,223.014,44.855z M47.079,137.765 c11.536-27.453,30.082-51.437,53.632-69.359c14.56-11.08,30.764-19.69,48.164-25.593c5.162-1.765,10.725-3.354,16.531-4.719 l22.376-5.266l-16.141,16.366c-47.471,48.128-62.472,97.256-66.697,129.994l-1.388,10.74l-8.931-6.124 c-19.268-13.211-35.716-28.386-46.122-38.79l-3.148-3.148L47.079,137.765z M40.998,251.928l-0.718-2.54 c-5.585-19.759-7.538-40.106-5.804-60.476l1.117-13.101l9.865,8.692c24.67,21.737,73.522,58.204,123.524,58.204 c14.167,0,27.715-2.922,40.266-8.687l3.138-1.44l2.979,1.748c14.843,8.709,28.282,18.883,39.945,30.238l5.988,5.832l-7.043,4.5 c-14.506,9.262-39.18,20.436-74.354,21.068c-1.042,0.02-2.092,0.027-3.14,0.027c-41.043,0-85.958-14.373-133.497-42.717 L40.998,251.928z M298.867,343.746c-12.746,8.673-26.445,15.526-40.719,20.372c-17.807,6.062-36.249,9.139-54.813,9.139 c-25.989,0-51.146-5.898-74.774-17.531c-18.458-9.089-34.916-21.271-48.917-36.208L59.87,298.423l26.987,10.381 c31.207,12.004,61.478,18.091,89.973,18.091c46.053,0,78.588-15.668,97.771-28.812l5.705-3.904l3.66,5.859 c7.154,11.455,13.014,23.574,17.418,36.021l1.703,4.813L298.867,343.746z M360.992,266.742 c-6.417,16.033-15.229,30.951-26.192,44.338l-6.777,8.277l-4.389-9.755c-13.185-29.289-39.941-70.68-92.537-101.539l-3.629-2.13 l0.384-4.189c1.065-11.571,4.759-29.984,16.308-51.995l2.813-5.36l5.591,2.318c26.511,10.985,75.838,40.522,108.35,114.922 l1.108,2.541L360.992,266.742z M360.824,198.522c-29.794-42.697-64.423-65.068-88.227-76.316l-7.943-3.754l5.792-6.605 c10.655-12.142,23.38-23.922,37.821-35.014l4.354-3.346l4.095,3.662c21.682,19.379,38.089,44.169,47.444,71.689 c4.93,14.447,7.86,29.769,8.713,45.537l1.25,23.206L360.824,198.522z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function SmartphoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const SPORT_FILTERS_KEY = 'sport_filters';

function getSportFilters(): { football: boolean; volleyball: boolean } {
  try {
    const stored = localStorage.getItem(SPORT_FILTERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { football: true, volleyball: true };
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { theme: visualTheme, setTheme: setVisualTheme, themes: visualThemes } = useVisualTheme();
  const { canInstall, promptInstall } = usePwaInstall();

  const themeLabels: Record<VisualTheme, string> = {
    default: t('settings.themeDefault'),
    brutalism: t('settings.themeBrutalism'),
    cinema: t('settings.themeCinema'),
    neon: t('settings.themeNeon'),
  };

  const handleThemeSelect = (value: string) => {
    setVisualTheme(value as VisualTheme);
    trackEvent('change_visual_theme', { theme: value });
    // Force reload so all components re-render with the new theme's tokens
    window.location.reload();
  };

  // Sport filter state
  const [sportFilters, setSportFilters] = useState(() => getSportFilters());

  const toggleSportFilter = (sport: 'football' | 'volleyball') => {
    const next = { ...sportFilters, [sport]: !sportFilters[sport] };
    // Don't allow both to be turned off
    if (!next.football && !next.volleyball) return;
    setSportFilters(next);
    localStorage.setItem(SPORT_FILTERS_KEY, JSON.stringify(next));
    trackEvent('toggle_sport_filter', { sport, enabled: next[sport] ? 'true' : 'false' });
  };

  // Push notification state
  const [status, setStatus] = useState<PushStatus>(() => getSubscriptionStatus());
  const [loading, setLoading] = useState(false);
  const [pushError, setPushError] = useState(false);
  const supported = isPushSupported();

  const handleSubscribe = async () => {
    setLoading(true);
    setPushError(false);
    try {
      const id = await subscribeToPush();
      if (id) {
        setStatus('subscribed');
      } else if (Notification.permission === 'denied') {
        setStatus('denied');
      } else {
        setPushError(true);
      }
    } catch (err) {
      logError('Failed to subscribe:', err);
      setPushError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm(t('settings.confirmUnsubscribe'))) return;
    setLoading(true);
    setPushError(false);
    try {
      await unsubscribeFromPush();
      setStatus('unsubscribed');
    } catch (err) {
      logError('Failed to unsubscribe:', err);
      setPushError(true);
    } finally {
      setLoading(false);
    }
  };

  const isSubscribed = status === 'subscribed';

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs | null>(null);

  const loadPrefs = useCallback(async () => {
    const subId = getStoredSubscriptionId();
    if (!subId) return;
    try {
      const prefs = await getPreferences(subId);
      if (prefs) setNotifPrefs(prefs);
    } catch (err) {
      logError('Failed to load preferences:', err);
    }
  }, []);

  useEffect(() => {
    if (isSubscribed) loadPrefs();
  }, [isSubscribed, loadPrefs]);

  const updatePref = async (update: Partial<NotifPrefs>) => {
    const subId = getStoredSubscriptionId();
    if (!subId || !notifPrefs) return;
    const next = { ...notifPrefs, ...update };
    setNotifPrefs(next);
    try {
      await updatePreferences(subId, update);
    } catch (err) {
      logError('Failed to save preference:', err);
      setNotifPrefs(notifPrefs); // revert on error
    }
  };

  const toggleReminderHour = (hour: number) => {
    if (!notifPrefs) return;
    const current = notifPrefs.reminderHours;
    const next = current.includes(hour)
      ? current.filter(h => h !== hour)
      : [...current, hour].sort((a, b) => b - a);
    if (next.length === 0) return; // must keep at least one
    updatePref({ reminderHours: next });
  };

  const toggleNotifSport = (sport: string) => {
    if (!notifPrefs) return;
    const current = notifPrefs.enabledSports;
    const next = current.includes(sport)
      ? current.filter(s => s !== sport)
      : [...current, sport];
    if (next.length === 0) return; // must keep at least one
    updatePref({ enabledSports: next });
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'el' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang === 'el' ? 'gr' : 'en');
    trackEvent('toggle_language', { language: newLang });
  };

  const currentLanguageLabel = i18n.language === 'el' ? t('settings.languageGreek') : t('settings.languageEnglish');

  return (
    <div className="w-full mx-auto pb-24">
      <MobileHeader showBack />

      <h1 className="sr-only">{t('nav.settings')}</h1>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* ── NOTIFICATIONS ── */}
        <SettingsSection title={t('settings.notifications')}>
          {!supported ? (
            <div className="px-4 py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.notSupported')}</p>
            </div>
          ) : status === 'denied' ? (
            <div className="px-4 py-4 space-y-2">
              <p className="text-sm font-semibold text-red-500">{t('settings.permissionDenied')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.deniedHelp')}</p>
            </div>
          ) : (
            <>
              <SettingsRow
                icon={<BellIcon />}
                iconBg="bg-[#dc2828]/10 text-[#dc2828]"
                label={t('settings.matchReminders')}
                trailing={
                  loading ? (
                    <div className="size-5 border-2 border-[#dc2828] border-t-transparent rounded-full animate-spin" role="status"><span className="sr-only">Loading...</span></div>
                  ) : (
                    <SettingsToggle
                      checked={isSubscribed}
                      onChange={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    />
                  )
                }
              />
              {pushError && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-red-500">{t('settings.pushError', 'Failed to update notifications. Please try again.')}</p>
                </div>
              )}

              {/* Expanded preferences (only when subscribed and prefs loaded) */}
              {isSubscribed && notifPrefs && (
                <>
                  {/* Reminder times */}
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {t('settings.reminderTimes')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[{ hour: 24, label: '24h' }, { hour: 12, label: '12h' }, { hour: 2, label: '2h' }, { hour: 1, label: '1h' }].map(({ hour, label }) => (
                        <ReminderChip
                          key={hour}
                          label={label}
                          active={notifPrefs.reminderHours.includes(hour)}
                          onToggle={() => toggleReminderHour(hour)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sports */}
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {t('sports.title', 'Sports')}
                    </p>
                    <div className="space-y-1">
                      {[
                        { key: 'football-men', label: t('sports.footballMen') },
                        { key: 'volleyball-men', label: t('sports.volleyballMen') },
                        { key: 'volleyball-women', label: t('sports.volleyballWomen') },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between py-1.5">
                          <span className="text-sm font-medium">{label}</span>
                          <SettingsToggle
                            checked={notifPrefs.enabledSports.includes(key)}
                            onChange={() => toggleNotifSport(key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alert types */}
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {t('settings.alertTypes')}
                    </p>
                    <div className="space-y-1">
                      {[
                        { key: 'notifyNewEvents' as const, label: t('settings.newEvents') },
                        { key: 'notifyTimeChanges' as const, label: t('settings.timeChanges') },
                        { key: 'notifyScoreUpdates' as const, label: t('settings.scoreUpdates') },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between py-1.5">
                          <span className="text-sm font-medium">{label}</span>
                          <SettingsToggle
                            checked={notifPrefs[key]}
                            onChange={() => updatePref({ [key]: !notifPrefs[key] })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Fallback: show static reminder time when not subscribed */}
              {!isSubscribed && (
                <SettingsRow
                  icon={<ClockIcon />}
                  label={t('settings.reminderTime')}
                  value={t('settings.reminderDefault', '24h & 2h before')}
                  isLast
                />
              )}
            </>
          )}
        </SettingsSection>

        {/* ── VISUAL THEME ── */}
        <SettingsSection title={t('settings.visualTheme')}>
          <div data-tour="theme" className="flex items-center gap-4 px-4 min-h-[56px] justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg shrink-0 size-10 bg-[#dc2828]/10 text-[#dc2828]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="8" cy="21" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9c0 1.66.45 3.21 1.24 4.54" />
                </svg>
              </div>
              <p className="text-base font-medium">{t('settings.visualTheme')}</p>
            </div>
            <Select value={visualTheme} onValueChange={handleThemeSelect}>
              <SelectTrigger className="w-[140px] bg-slate-100 dark:bg-white/5 border-primary-border-subtle text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-surface-dark border-primary-border">
                {visualThemes.map((t_key) => (
                  <SelectItem key={t_key} value={t_key}>{themeLabels[t_key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsSection>

        {/* ── DISPLAY ── */}
        <SettingsSection title={t('settings.display')}>
          <SettingsRow
            icon={<GlobeIcon />}
            label={t('settings.language')}
            value={currentLanguageLabel}
            hasChevron
            onClick={toggleLanguage}
          />
          <SettingsRow
            icon={<MoonIcon />}
            label={t('settings.darkTheme')}
            trailing={
              <SettingsToggle
                checked={isDark}
                onChange={() => { toggleTheme(); trackEvent('toggle_theme', { theme: isDark ? 'light' : 'dark' }); }}
              />
            }
            isLast
          />
        </SettingsSection>

        {/* ── SPORTS FILTER ── */}
        <SettingsSection title={t('settings.sportsFilter')}>
          <SettingsRow
            icon={<FootballIcon />}
            iconBg="bg-[#dc2828]/10 text-[#dc2828]"
            label={t('settings.football')}
            trailing={<SettingsToggle checked={sportFilters.football} onChange={() => toggleSportFilter('football')} />}
          />
          <SettingsRow
            icon={<VolleyballIcon />}
            iconBg="bg-[#dc2828]/10 text-[#dc2828]"
            label={t('settings.volleyball')}
            trailing={<SettingsToggle checked={sportFilters.volleyball} onChange={() => toggleSportFilter('volleyball')} />}
            isLast
          />
        </SettingsSection>

        {/* ── TOOLS ── */}
        <SettingsSection title={t('settings.tools')}>
          <SettingsRow
            icon={<DownloadIcon />}
            label={t('settings.exportCalendar')}
            onClick={() => { exportToCalendar(); trackEvent('export_calendar'); }}
          />
          <SettingsRow
            icon={<PrinterIcon />}
            label={t('settings.printCalendar')}
            onClick={() => { window.print(); trackEvent('print_calendar'); }}
            isLast={!canInstall}
          />
          {canInstall && (
            <SettingsRow
              icon={<SmartphoneIcon />}
              label={t('settings.installApp')}
              onClick={promptInstall}
              isLast
            />
          )}
        </SettingsSection>

        {/* ── ABOUT ── */}
        <SettingsSection title={t('settings.about')}>
          <SettingsRow
            icon={<InfoIcon />}
            label={t('settings.appVersion')}
            value={`v${__APP_VERSION__}`}
          />
          <div>
            <a
              href="https://github.com/red-rebels-lim/red-rebels-lim.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-lg shrink-0 size-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <CodeIcon />
                </div>
                <p className="text-base font-medium leading-normal flex-1 truncate text-[#dc2828]">
                  {t('settings.viewOnGithub')}
                </p>
              </div>
              <div className="shrink-0">
                <ExternalLinkIcon />
              </div>
            </a>
          </div>
        </SettingsSection>

        {/* ── Footer ── */}
        <div className="pb-10 pt-8 text-center">
          <p className="text-xs text-slate-500">{t('settings.madeWith')}</p>
        </div>
      </div>
    </div>
  );
}
