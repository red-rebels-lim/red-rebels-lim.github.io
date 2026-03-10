import { useRef, useCallback } from 'react';

export function useSwipeNavigation(onLeft: () => void, onRight: () => void, threshold = 50) {
  const startX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.changedTouches[0].screenX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Don't navigate months while a dialog/modal is open
      if (document.querySelector('[role="dialog"]')) return;

      const endX = e.changedTouches[0].screenX;
      if (endX < startX.current - threshold) onLeft();
      if (endX > startX.current + threshold) onRight();
    },
    [onLeft, onRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
