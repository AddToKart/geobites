import { Plus, Minus } from 'lucide-react';
import { MenuItem } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface MenuItemCardProps {
  menuItem: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({
  menuItem,
  quantity,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-[var(--color-text)]">{menuItem.name}</h4>
          {menuItem.description && (
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">{menuItem.description}</p>
          )}
        </div>
        <span className="font-semibold text-[var(--color-primary-dark)]">
          {formatCurrency(menuItem.price)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
          {menuItem.category ?? 'General'}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRemove}
            disabled={quantity === 0}
          >
            <Minus size={14} />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{quantity}</span>
          <Button size="sm" onClick={onAdd} disabled={!menuItem.isAvailable}>
            <Plus size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
