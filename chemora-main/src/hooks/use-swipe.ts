import { useRef, useCallback, useEffect } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const SWIPE_THRESHOLD = 50; // minimum distance for a swipe
const SWIPE_TIMEOUT = 1000; // max time for a swipe gesture

export function useSwipe(handlers: SwipeHandlers, enabled = true) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const diffX = touchStartX.current - touchEndX;
      const diffY = touchStartY.current - touchEndY;
      const timeDiff = touchEndTime - touchStartTime.current;

      // Check if it's a swipe (not a scroll)
      if (Math.abs(diffX) > Math.abs(diffY) && timeDiff < SWIPE_TIMEOUT) {
        if (diffX > SWIPE_THRESHOLD && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        } else if (diffX < -SWIPE_THRESHOLD && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        }
      }
    },
    [handlers, enabled]
  );

  useEffect(() => {
    const element = document.documentElement;
    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}
