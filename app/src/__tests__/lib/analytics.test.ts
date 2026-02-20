import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent } from '@/lib/analytics';

describe('trackEvent', () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls gtag with event action', () => {
    trackEvent('click_button');
    expect(window.gtag).toHaveBeenCalledWith('event', 'click_button', undefined);
  });

  it('calls gtag with event action and params', () => {
    trackEvent('view_page', { page: 'calendar' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'view_page', { page: 'calendar' });
  });

  it('does not throw when gtag is undefined', () => {
    window.gtag = undefined as unknown as typeof window.gtag;
    expect(() => trackEvent('test')).not.toThrow();
  });
});
