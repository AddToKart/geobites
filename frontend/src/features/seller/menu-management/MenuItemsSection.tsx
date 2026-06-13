import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { PencilLine, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-12">
      {/* Editorial Header Section */}
      <div className="pb-6 border-b-2 border-foreground">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Menu</p>
        <h2 className="text-3xl font-medium tracking-tighter text-foreground">
          Menu management
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Add items, keep them available, and build the menu customers open from your customized shop card.
        </p>
      </div>

      <form className="grid gap-8 md:grid-cols-2" onSubmit={onSubmit}>
        <Input
          placeholder="Item name"
          value={newItem.name}
          onChange={(event) =>
            setNewItem((current) => ({ ...current, name: event.target.value }))
          }
          className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
          required
        />
        <Input
          placeholder="Category"
          value={newItem.category}
          onChange={(event) =>
            setNewItem((current) => ({ ...current, category: event.target.value }))
          }
          className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
        />
        <Input
          placeholder="Description"
          value={newItem.description}
          onChange={(event) =>
            setNewItem((current) => ({ ...current, description: event.target.value }))
          }
          className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
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
          className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
          required
        />
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={isAddingItem}
            className="h-14 px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-opacity disabled:opacity-50 rounded-none animate-none"
          >
            {isAddingItem ? 'Adding item...' : 'Add item'}
          </Button>
        </div>
      </form>

      {menuItems.length === 0 ? (
        <div className="border-b border-dashed border-border py-12 text-center text-sm text-muted-foreground bg-secondary/5 px-6">
          No menu items yet. Save your shop profile, then add your first menu item here.
        </div>
      ) : (
        <div className="divide-y divide-border border-t border-b border-border">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-6 py-6"
            >
              <div className="space-y-1">
                <p className="font-semibold text-lg text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.price)}
                </p>
                {item.category && (
                  <span className="inline-block border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border border-foreground font-bold uppercase tracking-widest text-[10px] h-8"
                  onClick={() => onToggleAvailability(item)}
                >
                  <PencilLine className="h-4 w-4 mr-2" />
                  {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border border-danger text-danger hover:bg-danger/5 font-bold uppercase tracking-widest text-[10px] h-8"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
