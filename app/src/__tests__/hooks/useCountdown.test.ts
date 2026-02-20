import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '@/hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string when targetTimestamp is null', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBe('');
  });

  it('returns empty string when target is in the past', () => {
    const pastTimestamp = Date.now() - 60000;
    const { result } = renderHook(() => useCountdown(pastTimestamp));
    expect(result.current).toBe('');
  });

  it('shows days and hours when more than 1 day away', () => {
    const future = Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000; // 2d 3h
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current).toBe('\u23F1 2d 3h');
  });

  it('shows hours and minutes when less than 1 day away', () => {
    const future = Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000; // 5h 30m
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current).toBe('\u23F1 5h 30m');
  });

  it('shows only minutes when less than 1 hour away', () => {
    const future = Date.now() + 45 * 60 * 1000; // 45m
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current).toBe('\u23F1 45m');
  });

  it('updates countdown on interval tick', () => {
    const future = Date.now() + 60 * 60 * 1000 + 30 * 60 * 1000; // 1h 30m
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current).toBe('\u23F1 1h 30m');

    // Advance 10 seconds (the interval period)
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should still show roughly the same (within the same minute)
    expect(result.current).toMatch(/\u23F1 1h \d+m/);
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const future = Date.now() + 60 * 60 * 1000;
    const { unmount } = renderHook(() => useCountdown(future));

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
