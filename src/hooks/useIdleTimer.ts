import { useEffect, useRef, useCallback, useState } from 'react';

const STORAGE_LAST_ACTIVITY = 'sghd_last_activity';
const DEFAULT_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface UseIdleTimerOptions {
  timeoutMs?: number;
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutMs = DEFAULT_IDLE_TIMEOUT,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const [lastActivity, setLastActivity] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LAST_ACTIVITY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return Date.now();
  });

  const lastActivityRef = useRef(lastActivity);
  lastActivityRef.current = lastActivity;

  // Throttled record activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    // throttle to update at most once every 2 seconds
    if (now - lastActivityRef.current < 2000) {
      return;
    }
    lastActivityRef.current = now;
    setLastActivity(now);
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVITY, now.toString());
    } catch {
      // ignore
    }
  }, []);

  const triggerIdle = useCallback(() => {
    onIdleRef.current();
  }, []);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(now);
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVITY, now.toString());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Check immediately if we were already idle when tab loads/reopens
    const checkIdle = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        onIdleRef.current();
      }
    };

    // Periodic check every 10 seconds
    const interval = setInterval(checkIdle, 10000);

    // Also check immediately
    checkIdle();

    // Event listeners to register user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleUserActivity = () => {
      recordActivity();
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const stored = localStorage.getItem(STORAGE_LAST_ACTIVITY);
          if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed > 0) {
              lastActivityRef.current = parsed;
              setLastActivity(parsed);
            }
          }
        } catch {
          // ignore
        }
        checkIdle();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, timeoutMs, recordActivity]);

  return {
    lastActivity,
    recordActivity,
    resetTimer,
    triggerIdle,
    timeoutMs,
  };
}
