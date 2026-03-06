import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function fireKey(key: string, target?: EventTarget) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  window.dispatchEvent(event);
}

describe('Task 20: useKeyboardShortcuts', () => {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  const onToday = vi.fn();
  const onToggleFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria', () => {
    it('should call onPrevious when ArrowLeft is pressed', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('ArrowLeft');
      expect(onPrevious).toHaveBeenCalledOnce();
    });

    it('should call onNext when ArrowRight is pressed', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('ArrowRight');
      expect(onNext).toHaveBeenCalledOnce();
    });

    it('should call onToday when "t" is pressed', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('t');
      expect(onToday).toHaveBeenCalledOnce();
    });

    it('should call onToday when "T" is pressed', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('T');
      expect(onToday).toHaveBeenCalledOnce();
    });

    it('should call onToggleFilters when "f" is pressed', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('f');
      expect(onToggleFilters).toHaveBeenCalledOnce();
    });

    it('should call onToggleFilters when "F" is pressed', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('F');
      expect(onToggleFilters).toHaveBeenCalledOnce();
    });

    it('should NOT fire shortcuts when target is an input element', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      const input = document.createElement('input');
      fireKey('ArrowLeft', input);
      fireKey('t', input);
      fireKey('f', input);
      expect(onPrevious).not.toHaveBeenCalled();
      expect(onToday).not.toHaveBeenCalled();
      expect(onToggleFilters).not.toHaveBeenCalled();
    });

    it('should NOT fire shortcuts when target is a textarea element', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      const textarea = document.createElement('textarea');
      fireKey('ArrowRight', textarea);
      fireKey('T', textarea);
      fireKey('F', textarea);
      expect(onNext).not.toHaveBeenCalled();
      expect(onToday).not.toHaveBeenCalled();
      expect(onToggleFilters).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should not crash when callbacks are undefined', () => {
      renderHook(() => useKeyboardShortcuts({}));
      expect(() => {
        fireKey('ArrowLeft');
        fireKey('ArrowRight');
        fireKey('t');
        fireKey('f');
      }).not.toThrow();
    });

    it('should ignore unrelated keys', () => {
      renderHook(() => useKeyboardShortcuts({ onPrevious, onNext, onToday, onToggleFilters }));
      fireKey('a');
      fireKey('Enter');
      fireKey('Escape');
      expect(onPrevious).not.toHaveBeenCalled();
      expect(onNext).not.toHaveBeenCalled();
      expect(onToday).not.toHaveBeenCalled();
      expect(onToggleFilters).not.toHaveBeenCalled();
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts({ onPrevious }));
      unmount();
      fireKey('ArrowLeft');
      expect(onPrevious).not.toHaveBeenCalled();
    });
  });
});
