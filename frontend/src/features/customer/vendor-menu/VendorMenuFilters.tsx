import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function VendorMenuFilters({
  menuSearch,
  onMenuSearchChange,
  showAvailableOnly,
  onToggleAvailableOnly,
  categories,
  activeCategory,
  onActiveCategoryChange,
}: {
  menuSearch: string;
  onMenuSearchChange: (value: string) => void;
  showAvailableOnly: boolean;
  onToggleAvailableOnly: () => void;
  categories: string[];
  activeCategory: string;
  onActiveCategoryChange: (value: string) => void;
}) {
  return (
    <div className="bg-card/80 backdrop-blur-md rounded-[24px] border border-border/50 shadow-[var(--shadow-soft)] p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <label className="relative block flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search dishes or categories..."
            value={menuSearch}
            onChange={(event) => onMenuSearchChange(event.target.value)}
            className="pl-11 h-12 rounded-full border-border/60 bg-muted/50 focus-visible:ring-primary shadow-sm"
          />
        </label>
        <Button
          variant="outline"
          onClick={onToggleAvailableOnly}
          className={cn(
            "h-12 rounded-full px-6 font-semibold shadow-sm transition-all",
              showAvailableOnly
                ? "bg-primary-soft text-primary border-primary/30 hover:bg-primary-soft hover:text-primary-dark"
                : "bg-card text-text-soft border-border hover:bg-accent hover:text-foreground",
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4 mr-2",
              showAvailableOnly ? "text-primary" : "text-text-muted",
            )}
          />
          Available Only
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onActiveCategoryChange(category)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-bold transition-all shadow-sm",
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground shadow-glow"
                : "border-border bg-card text-text-soft hover:border-primary/30 hover:bg-primary-soft hover:text-primary-dark",
            )}
          >
            {category === "all" ? "All Items" : category}
          </button>
        ))}
      </div>
    </div>
  );
}
