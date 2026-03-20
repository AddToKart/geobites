import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/utils/helpers';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function CartPage() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, removeItem, clearCart, vendorId } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call - replace with actual implementation
      // const order = await placeOrder({...});
      
      // Simulate successful order
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders'); // Redirect to orders list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <Trash2 className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground">Add items from a vendor to get started.</p>
        <Button asChild>
          <a href="/browse">Browse Vendors</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.menuItem.id} className="overflow-hidden">
              <CardContent className="p-4 flex gap-4">
                <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={item.menuItem.imageUrl || `https://source.unsplash.com/random/200x200/?${item.menuItem.name.replace(/\s+/g, ',')}`} 
                    alt={item.menuItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{item.menuItem.name}</h3>
                    <p className="font-bold">{formatCurrency(item.menuItem.price * item.quantity)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-muted-foreground">{formatCurrency(item.menuItem.price)} each</p>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-4 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      
                      <Separator orientation="vertical" className="h-6 mx-2" />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.menuItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items ({itemCount})</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>$5.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span>$2.00</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total + 7)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Input 
                  id="address" 
                  placeholder="123 Main St, Apt 4B" 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Delivery Instructions</Label>
                <Input 
                  id="notes" 
                  placeholder="Gate code, drop-off location..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-12 text-lg" 
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  Place Order <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
