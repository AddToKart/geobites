import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MenuItem } from "@/types";
import { formatCurrency } from "@/utils/helpers";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";

export function VendorMenuSections({
  groupedItems,
  getItemQuantity,
  onAddItem,
  onUpdateQuantity,
}: {
  groupedItems: Record<string, MenuItem[]>;
  getItemQuantity: (itemId: string) => number;
  onAddItem: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}) {
  const entries = Object.entries(groupedItems);

  if (entries.length === 0) {
    return (
      <Card className="rounded-[28px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)]">
        <CardContent className="p-8 text-center text-sm font-semibold text-slate-500">
          No menu items matched the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {entries.map(([category, categoryItems]) => (
        <section key={category} className="space-y-6 mt-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white capitalize">
              {category}
            </h2>
            <span className="h-px flex-1 bg-slate-200 dark:bg-gray-800"></span>
            <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-gray-800 rounded-full px-3 py-1">
              {categoryItems.length} items
            </span>
          </div>
          <Stagger
            delayChildren={0.02}
            stagger={0.05}
            className="grid gap-6 md:grid-cols-2"
          >
            {categoryItems.map((item) => {
              const quantity = getItemQuantity(item.id);

              return (
                <StaggerItem key={item.id}>
                  <Card className="flex flex-col h-full overflow-hidden rounded-[32px] border border-slate-200/60 dark:border-gray-800 shadow-[var(--shadow-soft)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-orange-200 dark:hover:border-orange-900/50 transition-all duration-400 group bg-white dark:bg-gray-900">
                    <div className="h-48 bg-slate-50 dark:bg-gray-800/50 relative overflow-hidden">
                      {item.imageUrl ? (
                        <>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 transition-transform duration-700 group-hover:scale-105">
                          <span className="text-4xl">🍲</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-sm text-[14px] font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <CardContent className="flex flex-col flex-1 p-6 space-y-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-[14px] font-medium leading-[1.6] text-slate-500 line-clamp-2">
                          {item.description ||
                            "Prepared fresh and ready to be enjoyed."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-[0.2em] relative z-10 flex items-center gap-1.5 ${item.isAvailable ? "text-emerald-500" : "text-slate-400"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-slate-300"}`}
                          ></span>
                          {item.isAvailable ? "Available" : "Sold out"}
                        </span>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 p-1 rounded-full border border-orange-100 dark:border-orange-900/30">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full border-slate-200 bg-white shadow-sm hover:text-red-500 dark:bg-gray-800 dark:border-gray-700"
                              onClick={() =>
                                onUpdateQuantity(item.id, quantity - 1)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold text-orange-600 dark:text-orange-400">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full border-transparent bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                              onClick={() => onAddItem(item)}
                              disabled={!item.isAvailable}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 shadow-sm hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-all transform active:scale-95"
                            onClick={() => onAddItem(item)}
                            disabled={!item.isAvailable}
                          >
                            Add to Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
