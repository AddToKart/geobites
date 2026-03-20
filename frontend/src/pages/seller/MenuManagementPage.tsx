import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
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
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold text-[var(--color-text)]">Menu Management</h1>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Add New Menu Item</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={addMenuItem}>
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
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </Card>

      {error && <Card className="text-sm text-[var(--color-danger)]">{error}</Card>}

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Current Menu</h2>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-[var(--color-text-soft)]">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => void toggleAvailability(item)}>
                  {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => void removeItem(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {menuItems.length === 0 && (
            <p className="text-sm text-[var(--color-text-soft)]">No menu items yet.</p>
          )}
        </div>
      </Card>
    </section>
  );
}
