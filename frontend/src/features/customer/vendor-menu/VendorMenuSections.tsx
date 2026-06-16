import { Minus, Plus, RotateCcw } from "lucide-react";
import type { MenuItem } from "@/types";
import { formatCurrency } from "@/utils/helpers";
import { uploadUrl } from "@/utils/upload";
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
      <div className="border border-border py-24 text-center mt-12 bg-secondary/10">
        <p className="text-2xl font-medium tracking-tighter text-foreground mb-6">
          No menu items matched the current filters.
        </p>
        <button
          className="border border-border px-6 py-3 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-2"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-24 mt-16">
      {entries.map(([category, categoryItems]) => (
        <section key={category} className="space-y-8">
          <div className="flex items-end justify-between border-b-2 border-foreground pb-4">
            <h2 className="text-4xl font-medium tracking-tighter text-foreground capitalize">
              {category}
            </h2>
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {categoryItems.length} items
            </span>
          </div>
          <Stagger
            delayChildren={0.02}
            stagger={0.05}
            className="grid gap-x-8 gap-y-12 md:grid-cols-2"
          >
            {categoryItems.map((item) => {
              const quantity = getItemQuantity(item.id);

              return (
                <StaggerItem key={item.id}>
                  <article className="group flex flex-col h-full border border-border bg-background transition-colors hover:bg-secondary/5">
                    <div className="h-48 relative overflow-hidden bg-secondary/20 border-b border-border">
                      {item.imageUrl ? (
                        <>
                          <img
                            src={uploadUrl(item.imageUrl)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center transition-transform duration-700 group-hover:scale-105 text-4xl">
                          🍲
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-background border border-border px-3 py-1 text-sm font-bold text-foreground">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-6 md:p-8">
                      <div className="flex-1 mb-8">
                        <h3 className="text-2xl font-medium tracking-tighter text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <p className="mt-3 text-base text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description || "Prepared fresh and ready to be enjoyed."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-6">
                        <span
                          className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${item.isAvailable ? "text-primary" : "text-muted-foreground"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? "bg-primary" : "bg-muted-foreground"}`}
                          />
                          {item.isAvailable ? "Available" : "Sold out"}
                        </span>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-3">
                            <button
                              className="h-10 w-10 border border-border flex items-center justify-center hover:border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                              onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center text-lg font-bold text-foreground">
                              {quantity}
                            </span>
                            <button
                              className="h-10 w-10 border border-border bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-colors disabled:opacity-50"
                              onClick={() => onAddItem(item)}
                              disabled={!item.isAvailable}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="border border-border bg-foreground text-background px-6 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors disabled:opacity-50"
                            onClick={() => onAddItem(item)}
                            disabled={!item.isAvailable}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
