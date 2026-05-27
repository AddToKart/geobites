import { Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-[24px] border border-slate-200/50 dark:border-gray-800 shadow-[var(--shadow-soft)] p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <label className="relative block flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search dishes or categories..."
            value={menuSearch}
            onChange={(event) => onMenuSearchChange(event.target.value)}
            className="pl-11 h-12 rounded-full border-slate-200/60 bg-slate-50/50 dark:border-gray-700/50 dark:bg-gray-800/50 focus-visible:ring-orange-500 shadow-sm"
          />
        </label>
        <Button
          variant="outline"
          onClick={onToggleAvailableOnly}
          className={cn(
            "h-12 rounded-full px-6 font-semibold shadow-sm transition-all",
            showAvailableOnly
              ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-gray-800 dark:text-slate-300 dark:border-gray-700",
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4 mr-2",
              showAvailableOnly ? "text-orange-500" : "text-slate-400",
            )}
          />
          Available Only
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onActiveCategoryChange(category)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-bold transition-all shadow-sm",
              activeCategory === category
                ? "border-orange-500 bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.2)]"
                : "border-slate-200/60 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-700/50 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700",
            )}
          >
            {category === "all" ? "All Items" : category}
          </button>
        ))}
      </div>
    </div>
  );
}
