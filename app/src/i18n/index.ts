import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import el from './el.json';

// Map legacy 'gr' key to 'el'
const savedLang = localStorage.getItem('language');
const defaultLng = savedLang === 'gr' ? 'el' : savedLang || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    el: { translation: el },
  },
  lng: defaultLng,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
