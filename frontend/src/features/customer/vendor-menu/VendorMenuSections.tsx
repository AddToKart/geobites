import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';

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
    <>
      {entries.map(([category, categoryItems]) => (
        <section key={category} className="space-y-6 mt-8">
          <div className="flex items-end justify-between gap-3 border-b border-slate-200 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{category}</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">{categoryItems.length} items</p>
            </div>
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
                    <Card className="overflow-hidden rounded-[28px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-panel)] transition-all duration-300">
                      <div className="h-40 bg-slate-100 dark:bg-gray-800 relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-end p-5 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-gray-800 dark:to-gray-700">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {item.category || 'Fresh pick'}
                              </p>
                              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {item.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="flex flex-col h-[calc(100%-10rem)] p-6 space-y-4 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-4 flex-1">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{item.name}</h3>
                            <p className="mt-2 text-sm font-medium text-slate-500 line-clamp-2">
                              {item.description ||
                                'Prepared fresh and ready.'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(item.price)}</p>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${item.isAvailable ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {item.isAvailable ? 'Available' : 'Sold out'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-[20px] bg-slate-50 dark:bg-gray-800 px-4 py-3 mt-auto">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                            {item.category || 'Chef specials'}
                          </span>
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border-slate-200 bg-white shadow-sm"
                                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                              >
                                <Minus className="h-4 w-4 text-slate-600" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
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
                              className="rounded-full bg-slate-900 text-white font-semibold shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:bg-orange-500 hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition-all"
                              onClick={() => onAddItem(item)}
                              disabled={!item.isAvailable}
                            >
                              Add
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
    </>
  );
}
