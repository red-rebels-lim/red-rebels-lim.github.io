declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;

export function initAnalytics() {
  // Google Analytics 4
  if (GA_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  // Microsoft Clarity
  if (CLARITY_ID) {
    window.clarity = window.clarity || function () {
      // eslint-disable-next-line prefer-rest-params
      (window.clarity as unknown as { q: IArguments[] }).q = (window.clarity as unknown as { q: IArguments[] }).q || [];
      // eslint-disable-next-line prefer-rest-params
      (window.clarity as unknown as { q: IArguments[] }).q.push(arguments);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
    document.head.appendChild(script);
  }
}

export function trackEvent(action: string, params?: Record<string, string | number>) {
  window.gtag?.('event', action, params);
}
