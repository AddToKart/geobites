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

  if (!mounted) {
    return (
      <div className="h-8 w-16 animate-pulse rounded-xl bg-muted/30" />
    );
  }

  const activeTheme = resolvedTheme ?? 'light';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl bg-muted/40 p-0.5 border-none',
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
        const isFixedWidth = className?.split(' ').some(cls => cls.startsWith('w-')) ?? false;

        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center justify-center rounded-lg py-1 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 border-none outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-text-muted hover:text-foreground hover:bg-muted/20',
              compact ? 'px-1.5' : 'px-2.5',
              isFixedWidth && 'flex-1',
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors duration-200 shrink-0',
                isActive && key === 'light' ? 'text-amber-500 fill-amber-500/10' : '',
                isActive && key === 'dark' ? 'text-indigo-400 fill-indigo-400/10' : '',
              )}
            />
            <span
              className={cn(
                'inline-block text-[11px] tracking-tight transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                compact
                  ? 'max-w-0 opacity-0 pointer-events-none ml-0'
                  : 'max-w-[50px] opacity-100 ml-1.5'
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

