import { type FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LazyDeliveryLocationPicker } from "@/components/maps/LazyDeliveryLocationPicker";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/helpers";
import { placeOrder, initiatePayment } from "@/services/orderService";
import { getWallet } from "@/services/walletService";
import { toast } from "sonner";

export function CartPage() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, removeItem, clearCart, vendorId } =
    useCart();
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [landmark, setLandmark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "COD" | "GCASH" | "MAYA" | "QRPH" | "GEOPAY"
  >("COD");
  const [deliveryPin, setDeliveryPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ street?: string; barangay?: string; paymentRef?: string }>({});

  const validateField = (field: string, value: string) => {
    if ((field === 'street' || field === 'barangay') && !value.trim()) return `${field === 'street' ? 'Street/Unit' : 'Barangay'} is required`;
    if (field === 'paymentRef' && !value.trim()) return 'Reference number is required';
    if (field === 'paymentRef' && value.trim().length < 4) return 'Reference number must be at least 4 digits';
    return undefined;
  };

  const handleBlur = (field: string) => {
    const value = field === 'street' ? street : field === 'barangay' ? barangay : field === 'paymentRef' ? paymentRef : '';
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const [paymentRef, setPaymentRef] = useState("");
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const data = await getWallet();
        setWallet(data);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    }
    fetchBalance();
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!vendorId || items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!deliveryPin) {
      toast.error("Please place a delivery pin on the map");
      return;
    }

    const streetError = validateField('street', street);
    const barangayError = validateField('barangay', barangay);
    const isDigital = ["GCASH", "MAYA", "QRPH"].includes(paymentMethod);
    const refError = isDigital ? validateField('paymentRef', paymentRef) : undefined;
    setErrors({ street: streetError, barangay: barangayError, paymentRef: refError });

    if (streetError || barangayError || refError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdOrder = await placeOrder({
        vendorId,
        street: street.trim(),
        barangay: barangay.trim(),
        landmark: landmark.trim() || undefined,
        paymentMethod,
        paymentReference: isDigital ? paymentRef.trim() : undefined,
        deliveryLat: deliveryPin.lat,
        deliveryLng: deliveryPin.lng,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      });

      toast.success("Order placed successfully");

      if (paymentMethod === "GEOPAY") {
        toast.info("Processing wallet payment...");
        try {
          await initiatePayment(createdOrder.id);
          toast.success("Paid successfully using GeoPay Wallet!");
        } catch (payErr) {
          toast.error(payErr instanceof Error ? payErr.message : "GeoPay Wallet payment failed");
        }
      }

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
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Nothing to check out
            </h2>
            <p className="max-w-xl text-text-muted font-medium text-lg">
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
              className="rounded-[28px] border border-border shadow-[var(--shadow-card)] overflow-hidden"
            >
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
                <div className="h-32 w-full rounded-[20px] bg-muted border border-border md:w-32 flex-shrink-0 relative overflow-hidden">
                  {item.menuItem.imageUrl ? (
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      loading="lazy"
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
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        {item.menuItem.name}
                      </h2>
                      <p className="mt-1 text-sm text-text-muted font-medium">
                        {item.menuItem.description || "Prepared fresh."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold tracking-tight text-foreground">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </p>
                      <p className="text-xs font-semibold text-text-muted mt-1">
                        {formatCurrency(item.menuItem.price)} / ea
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-surface-2/60 border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-border bg-card shadow-sm"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-border bg-card shadow-sm"
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
                      className="text-danger hover:bg-danger-soft hover:text-danger font-bold rounded-full px-4"
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
          <Card className="rounded-[32px] border border-border shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-6 p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  Summary
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {itemCount} items
                </h2>
              </div>

              <div className="panel-muted space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold text-text-muted">
                  <span>Subtotal</span>
                  <span className="text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-text-muted">
                  <span>Delivery</span>
                  <span className="text-success">Included</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-text-muted">
                  <span>Total</span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[13px] font-bold uppercase tracking-wider text-foreground pl-1">
                  Delivery Details (PH)
                </p>
                <div className="space-y-3">
                  <Input
                    placeholder="Street / Unit Number"
                    value={street}
                    onBlur={() => handleBlur('street')}
                    onChange={(e) => { setStreet(e.target.value); clearError('street'); }}
                    className={`rounded-[16px] h-14 focus:ring-2 focus:ring-primary/20 shadow-sm ${errors.street ? 'ring-2 ring-danger/40' : ''}`}
                    aria-invalid={Boolean(errors.street)}
                    aria-describedby={errors.street ? 'street-error' : undefined}
                    required
                  />
                  {errors.street ? <p id="street-error" className="text-xs font-semibold text-danger mt-1.5">{errors.street}</p> : null}
                  <Input
                    placeholder="Barangay"
                    value={barangay}
                    onBlur={() => handleBlur('barangay')}
                    onChange={(e) => { setBarangay(e.target.value); clearError('barangay'); }}
                    className={`rounded-[16px] h-14 focus:ring-2 focus:ring-primary/20 shadow-sm ${errors.barangay ? 'ring-2 ring-danger/40' : ''}`}
                    aria-invalid={Boolean(errors.barangay)}
                    aria-describedby={errors.barangay ? 'barangay-error' : undefined}
                    required
                  />
                  {errors.barangay ? <p id="barangay-error" className="text-xs font-semibold text-danger mt-1.5">{errors.barangay}</p> : null}
                  <Input
                    placeholder="Landmark (Optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="rounded-[16px] h-14 focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                  <Textarea
                    className="rounded-[16px] min-h-[100px] resize-none"
                    placeholder="Notes for rider (Gate code, instructions...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[13px] font-bold uppercase tracking-wider text-foreground pl-1">
                  Payment Method
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["COD", "GCASH", "MAYA", "QRPH", "GEOPAY"] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method)}
                      className="rounded-[16px] h-12 font-bold transition-all w-full"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {["GCASH", "MAYA", "QRPH"].includes(paymentMethod) && (
                <div className="panel-muted space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Payment Instructions
                    </p>
                    <p className="text-xs font-semibold text-text-soft leading-relaxed">
                      {paymentMethod === "GCASH" && (
                        <>
                          Send GCash payment to: <strong className="text-text font-bold">0917 123 4567 (Geobites Platform)</strong>
                        </>
                      )}
                      {paymentMethod === "MAYA" && (
                        <>
                          Send Maya payment to: <strong className="text-text font-bold">0917 123 4567 (Geobites Food)</strong>
                        </>
                      )}
                      {paymentMethod === "QRPH" && (
                        <>
                          Scan the QR Code below with your GCash, Maya, or bank app, then input the transaction reference number.
                        </>
                      )}
                    </p>
                  </div>

                  {paymentMethod === "QRPH" && (
                    <div className="flex justify-center p-3 bg-card rounded-[16px] border border-border">
                      <div className="h-32 w-32 bg-muted rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden">
                        <div className="grid grid-cols-4 gap-1.5 w-full aspect-square opacity-60">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`rounded-sm ${(i * 5 + 7) % 3 === 0 ? "bg-text" : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground font-extrabold text-[8px] px-2 py-1 rounded-full shadow-md">
                            QR PH
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted pl-1">
                      {paymentMethod} Reference Number
                    </label>
                    <Input
                      placeholder="Enter Reference Number (e.g. 5013...)"
                      value={paymentRef}
                      onBlur={() => handleBlur('paymentRef')}
                      onChange={(e) => { setPaymentRef(e.target.value.replace(/\D/g, "")); clearError('paymentRef'); }}
                      className={`rounded-[16px] h-12 focus:ring-2 focus:ring-primary/20 shadow-sm ${errors.paymentRef ? 'ring-2 ring-danger/40' : ''}`}
                      aria-invalid={Boolean(errors.paymentRef)}
                      aria-describedby={errors.paymentRef ? 'ref-error' : undefined}
                      required
                    />
                    {errors.paymentRef ? <p id="ref-error" className="text-xs font-semibold text-danger mt-1.5">{errors.paymentRef}</p> : null}
                  </div>
                </div>
              )}

              {paymentMethod === "GEOPAY" && (
                <div className="panel-muted space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      GeoPay Wallet Payment
                    </p>
                    {wallet ? (
                      <>
                        <p className="text-sm font-semibold text-text-soft">
                          Available Balance: <strong className="text-text">{formatCurrency(wallet.balance)}</strong>
                        </p>
                        {wallet.balance < total ? (
                          <p className="text-xs font-semibold text-danger mt-1">
                            Insufficient balance. You need {formatCurrency(total - wallet.balance)} more to place this order. Please fund your wallet first or choose another method.
                          </p>
                        ) : (
                          <p className="text-xs font-semibold text-success mt-1">
                            Your wallet has sufficient funds. The amount of {formatCurrency(total)} will be deducted upon placing the order.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-primary" />
                        <span className="text-xs font-semibold text-text-muted">Checking balance...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-[20px] bg-surface-2 border border-border px-4 py-3.5 text-xs font-semibold text-text-muted text-center">
                {deliveryPin
                  ? `Pin set: ${deliveryPin.lat.toFixed(4)}, ${deliveryPin.lng.toFixed(4)}`
                  : "Place a pin on the map below"}
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-[20px] text-lg font-bold bg-primary text-primary-foreground shadow-glow hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
                disabled={isSubmitting || (paymentMethod === "GEOPAY" && wallet !== null && wallet.balance < total)}
              >
                {isSubmitting ? "Processing..." : "Place order"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-[32px] overflow-hidden border border-border shadow-[var(--shadow-card)]">
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
