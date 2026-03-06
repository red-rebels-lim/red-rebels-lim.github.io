/**
 * Detect the initial language for the app.
 * Priority: saved localStorage preference > browser language > 'en' fallback.
 */
export function detectLanguage(browserLanguage: string): string {
  const saved = localStorage.getItem('language');
  if (saved) {
    return saved === 'gr' ? 'el' : saved;
  }
  if (browserLanguage && browserLanguage.startsWith('el')) {
    return 'el';
  }
  return 'en';
}
