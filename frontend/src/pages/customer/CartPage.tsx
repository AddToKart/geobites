import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LazyDeliveryLocationPicker } from "@/components/maps/LazyDeliveryLocationPicker";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/helpers";
import { placeOrder } from "@/services/orderService";
import { toast } from "sonner";

export function CartPage() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, removeItem, clearCart, vendorId } =
    useCart();
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [landmark, setLandmark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "COD" | "GCASH" | "MAYA" | "QRPH"
  >("COD");
  const [deliveryPin, setDeliveryPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!vendorId || items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!street.trim() || !barangay.trim()) {
      toast.error("Please provide at least a street and barangay");
      return;
    }

    if (!deliveryPin) {
      toast.error("Please place a delivery pin on the map");
      return;
    }

    setIsSubmitting(true);

    try {
      await placeOrder({
        vendorId,
        street: street.trim(),
        barangay: barangay.trim(),
        landmark: landmark.trim() || undefined,
        paymentMethod,
        deliveryLat: deliveryPin.lat,
        deliveryLng: deliveryPin.lng,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      });

      toast.success("Order placed successfully");
      clearCart();
      navigate("/orders");
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to place order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-stack">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <p className="eyebrow">Customer</p>
            <h1 className="text-3xl font-bold tracking-tight">
              Your cart is empty
            </h1>
            <p className="subtle-copy mt-2 max-w-2xl">
              Start with one restaurant, add a few items, and this page will
              turn into a straightforward checkout.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full font-bold px-6 py-6 h-auto shadow-sm"
          >
            <Link to="/browse">Browse restaurants</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl rounded-[32px] border-none shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Nothing to check out
            </h2>
            <p className="max-w-xl text-slate-500 font-medium text-lg">
              Once you add menu items, this page will show your subtotal,
              delivery details, and a cleaner order summary.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="mb-2">
        <p className="eyebrow">Checkout</p>
        <h1 className="text-3xl font-bold tracking-tight">Review order</h1>
        <p className="subtle-copy mt-2 max-w-2xl">
          Adjust quantities, confirm where it should go, and place the order.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {items.map((item) => (
            <Card
              key={item.menuItem.id}
              className="rounded-[28px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)] overflow-hidden"
            >
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
                <div className="h-32 w-full rounded-[20px] bg-slate-100 dark:bg-gray-800 md:w-32 flex-shrink-0 relative overflow-hidden">
                  {item.menuItem.imageUrl ? (
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 bg-gradient-to-tr from-orange-400 to-orange-300">
                      <span className="font-bold text-white">Item</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {item.menuItem.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 font-medium">
                        {item.menuItem.description || "Prepared fresh."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        {formatCurrency(item.menuItem.price)} / ea
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-slate-50 dark:bg-gray-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-full px-4"
                      onClick={() => removeItem(item.menuItem.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="xl:sticky xl:top-8 xl:self-start space-y-6"
        >
          <Card className="rounded-[32px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-6 p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
                  Summary
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {itemCount} items
                </h2>
              </div>

              <div className="rounded-[24px] bg-slate-50 dark:bg-gray-800 p-5 space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>Delivery</span>
                  <span className="text-emerald-500">Included</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-gray-700 pt-4 text-sm font-semibold text-slate-500">
                  <span>Total</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[13px] font-bold uppercase tracking-wider text-slate-900 dark:text-white pl-1">
                  Delivery Details (PH)
                </p>
                <div className="space-y-3">
                  <Input
                    placeholder="Street / Unit Number"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="border-slate-200 dark:border-gray-700 rounded-[16px] h-14 px-4 font-medium bg-white focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                    required
                  />
                  <Input
                    placeholder="Barangay"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="border-slate-200 dark:border-gray-700 rounded-[16px] h-14 px-4 font-medium bg-white focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                    required
                  />
                  <Input
                    placeholder="Landmark (Optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="border-slate-200 dark:border-gray-700 rounded-[16px] h-14 px-4 font-medium bg-white focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                  />
                  <textarea
                    className="w-full rounded-[16px] border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm min-h-[100px] resize-none"
                    placeholder="Notes for rider (Gate code, instructions...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[13px] font-bold uppercase tracking-wider text-slate-900 dark:text-white pl-1">
                  Payment Method
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["COD", "GCASH", "MAYA", "QRPH"] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-[16px] h-12 font-bold transition-all ${
                        paymentMethod === method
                          ? "bg-orange-500 text-white shadow-md hover:bg-orange-600 border-transparent"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] bg-slate-50 dark:bg-gray-800 px-4 py-3.5 text-xs font-semibold text-slate-500 text-center border border-slate-100 dark:border-gray-700">
                {deliveryPin
                  ? `Pin set: ${deliveryPin.lat.toFixed(4)}, ${deliveryPin.lng.toFixed(4)}`
                  : "Place a pin on the map below"}
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-[20px] text-lg font-bold bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:bg-orange-600 hover:-translate-y-0.5 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Place order"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-[32px] overflow-hidden border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)]">
            <LazyDeliveryLocationPicker
              value={deliveryPin}
              onChange={setDeliveryPin}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
