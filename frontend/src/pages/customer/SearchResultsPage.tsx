import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Star, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchMenuItems } from "@/services/menuService";
import type { DishSearchResult } from "@/services/menuService";

const CATEGORIES = [
  "All",
  "Meal",
  "Drink",
  "Dessert",
  "Snack",
  "Sides",
  "Combo",
];

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "All";

  const [results, setResults] = useState<DishSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(query);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const data = await searchMenuItems(query.trim());
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setError("Search failed. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredResults = useMemo(() => {
    if (categoryParam === "All") return results;
    return results
      .map((r) => ({
        ...r,
        items: r.items.filter((i) => i.category === categoryParam),
      }))
      .filter((r) => r.items.length > 0 || categoryParam === "All");
  }, [results, categoryParam]);

  const totalDishes = filteredResults.reduce((s, r) => s + r.items.length, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim(), category: categoryParam });
    }
  };

  const setCategory = (cat: string) => {
    setSearchParams({ q: query, category: cat });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b border-border pb-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Search</p>
          <h1 className="text-4xl font-bold tracking-tight">
            {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search dishes & restaurants"}
          </h1>
        </div>

        <form onSubmit={handleSearch} className="relative mb-8">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by dish or restaurant name..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-16 pr-16 h-16 rounded-none border border-border bg-transparent text-lg focus-visible:ring-0 focus-visible:border-foreground transition-colors shadow-none"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(""); setResults([]); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest border transition-colors ${
                  categoryParam === cat
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-none border border-border" />
            ))}
          </div>
        ) : error ? (
          <div className="border border-red-500 bg-red-500/10 p-6 text-sm font-bold text-red-500">
            {error}
          </div>
        ) : query && filteredResults.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 bg-secondary/5 border border-border">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-6" />
            <h2 className="text-3xl font-medium tracking-tighter mb-4">No results found</h2>
            <p className="text-lg text-muted-foreground mb-8">Try a different search term or browse all restaurants.</p>
            <Link
              to="/browse"
              className="bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-colors flex items-center gap-3"
            >
              <ShoppingBag className="h-5 w-5" />
              Browse restaurants
            </Link>
          </div>
        ) : query ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
              {filteredResults.length} restaurant{filteredResults.length !== 1 ? "s" : ""} · {totalDishes} dish{totalDishes !== 1 ? "es" : ""}
            </p>
            <div className="space-y-6">
              {filteredResults.map((result) => (
                <div key={result.vendor.id} className="border border-border bg-card backdrop-blur-xl">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <Link to={`/vendor/${result.vendor.id}`} className="group">
                      <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                        {result.vendor.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          <span className="text-sm font-medium">{result.vendor.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({result.vendor.totalRatings})</span>
                      </div>
                    </Link>
                    <Link
                      to={`/vendor/${result.vendor.id}`}
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors"
                    >
                      View menu →
                    </Link>
                  </div>
                  {result.items.length > 0 && (
                    <div className="divide-y divide-border">
                      {result.items.map((item) => (
                        <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-sm font-bold">₱{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 bg-secondary/5 border border-border">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-6" />
            <h2 className="text-3xl font-medium tracking-tighter mb-4">Search what you're craving</h2>
            <p className="text-lg text-muted-foreground">Dish, restaurant, or cuisine type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
