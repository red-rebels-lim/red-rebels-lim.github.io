import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('initAnalytics', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
    // Reset dataLayer
    (window as unknown as Record<string, unknown>).dataLayer = undefined;
    (window as unknown as Record<string, unknown>).gtag = undefined;
    (window as unknown as Record<string, unknown>).clarity = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('adds GA script when GA_ID is configured', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    vi.stubEnv('VITE_CLARITY_PROJECT_ID', '');

    // Re-import to get fresh module
    vi.resetModules();
    const { initAnalytics } = await import('@/lib/analytics');
    initAnalytics();

    expect(appendChildSpy).toHaveBeenCalled();
    expect(window.dataLayer).toBeDefined();
    expect(window.gtag).toBeDefined();
  });

  it('adds Clarity script when CLARITY_ID is configured', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    vi.stubEnv('VITE_CLARITY_PROJECT_ID', 'CLARITY123');

    vi.resetModules();
    const { initAnalytics } = await import('@/lib/analytics');
    initAnalytics();

    expect(appendChildSpy).toHaveBeenCalled();
    expect(window.clarity).toBeDefined();
  });

  it('invokes the Clarity stub function body when called after init', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    vi.stubEnv('VITE_CLARITY_PROJECT_ID', 'CLARITY123');

    vi.resetModules();
    const { initAnalytics } = await import('@/lib/analytics');
    initAnalytics();

    // Calling window.clarity() exercises the stub function body (lines 32-33)
    window.clarity!('set', 'key', 'value');
    expect((window.clarity as unknown as { q: unknown[][] }).q).toBeDefined();
  });

  it('does nothing when no IDs are configured', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    vi.stubEnv('VITE_CLARITY_PROJECT_ID', '');

    vi.resetModules();
    const { initAnalytics } = await import('@/lib/analytics');
    initAnalytics();

    expect(appendChildSpy).not.toHaveBeenCalled();
  });
});
