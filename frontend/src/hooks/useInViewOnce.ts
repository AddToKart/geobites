import { useEffect, useRef, useState } from 'react';

const sharedObservers = new Map<string, IntersectionObserver>();
const pendingElements = new WeakMap<Element, () => void>();

function getObserver(rootMargin: string, threshold: number): IntersectionObserver {
  const key = `${rootMargin}|${threshold}`;
  if (!sharedObservers.has(key)) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            pendingElements.get(entry.target)?.();
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin, threshold },
    );
    sharedObservers.set(key, observer);
  }
  return sharedObservers.get(key)!;
}

export function useInViewOnce(
  rootMargin = '0px 0px -10% 0px',
  threshold = 0.14,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = getObserver(rootMargin, threshold);
    pendingElements.set(el, () => setInView(true));
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      pendingElements.delete(el);
    };
  }, [rootMargin, threshold, inView]);

  return { ref, inView };
}
