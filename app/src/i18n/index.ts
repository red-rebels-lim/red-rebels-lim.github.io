import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import el from './el.json';
import { detectLanguage } from './detectLanguage';

const defaultLng = detectLanguage(navigator.language);

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
