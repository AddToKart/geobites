import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CartItem, MenuItem } from '../types';

const CART_KEY = 'geobites_mobile_cart';

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  total: number;
  addItem: (menuItem: MenuItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { items: CartItem[]; vendorId: string | null };
        setItems(parsed.items ?? []);
        setVendorId(parsed.vendorId ?? null);
      }
    })();
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(CART_KEY, JSON.stringify({ items, vendorId }));
  }, [items, vendorId]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [items],
  );

  const addItem = (menuItem: MenuItem) => {
    if (vendorId && vendorId !== menuItem.vendorId) {
      throw new Error('Cart is vendor-locked. Clear it before switching vendors.');
    }

    setVendorId(menuItem.vendorId);
    setItems((current) => {
      const existing = current.find((item) => item.menuItem.id === menuItem.id);
      if (!existing) {
        return [...current, { menuItem, quantity: 1 }];
      }
      return current.map((item) =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => {
        const updated = current.filter((item) => item.menuItem.id !== menuItemId);
        if (updated.length === 0) {
          setVendorId(null);
        }
        return updated;
      });
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeItem = (menuItemId: string) => {
    setItems((current) => {
      const updated = current.filter((item) => item.menuItem.id !== menuItemId);
      if (updated.length === 0) {
        setVendorId(null);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setVendorId(null);
  };

  const value = useMemo<CartContextType>(
    () => ({
      items,
      vendorId,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, total, vendorId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
