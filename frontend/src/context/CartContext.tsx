import {
  PropsWithChildren,
  useCallback,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CartItem, MenuItem } from '../types';

const CART_STORAGE_KEY = 'geobites_cart';

interface PersistedCart {
  items: CartItem[];
  vendorId: string | null;
}

export interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  total: number;
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | null>(null);

function loadStoredCart(): PersistedCart {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return { items: [], vendorId: null };
  }

  try {
    const parsed = JSON.parse(raw) as PersistedCart;
    return {
      items: parsed.items ?? [],
      vendorId: parsed.vendorId ?? null,
    };
  } catch {
    return { items: [], vendorId: null };
  }
}

export function CartProvider({ children }: PropsWithChildren) {
  const initial = loadStoredCart();
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [vendorId, setVendorId] = useState<string | null>(initial.vendorId);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
    }

    persistTimer.current = setTimeout(() => {
      const payload: PersistedCart = { items, vendorId };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
      persistTimer.current = null;
    }, 300);

    return () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
      }
    };
  }, [items, vendorId]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [items],
  );

  const addItem = useCallback((menuItem: MenuItem) => {
    if (vendorId && vendorId !== menuItem.vendorId) {
      throw new Error('Cart is vendor-locked. Clear the cart before adding this item.');
    }

    setVendorId(menuItem.vendorId);
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return currentItems.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...currentItems, { menuItem, quantity: 1 }];
    });
  }, [vendorId]);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((currentItems) => {
      const updated = currentItems.filter((item) => item.menuItem.id !== menuItemId);
      if (updated.length === 0) {
        setVendorId(null);
      }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setVendorId(null);
  }, []);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      vendorId,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [addItem, clearCart, items, removeItem, total, updateQuantity, vendorId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
