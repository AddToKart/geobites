import { Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function VendorMenuFilters({
  menuSearch,
  onMenuSearchChange,
  showAvailableOnly,
  onToggleAvailableOnly,
  categories,
  activeCategory,
  onActiveCategoryChange,
  visibleCategoryCount,
}: {
  menuSearch: string;
  onMenuSearchChange: (value: string) => void;
  showAvailableOnly: boolean;
  onToggleAvailableOnly: () => void;
  categories: string[];
  activeCategory: string;
  onActiveCategoryChange: (value: string) => void;
  visibleCategoryCount: number;
}) {
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Menu filters</h2>
            <p className="subtle-copy">
              Search dishes, narrow by category, or hide unavailable items.
            </p>
          </div>
          <Badge>{visibleCategoryCount} sections showing</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
            <Input
              placeholder="Search dishes or categories"
              value={menuSearch}
              onChange={(event) => onMenuSearchChange(event.target.value)}
              className="pl-11"
            />
          </label>
          <Button variant={showAvailableOnly ? 'default' : 'ghost'} onClick={onToggleAvailableOnly}>
            <Sparkles className="h-4 w-4" />
            {showAvailableOnly ? 'Showing available only' : 'Show available only'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onActiveCategoryChange(category)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === category
                  ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]',
              )}
            >
              {category === 'all' ? 'All items' : category}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
