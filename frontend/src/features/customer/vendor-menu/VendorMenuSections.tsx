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
      <Card>
        <CardContent className="p-6 text-sm text-[color:var(--color-text-soft)]">
          No menu items matched the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {entries.map(([category, categoryItems]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{category}</h2>
              <p className="subtle-copy">{categoryItems.length} items</p>
            </div>
          </div>
          <Stagger
            delayChildren={0.02}
            stagger={0.05}
            className="grid gap-5 md:grid-cols-2"
          >
            {categoryItems.map((item) => {
                const quantity = getItemQuantity(item.id);

                return (
                  <StaggerItem key={item.id}>
                    <Card className="overflow-hidden">
                      <div className="h-36 bg-[linear-gradient(135deg,#fff2e5,#f9d2b7)]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-end p-5">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary-dark)]">
                                {item.category || 'Fresh pick'}
                              </p>
                              <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                                {item.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                            <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                              {item.description ||
                                'Prepared fresh and ready for a straightforward checkout.'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{formatCurrency(item.price)}</p>
                            <p className="text-xs text-[color:var(--color-text-muted)]">
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[color:var(--color-surface-2)] px-4 py-3">
                          <span className="text-sm text-[color:var(--color-text-soft)]">
                            {item.category || 'Chef specials'}
                          </span>
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {quantity}
                              </span>
                              <Button
                                size="icon-sm"
                                onClick={() => onAddItem(item)}
                                disabled={!item.isAvailable}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => onAddItem(item)}
                              disabled={!item.isAvailable}
                            >
                              Add to cart
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
