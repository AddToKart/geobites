import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    <div className="border-t border-border mt-12 pt-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <label className="relative flex-1 w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dishes or categories..."
            value={menuSearch}
            onChange={(event) => onMenuSearchChange(event.target.value)}
            className="pl-14 h-16 rounded-none border-border bg-transparent text-lg focus-visible:ring-0 focus-visible:border-foreground transition-colors shadow-none"
          />
        </label>
        <button
          onClick={onToggleAvailableOnly}
          className={`h-16 px-8 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-3 border ${
            showAvailableOnly
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-foreground border-border hover:bg-secondary/20"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Available Only
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onActiveCategoryChange(category)}
            className={`border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10"
            }`}
          >
            {category === "all" ? "All Items" : category}
          </button>
        ))}
      </div>
    </div>
  );
}
