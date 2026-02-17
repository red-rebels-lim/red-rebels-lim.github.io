/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'parse/dist/parse.min.js' {
  import Parse from 'parse';
  export default Parse;
}

interface ImportMetaEnv {
  readonly VITE_BACK4APP_APP_ID: string;
  readonly VITE_BACK4APP_JS_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_CLARITY_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __swRegistration?: ServiceWorkerRegistration;
}
