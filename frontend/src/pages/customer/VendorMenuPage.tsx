import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart';
import { getVendorMenu } from '@/services/menuService';
import { getVendorById } from '@/services/vendorService';
import { MenuItem, Vendor } from '@/types';
import { ShoppingBag, MapPin, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export function VendorMenuPage() {
  const { id } = useParams<{ id: string }>();
  const { items, addItem, updateQuantity } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [vendorData, menuData] = await Promise.all([
          getVendorById(id),
          getVendorMenu(id),
        ]);
        setVendor(vendorData);
        setMenuItems(menuData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu');
        toast.error('Failed to load menu data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getItemQuantity = (itemId: string) => {
    return items.find(item => item.menuItem.id === itemId)?.quantity || 0;
  };

  const handleAddItem = (item: MenuItem) => {
    addItem(item);
    toast.success(`Added ${item.name} to cart`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <h2 className="text-2xl font-bold">Vendor Not Found</h2>
        <p className="text-muted-foreground">The vendor you are looking for does not exist or is currently unavailable.</p>
        <Button asChild>
          <Link to="/browse">Back to Browse</Link>
        </Button>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-8 pb-24">
      {/* Vendor Header */}
      <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img 
          src={`https://source.unsplash.com/random/1200x400/?restaurant,food`} 
          alt={vendor.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 p-6 z-20 text-white w-full">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{vendor.name}</h1>
          <div className="flex items-center gap-2 text-white/90">
            <MapPin className="w-4 h-4" />
            <span className="text-sm md:text-base">{vendor.address}</span>
          </div>
          <p className="mt-2 text-sm text-white/80 max-w-2xl">{vendor.description}</p>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => {
          const quantity = getItemQuantity(item.id);
          
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
              <div className="h-48 overflow-hidden bg-muted relative">
                <img 
                  src={item.imageUrl || `https://source.unsplash.com/random/400x300/?${item.name.replace(/\s+/g, ',')}`} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
              </div>
              <CardHeader className="p-4 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                </div>
                <CardDescription className="line-clamp-2 text-sm mt-1">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between mt-auto">
                  {quantity > 0 ? (
                    <div className="flex items-center gap-3 bg-muted rounded-lg p-1 w-full justify-between">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-medium w-8 text-center">{quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleAddItem(item)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddItem(item)}
                    >
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cart Floating Action Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg" 
            className="rounded-full shadow-xl px-6 h-14 gap-3 animate-in slide-in-from-bottom-5 duration-300"
            asChild
          >
            <Link to="/cart">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-semibold">View Cart ({totalItems})</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
