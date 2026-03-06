import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onToggleFilters?: () => void;
}

export function useKeyboardShortcuts({
  onPrevious,
  onNext,
  onToday,
  onToggleFilters,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 't':
        case 'T':
          onToday?.();
          break;
        case 'f':
        case 'F':
          onToggleFilters?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPrevious, onNext, onToday, onToggleFilters]);
}
