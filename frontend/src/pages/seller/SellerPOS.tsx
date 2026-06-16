import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getVendors } from '@/services/vendorService';
import { getVendorMenu } from '@/services/menuService';
import { placeOrder } from '@/services/orderService';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';
import type { Vendor, MenuItem } from '@/types';

interface CartItem extends MenuItem {
  cartQuantity: number;
}

export function SellerPOS() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadVendor = useCallback(async () => {
    try {
      const res = await getVendors({ page: 1, limit: 100 });
      const found = res.data.find((v: Vendor) => v.userId === user?.id);
      if (found) setVendor(found);
    } catch {
      // vendor not found
    }
  }, [user]);

  const loadMenu = useCallback(async () => {
    if (!vendor) return;
    try {
      const items = await getVendorMenu(vendor.id);
      setMenuItems(items);
    } catch {
      // menu not available
    }
  }, [vendor]);

  useVisiblePolling(loadMenu, 15000);

  useEffect(() => { void loadVendor(); }, [loadVendor]);
  useEffect(() => { void loadMenu(); }, [loadMenu]);

  const categories = [...new Set(menuItems.map((i) => i.category).filter((c): c is string => !!c))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i,
        );
      }
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cartQuantity: Math.max(0, i.cartQuantity + delta) } : i))
        .filter((i) => i.cartQuantity > 0),
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const navigate = useNavigate();

  const handleCreateOrder = async () => {
    if (!vendor || cart.length === 0) return;
    try {
      const order = await placeOrder({
        vendorId: vendor.id,
        street: vendor.address,
        barangay: '',
        paymentMethod: 'COD',
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.cartQuantity,
        })),
      });
      setCart([]);
      toast.success('Order created');
      navigate(`/receipt/${order.id}`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Failed to create order');
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.cartQuantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.cartQuantity, 0);

  if (!vendor) {
    return (
      <div className="w-full px-6 py-12 lg:px-12">
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No shop profile found</h2>
          <p className="text-muted-foreground mb-6">Set up your shop in Shop Settings first</p>
          <Button onClick={() => window.location.href = '/seller/menu'}>
            Go to Shop Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Seller / Point of Sale
        </p>
        <h1 className="text-3xl font-bold tracking-tighter mt-1">
          POS — {vendor.name}
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Left: menu panel */}
        <div className="flex-1 min-w-0">
          {/* Search + categories */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                !selectedCategory
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border hover:bg-secondary/20'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:bg-secondary/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={!item.isAvailable}
                className="text-left border border-border rounded-[16px] p-4 bg-card backdrop-blur-xl hover:bg-secondary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <p className="font-bold text-sm truncate">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
                <p className="text-sm font-bold mt-2">{formatCurrency(item.price)}</p>
                {!item.isAvailable && (
                  <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-1">Unavailable</p>
                )}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              {menuItems.length === 0 ? 'No menu items yet. Add items in Shop Settings.' : 'No items match your search.'}
            </p>
          )}
        </div>

        {/* Right: cart panel */}
        <div className="w-80 shrink-0">
          <div className="border border-border bg-card backdrop-blur-xl rounded-[24px] sticky top-28">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-bold">Current Order</span>
                </div>
                <span className="text-sm text-muted-foreground">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="p-5 space-y-3 max-h-[420px] overflow-y-auto">
              {cart.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tap menu items to add
                </p>
              )}
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                      className="h-7 w-7 flex items-center justify-center border border-border rounded-full hover:bg-secondary/20 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.cartQuantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                      className="h-7 w-7 flex items-center justify-center border border-border rounded-full hover:bg-secondary/20 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-16 text-right">
                    {formatCurrency(item.price * item.cartQuantity)}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold">{formatCurrency(cartTotal)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0}
                onClick={handleCreateOrder}
              >
                Create Order
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
