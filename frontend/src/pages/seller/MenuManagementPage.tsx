import { FormEvent, useEffect, useState } from 'react';
import { PencilLine, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { createMenuItem, deleteMenuItem, getVendorMenu, updateMenuItem } from '../../services/menuService';
import { createVendor, getVendors } from '../../services/vendorService';
import { MenuItem, Vendor } from '../../types';
import { formatCurrency } from '../../utils/helpers';

export function MenuManagementPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const vendors = await getVendors({ page: 1, limit: 1 });
      const myVendor = vendors.data[0] ?? null;
      setVendor(myVendor);

      if (myVendor) {
        const menu = await getVendorMenu(myVendor.id);
        setMenuItems(menu);
      } else {
        setMenuItems([]);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load menu data');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const ensureVendor = async (): Promise<Vendor> => {
    if (vendor) {
      return vendor;
    }

    const created = await createVendor({
      name: 'My Food Shop',
      description: 'Seller profile scaffold',
      address: 'Set your vendor address',
      latitude: 0,
      longitude: 0,
    });
    setVendor(created);
    return created;
  };

  const addMenuItem = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const targetVendor = await ensureVendor();
      await createMenuItem({
        vendorId: targetVendor.id,
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        price: Number(newItem.price),
        isAvailable: true,
      });
      setNewItem({ name: '', description: '', category: '', price: '' });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to add menu item');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update item');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to remove item');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Seller"
        title="Menu management"
        description="Add items, adjust availability, and keep the menu readable for customers without bouncing across different screens."
      />

      <Card>
        <CardContent className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={addMenuItem}>
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
              <Button type="submit">Add item</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="panel-muted flex flex-wrap items-center justify-between gap-4 px-4 py-4"
            >
              <div className="space-y-1">
                <p className="font-semibold text-[color:var(--color-text)]">{item.name}</p>
                <p className="text-sm text-[color:var(--color-text-soft)]">{formatCurrency(item.price)}</p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {item.category || 'Uncategorized'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="ghost" onClick={() => void toggleAvailability(item)}>
                  <PencilLine className="h-4 w-4" />
                  {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
                  onClick={() => void removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {menuItems.length === 0 ? (
            <p className="text-sm text-[color:var(--color-text-soft)]">No menu items yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
