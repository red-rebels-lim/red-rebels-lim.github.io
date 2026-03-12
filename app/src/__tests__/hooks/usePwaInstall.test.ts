import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { usePwaInstall } from '@/hooks/usePwaInstall';

describe('usePwaInstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with canInstall false', () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it('sets canInstall true on beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePwaInstall());
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    expect(result.current.canInstall).toBe(true);
  });

  it('clears canInstall on appinstalled event', () => {
    const { result } = renderHook(() => usePwaInstall());
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    expect(result.current.canInstall).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(result.current.canInstall).toBe(false);
  });

  it('promptInstall is a no-op when no prompt available', async () => {
    const { result } = renderHook(() => usePwaInstall());
    // Should not throw
    await act(async () => {
      await result.current.promptInstall();
    });
    expect(result.current.canInstall).toBe(false);
  });

  it('clears prompt on accepted outcome', async () => {
    const { result } = renderHook(() => usePwaInstall());

    const mockPrompt = vi.fn();
    const mockEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    Object.assign(mockEvent, {
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.promptInstall();
    });
    expect(mockPrompt).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(false);
  });

  it('keeps prompt on dismissed outcome', async () => {
    const { result } = renderHook(() => usePwaInstall());

    const mockEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    Object.assign(mockEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });
    expect(result.current.canInstall).toBe(true);
  });

  it('clears prompt on error during promptInstall', async () => {
    const { result } = renderHook(() => usePwaInstall());

    const mockEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    Object.assign(mockEvent, {
      prompt: vi.fn(() => { throw new Error('fail'); }),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });
    expect(result.current.canInstall).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => usePwaInstall());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    removeSpy.mockRestore();
  });
});
