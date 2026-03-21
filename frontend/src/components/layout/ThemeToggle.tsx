import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? resolvedTheme ?? 'light' : 'light';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] p-1 shadow-[var(--shadow-soft)] backdrop-blur-sm',
        className,
      )}
      role="group"
      aria-label="Theme switcher"
    >
      {[
        { key: 'light' as const, label: 'Light', icon: Sun },
        { key: 'dark' as const, label: 'Dark', icon: Moon },
      ].map(({ key, label, icon: Icon }) => {
        const isActive = activeTheme === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              compact && 'px-2.5',
              isActive
                ? 'bg-[color:var(--color-surface-2)] text-[color:var(--color-text)] shadow-[inset_0_0_0_1px_var(--color-border)]'
                : 'text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]',
            )}
          >
            <Icon className="h-4 w-4" />
            {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
