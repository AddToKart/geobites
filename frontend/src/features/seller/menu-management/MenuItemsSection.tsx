import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { PencilLine, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import type { NewMenuItemFormState } from './types';

export function MenuItemsSection({
  newItem,
  setNewItem,
  onSubmit,
  isAddingItem,
  menuItems,
  onToggleAvailability,
  onRemoveItem,
}: {
  newItem: NewMenuItemFormState;
  setNewItem: Dispatch<SetStateAction<NewMenuItemFormState>>;
  onSubmit: (event: FormEvent) => void;
  isAddingItem: boolean;
  menuItems: MenuItem[];
  onToggleAvailability: (item: MenuItem) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div>
          <p className="eyebrow">Menu</p>
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">
            Menu management
          </h2>
          <p className="mt-2 subtle-copy">
            Add items, keep them available, and build the menu customers open from your customized shop card.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Input
            placeholder="Item name"
            value={newItem.name}
            onChange={(event) =>
              setNewItem((current) => ({ ...current, name: event.target.value }))
            }
            required
          />
          <Input
            placeholder="Category"
            value={newItem.category}
            onChange={(event) =>
              setNewItem((current) => ({ ...current, category: event.target.value }))
            }
          />
          <Input
            placeholder="Description"
            value={newItem.description}
            onChange={(event) =>
              setNewItem((current) => ({ ...current, description: event.target.value }))
            }
          />
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="Price"
            value={newItem.price}
            onChange={(event) =>
              setNewItem((current) => ({ ...current, price: event.target.value }))
            }
            required
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={isAddingItem}>
              {isAddingItem ? 'Adding item...' : 'Add item'}
            </Button>
          </div>
        </form>

        {menuItems.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[color:var(--color-border)] px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
            No menu items yet. Save your shop profile, then add your first menu item here.
          </div>
        ) : (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="panel-muted flex flex-wrap items-center justify-between gap-4 px-4 py-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-[color:var(--color-text)]">{item.name}</p>
                  <p className="text-sm text-[color:var(--color-text-soft)]">
                    {formatCurrency(item.price)}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {item.category || 'Uncategorized'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" variant="ghost" onClick={() => onToggleAvailability(item)}>
                    <PencilLine className="h-4 w-4" />
                    {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
