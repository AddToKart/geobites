import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getWarmupLoadersForRole } from '@/routes/loaders';

const WARMUP_STAGGER_MS = 140;

function scheduleIdleTask(callback: () => void, timeout = 1000) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });

    return () => {
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = globalThis.setTimeout(callback, 140);

  return () => {
    globalThis.clearTimeout(timeoutId);
  };
}

export function RouteWarmup() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let isCancelled = false;
    const timeoutIds: number[] = [];

    const beginWarmup = () => {
      getWarmupLoadersForRole(user?.role ?? null).forEach((loadRoute, index) => {
        const warmRoute = () => {
          if (!isCancelled) {
            void loadRoute();
          }
        };

        if (index === 0) {
          warmRoute();
          return;
        }

        timeoutIds.push(globalThis.setTimeout(warmRoute, index * WARMUP_STAGGER_MS));
      });
    };

    const cancelIdleTask = scheduleIdleTask(beginWarmup);

    return () => {
      isCancelled = true;
      cancelIdleTask();
      timeoutIds.forEach((timeoutId) => globalThis.clearTimeout(timeoutId));
    };
  }, [isLoading, user?.role]);

  return null;
}
