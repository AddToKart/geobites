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

        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 border-none outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-text-muted hover:text-foreground hover:bg-muted/20',
              compact && 'px-1.5 py-1',
              className?.includes('w-full') && 'flex-1',
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors duration-200',
                isActive && key === 'light' ? 'text-amber-500 fill-amber-500/10' : '',
                isActive && key === 'dark' ? 'text-indigo-400 fill-indigo-400/10' : '',
              )}
            />
            {compact ? null : <span className="text-[11px] tracking-tight">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
