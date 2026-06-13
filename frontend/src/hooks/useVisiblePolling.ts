import { useEffect, useEffectEvent } from 'react';

export function useVisiblePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options?: {
    enabled?: boolean;
    runOnMount?: boolean;
  },
) {
  const enabled = options?.enabled ?? true;
  const runOnMount = options?.runOnMount ?? true;

  const onTick = useEffectEvent(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    void callback();
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (runOnMount) {
      onTick();
    }

    const intervalId = window.setInterval(() => {
      onTick();
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onTick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs, runOnMount]);
}
