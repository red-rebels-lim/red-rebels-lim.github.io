import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

describe('useSwipeNavigation', () => {
  it('returns onTouchStart and onTouchEnd handlers', () => {
    const { result } = renderHook(() => useSwipeNavigation(vi.fn(), vi.fn()));
    expect(result.current).toHaveProperty('onTouchStart');
    expect(result.current).toHaveProperty('onTouchEnd');
    expect(typeof result.current.onTouchStart).toBe('function');
    expect(typeof result.current.onTouchEnd).toBe('function');
  });

  it('calls onLeft when swiping left beyond threshold', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onLeft, onRight, 50));

    const startEvent = { changedTouches: [{ screenX: 200 }] } as unknown as React.TouchEvent;
    const endEvent = { changedTouches: [{ screenX: 100 }] } as unknown as React.TouchEvent;

    result.current.onTouchStart(startEvent);
    result.current.onTouchEnd(endEvent);

    expect(onLeft).toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('calls onRight when swiping right beyond threshold', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onLeft, onRight, 50));

    const startEvent = { changedTouches: [{ screenX: 100 }] } as unknown as React.TouchEvent;
    const endEvent = { changedTouches: [{ screenX: 200 }] } as unknown as React.TouchEvent;

    result.current.onTouchStart(startEvent);
    result.current.onTouchEnd(endEvent);

    expect(onRight).toHaveBeenCalled();
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('does not trigger if swipe is below threshold', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onLeft, onRight, 50));

    const startEvent = { changedTouches: [{ screenX: 200 }] } as unknown as React.TouchEvent;
    const endEvent = { changedTouches: [{ screenX: 180 }] } as unknown as React.TouchEvent;

    result.current.onTouchStart(startEvent);
    result.current.onTouchEnd(endEvent);

    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('uses default threshold of 50', () => {
    const onLeft = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onLeft, vi.fn()));

    result.current.onTouchStart({ changedTouches: [{ screenX: 200 }] } as unknown as React.TouchEvent);
    result.current.onTouchEnd({ changedTouches: [{ screenX: 149 }] } as unknown as React.TouchEvent);

    expect(onLeft).toHaveBeenCalled();
  });
});
