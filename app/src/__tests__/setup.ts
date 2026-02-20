import '@testing-library/jest-dom/vitest';

// React 19 requires this flag for act() to work properly in tests
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Node 22+ has a built-in localStorage that conflicts with jsdom's.
// Ensure we have a proper Storage implementation available.
if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.removeItem !== 'function')) {
  const store: Record<string, string> = {};
  const storage: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
  Object.defineProperty(window, 'localStorage', { value: storage, writable: true });
}
