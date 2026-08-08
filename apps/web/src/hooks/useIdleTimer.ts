import { useEffect, useRef } from 'react';

type UseIdleTimerProps = {
  timeout: number; // in milliseconds
  onIdle: () => void;
};

export const useIdleTimer = ({ timeout, onIdle }: UseIdleTimerProps) => {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      onIdle();
    }, timeout);
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousemove',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove',
      'MSPointerDown',
      'MSPointerMove',
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize the timer
    resetTimer();

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeout, onIdle]);
};
