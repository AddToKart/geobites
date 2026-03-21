import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DeliveryLocationPicker } from '@/components/maps/DeliveryLocationPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/utils/helpers';
import { placeOrder } from '@/services/orderService';
import { toast } from 'sonner';

export function CartPage() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, removeItem, clearCart, vendorId } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPin, setDeliveryPin] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!vendorId || items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    if (!deliveryPin) {
      toast.error('Please place a delivery pin on the map');
      return;
    }

    setIsSubmitting(true);

    try {
      await placeOrder({
        vendorId,
        deliveryAddress: deliveryAddress.trim(),
        deliveryLat: deliveryPin.lat,
        deliveryLng: deliveryPin.lng,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      });

      toast.success('Order placed successfully');
      clearCart();
      navigate('/orders');
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : 'Failed to place order',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Customer"
          title="Your cart is empty"
          description="Start with one restaurant, add a few items, and this page will turn into a straightforward checkout instead of a messy list."
          actions={
            <Button asChild>
              <Link to="/browse">Browse restaurants</Link>
            </Button>
          }
        />

        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-semibold">Nothing to check out yet</h2>
            <p className="max-w-xl subtle-copy">
              Once you add menu items, this page will show your subtotal, delivery details, and a cleaner order summary.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Checkout"
        title="Review your order"
        description="Adjust quantities, confirm where it should go, and place the order without the extra clutter."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.menuItem.id}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <div className="h-24 w-full rounded-[20px] bg-[linear-gradient(135deg,#fff2e5,#f9d2b7)] md:w-28">
                  {item.menuItem.imageUrl ? (
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      className="h-full w-full rounded-[20px] object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-end p-4">
                      <p className="text-sm font-semibold text-[color:var(--color-primary-dark)]">
                        {item.menuItem.category || 'Menu item'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{item.menuItem.name}</h2>
                      <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                        {item.menuItem.description || 'Prepared fresh and ready to go.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </p>
                      <p className="text-xs text-[color:var(--color-text-muted)]">
                        {formatCurrency(item.menuItem.price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[color:var(--color-surface-2)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        size="icon-sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
                      onClick={() => removeItem(item.menuItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <form onSubmit={onSubmit} className="xl:sticky xl:top-8 xl:self-start">
          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-6 p-5">
              <div>
                <p className="eyebrow">Summary</p>
                <h2 className="mt-2 text-2xl font-semibold">{itemCount} item(s)</h2>
                <p className="subtle-copy">Simple totals, no fake fees added on top.</p>
              </div>

              <div className="panel-muted space-y-3 px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-text-soft)]">Subtotal</span>
                  <span className="font-semibold text-[color:var(--color-text)]">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-text-soft)]">Delivery</span>
                  <span className="font-medium text-[color:var(--color-text)]">Included for now</span>
                </div>
                <div className="flex items-center justify-between border-t border-[color:var(--color-border)] pt-3 text-sm">
                  <span className="text-[color:var(--color-text-soft)]">Pay now</span>
                  <span className="text-lg font-semibold text-[color:var(--color-text)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--color-text)]" htmlFor="address">
                    Delivery address
                  </label>
                  <Input
                    id="address"
                    placeholder="Street, building, and any landmark"
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--color-text)]" htmlFor="notes">
                    Notes for the rider
                  </label>
                  <textarea
                    id="notes"
                    className="min-h-28 w-full rounded-[20px] border border-[color:var(--color-border)] bg-white/85 px-4 py-3 text-sm text-[color:var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none"
                    placeholder="Gate code, drop-off preference, floor number..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-[20px] bg-[color:var(--color-surface-2)] px-4 py-4 text-sm text-[color:var(--color-text-soft)]">
                {deliveryPin
                  ? `Pinned drop-off at ${deliveryPin.lat.toFixed(5)}, ${deliveryPin.lng.toFixed(5)}`
                  : 'Set a pin so the shop, rider, and customer maps all point to the exact delivery spot.'}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Placing order...' : 'Place order'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              </CardContent>
            </Card>

            <DeliveryLocationPicker value={deliveryPin} onChange={setDeliveryPin} />
          </div>
        </form>
      </div>
    </div>
  );
}
