import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { initAnalytics } from '@/lib/analytics';
import App from './App.tsx';

initAnalytics();

// Register service worker for PWA + push notifications
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
        if (registration) {
          window.__swRegistration = registration;
        }
      },
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
