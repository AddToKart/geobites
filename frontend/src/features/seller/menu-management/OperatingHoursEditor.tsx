import { Clock } from 'lucide-react';
import type { OperatingHoursFormState } from './types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function OperatingHoursEditor({
  operatingHours,
  onChange,
}: {
  operatingHours: OperatingHoursFormState[];
  onChange: (hours: OperatingHoursFormState[]) => void;
}) {
  const updateDay = (index: number, patch: Partial<OperatingHoursFormState>) => {
    const next = [...operatingHours];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="pt-6 border-t border-border space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Clock className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Operating hours schedule
        </p>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Set when your shop is open for orders. Customers will only see your shop as "Open" during these hours.
      </p>

      <div className="divide-y divide-border border border-border">
        {operatingHours.map((day, index) => (
          <div
            key={day.dayOfWeek}
            className="grid grid-cols-[80px_1fr_1fr_auto] gap-4 items-center px-4 py-3 bg-background"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              {DAY_LABELS[day.dayOfWeek]}
            </span>

            {day.isClosed ? (
              <span className="text-xs font-semibold uppercase tracking-widest text-danger col-span-2">
                Closed
              </span>
            ) : (
              <>
                <input
                  type="time"
                  value={day.openTime}
                  onChange={(e) => updateDay(index, { openTime: e.target.value })}
                  className="h-9 border border-border bg-transparent px-2 text-xs font-mono text-foreground outline-none focus:border-foreground"
                />
                <span className="text-xs text-muted-foreground text-center">to</span>
                <input
                  type="time"
                  value={day.closeTime}
                  onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                  className="h-9 border border-border bg-transparent px-2 text-xs font-mono text-foreground outline-none focus:border-foreground"
                />
              </>
            )}

            <button
              type="button"
              onClick={() => updateDay(index, { isClosed: !day.isClosed })}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                day.isClosed
                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              {day.isClosed ? 'Open' : 'Close'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
