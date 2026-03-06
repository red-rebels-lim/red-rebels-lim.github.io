import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('logError', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('calls console.error in dev mode', async () => {
    vi.stubEnv('DEV', true);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logError } = await import('@/lib/logger');
    logError('test message', { detail: 1 });
    expect(spy).toHaveBeenCalledWith('test message', { detail: 1 });
    vi.unstubAllEnvs();
  });

  it('does not call console.error in production mode', async () => {
    vi.stubEnv('DEV', false);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logError } = await import('@/lib/logger');
    logError('should be silent');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
