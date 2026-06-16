import { type Dispatch, type FormEvent, type SetStateAction, useRef } from 'react';
import { Clock, Package, PencilLine, Trash2, AlertTriangle, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';
import type { NewMenuItemFormState } from './types';

export function MenuItemsSection({
  newItem,
  setNewItem,
  onSubmit,
  isAddingItem,
  menuItems,
  onToggleAvailability,
  onRemoveItem,
  onUpdateStock,
}: {
  newItem: NewMenuItemFormState;
  setNewItem: Dispatch<SetStateAction<NewMenuItemFormState>>;
  onSubmit: (event: FormEvent) => void;
  isAddingItem: boolean;
  menuItems: MenuItem[];
  onToggleAvailability: (item: MenuItem) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateStock?: (itemId: string, quantity: number) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (newItem.imagePreview) URL.revokeObjectURL(newItem.imagePreview);
    setNewItem((current) => ({ ...current, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const handleRemoveImage = () => {
    if (newItem.imagePreview) URL.revokeObjectURL(newItem.imagePreview);
    setNewItem((current) => ({ ...current, imageFile: null, imagePreview: null }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

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

      <form className="grid gap-8 md:grid-cols-3" onSubmit={onSubmit}>
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
        <Input
          type="number"
          min="1"
          placeholder="Prep time (min)"
          value={newItem.prepTimeMinutes}
          onChange={(event) =>
            setNewItem((current) => ({ ...current, prepTimeMinutes: event.target.value }))
          }
          className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
        />
        <Input
          type="number"
          min="0"
          placeholder="Stock qty (leave blank = unlimited)"
          value={newItem.stockQuantity}
          onChange={(event) =>
            setNewItem((current) => ({ ...current, stockQuantity: event.target.value }))
          }
          className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
        />
        <div className="flex items-center gap-4">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          {newItem.imagePreview ? (
            <div className="relative size-14 shrink-0 border border-border overflow-hidden">
              <img src={newItem.imagePreview} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1.5 -right-1.5 size-5 bg-foreground text-background flex items-center justify-center"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="h-10 px-4 bg-foreground text-background hover:opacity-90 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-opacity shrink-0"
          >
            <Camera className="size-3.5" />
            {newItem.imagePreview ? 'Change image' : 'Add image'}
          </button>
        </div>
        <div className="md:col-span-3">
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
          {menuItems.map((item) => {
            const isLowStock =
              item.stockQuantity != null &&
              item.lowStockThreshold != null &&
              item.stockQuantity <= item.lowStockThreshold &&
              item.stockQuantity > 0;
            const isOutOfStock = item.stockQuantity != null && item.stockQuantity <= 0;

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-6 py-6"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-lg text-foreground">{item.name}</p>
                    {isLowStock && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-orange-500 border border-orange-500/30 px-2 py-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        Low stock
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-danger border border-danger/30 px-2 py-0.5">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.category && (
                      <span className="inline-block border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                    {item.prepTimeMinutes != null && (
                      <span className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.prepTimeMinutes} min
                      </span>
                    )}
                    {item.stockQuantity != null && (
                      <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        isOutOfStock
                          ? 'border-danger text-danger'
                          : isLowStock
                          ? 'border-orange-500/50 text-orange-500'
                          : 'border-border text-muted-foreground'
                      }`}>
                        <Package className="h-3 w-3" />
                        {item.stockQuantity} left
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 shrink-0">
                  {onUpdateStock && item.stockQuantity != null && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-8 w-8 border border-border text-xs font-bold hover:bg-secondary/10 transition-colors"
                        onClick={() => onUpdateStock(item.id, Math.max(0, (item.stockQuantity ?? 0) - 1))}
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold w-6 text-center">{item.stockQuantity}</span>
                      <button
                        type="button"
                        className="h-8 w-8 border border-border text-xs font-bold hover:bg-secondary/10 transition-colors"
                        onClick={() => onUpdateStock(item.id, (item.stockQuantity ?? 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border border-foreground font-bold uppercase tracking-widest text-[10px] h-8"
                    onClick={() => onToggleAvailability(item)}
                  >
                    <PencilLine className="h-4 w-4 mr-2" />
                    {item.isAvailable ? 'Unavailable' : 'Available'}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
