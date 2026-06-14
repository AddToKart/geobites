import { type FormEvent, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Home, MapPin, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LazyDeliveryLocationPicker } from "@/components/maps/LazyDeliveryLocationPicker";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/helpers";
import { placeOrder, initiatePayment } from "@/services/orderService";
import { getWallet } from "@/services/walletService";
import { getVendorById } from "@/services/vendorService";
import { getAddresses, SavedAddress } from "@/services/addressService";
import { haversineKm, calculateDeliveryFee } from "@/utils/distance";
import { toast } from "sonner";
import type { Vendor } from "@/types";

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, updateQuantity, removeItem, clearCart, vendorId } =
    useCart();
  
  const [addressMode, setAddressMode] = useState<'custom' | 'default' | 'saved'>('custom');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  const [street, setStreet] = useState(user?.street || "");
  const [barangay, setBarangay] = useState(user?.barangay || "");
  const [landmark, setLandmark] = useState(user?.landmark || "");
  const [paymentMethod, setPaymentMethod] = useState<
    "COD" | "GCASH" | "MAYA" | "QRPH" | "GEOPAY"
  >("COD");
  const [deliveryPin, setDeliveryPin] = useState<{
    lat: number;
    lng: number;
  } | null>(
    user?.deliveryLat && user?.deliveryLng
      ? { lat: Number(user.deliveryLat), lng: Number(user.deliveryLng) }
      : null
  );

  // Load saved addresses
  useEffect(() => {
    getAddresses().then((addrs) => {
      setSavedAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.isDefault);
      if (defaultAddr && addressMode === 'custom') {
        setAddressMode('default');
        applySavedAddress(defaultAddr);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync inputs with selected saved address
  const applySavedAddress = useCallback((addr: SavedAddress) => {
    setStreet(addr.street || "");
    setBarangay(addr.barangay || "");
    setLandmark(addr.landmark || "");
    setDeliveryPin(
      addr.deliveryLat && addr.deliveryLng
        ? { lat: addr.deliveryLat, lng: addr.deliveryLng }
        : null
    );
  }, []);

  useEffect(() => {
    if (addressMode === 'saved' && selectedSavedId) {
      const addr = savedAddresses.find(a => a.id === selectedSavedId);
      if (addr) applySavedAddress(addr);
    }
  }, [addressMode, selectedSavedId, savedAddresses, applySavedAddress]);
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
  const [vendor, setVendor] = useState<Vendor | null>(null);

  // Live delivery fee computed from vendor → pin distance
  const deliveryFee = useMemo(() => {
    if (!vendor || !deliveryPin) return null;
    const distanceKm = haversineKm(
      vendor.latitude,
      vendor.longitude,
      deliveryPin.lat,
      deliveryPin.lng,
    );
    return calculateDeliveryFee(distanceKm);
  }, [vendor, deliveryPin]);

  const orderTotal = useMemo(
    () => total + (deliveryFee ?? 0),
    [total, deliveryFee],
  );

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

  useEffect(() => {
    if (!vendorId) return;
    getVendorById(vendorId).then(setVendor).catch(console.error);
  }, [vendorId]);

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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-background">
        <div className="flex h-24 w-24 items-center justify-center border border-border bg-secondary/20 text-muted-foreground mb-8">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-5xl font-medium tracking-tighter text-foreground mb-4">
          Your cart is empty.
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-lg text-center leading-relaxed">
          Start with one restaurant, add a few items, and this page will turn into a straightforward checkout.
        </p>
        <Link to="/browse" className="bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-colors">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b-2 border-foreground pb-6 mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Checkout</p>
          <h1 className="text-6xl font-medium tracking-tighter">Review order.</h1>
        </div>

        <div className="grid gap-16 xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="xl:sticky xl:top-12 xl:self-start space-y-8">
            {items.map((item) => (
              <article
                key={item.menuItem.id}
                className="flex flex-col md:flex-row gap-8 pb-8 border-b border-border"
              >
                <div className="h-32 w-32 border border-border bg-secondary/10 flex-shrink-0 relative overflow-hidden">
                  {item.menuItem.imageUrl ? (
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      🍲
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-medium tracking-tighter">
                        {item.menuItem.name}
                      </h2>
                      <p className="mt-2 text-muted-foreground line-clamp-1">
                        {item.menuItem.description || "Prepared fresh."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-medium tracking-tighter">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        {formatCurrency(item.menuItem.price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-3">
                      <button
                        className="h-10 w-10 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-lg font-bold">
                        {item.quantity}
                      </span>
                      <button
                        className="h-10 w-10 border border-border bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-colors"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                      onClick={() => removeItem(item.menuItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <form
            onSubmit={onSubmit}
            className="xl:sticky xl:top-12 xl:self-start space-y-12"
          >
            <div className="bg-background border border-border p-8 md:p-10">
              <div className="mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                  Summary
                </p>
                <h2 className="text-5xl font-medium tracking-tighter">
                  {itemCount} items
                </h2>
              </div>

              <div className="space-y-6 border-b border-border pb-8 mb-8">
                <div className="flex items-center justify-between text-lg font-medium">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-medium">
                  <span className="text-muted-foreground">Delivery</span>
                  {deliveryFee !== null ? (
                    <span className="text-foreground font-bold">
                      {formatCurrency(deliveryFee)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Pin to calculate
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t-2 border-foreground pt-6 text-2xl font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Delivery Details
                  </p>
                </div>

                {/* Address Source Toggle */}
                <div className="flex border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultAddr = savedAddresses.find((a) => a.isDefault);
                      if (!defaultAddr) {
                        toast.error("No default address set. Save one in Settings.");
                        return;
                      }
                      setAddressMode('default');
                      setSelectedSavedId(null);
                      applySavedAddress(defaultAddr);
                    }}
                    className={`flex-1 h-12 font-bold tracking-widest text-[10px] uppercase transition-colors cursor-pointer ${
                      addressMode === 'default'
                        ? "bg-foreground text-background"
                        : "bg-transparent text-foreground hover:bg-secondary/20"
                    }`}
                  >
                    Default
                  </button>
                  <div className="w-px bg-border" />
                  {savedAddresses.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setAddressMode('saved'); setSelectedSavedId(savedAddresses[0]?.id ?? null); }}
                        className={`flex-1 h-12 font-bold tracking-widest text-[10px] uppercase transition-colors cursor-pointer ${
                          addressMode === 'saved'
                            ? "bg-foreground text-background"
                            : "bg-transparent text-foreground hover:bg-secondary/20"
                        }`}
                      >
                        Saved ({savedAddresses.length})
                      </button>
                      <div className="w-px bg-border" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => { setAddressMode('custom'); setSelectedSavedId(null); }}
                    className={`flex-1 h-12 font-bold tracking-widest text-[10px] uppercase transition-colors cursor-pointer ${
                      addressMode === 'custom'
                        ? "bg-foreground text-background"
                        : "bg-transparent text-foreground hover:bg-secondary/20"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {!savedAddresses.some(a => a.isDefault) && addressMode !== 'custom' && (
                  <p className="text-xs text-amber-500 font-semibold mb-6 flex items-center gap-1.5 leading-relaxed">
                    ⚠️ No default address set.{" "}
                    <Link to="/settings" className="underline hover:text-foreground">
                      Set one in Settings
                    </Link>
                  </p>
                )}

                {/* Saved Address Selector */}
                {addressMode === 'saved' && savedAddresses.length > 0 && (
                  <div className="grid gap-2 mb-4">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => { setSelectedSavedId(addr.id); applySavedAddress(addr); }}
                        className={`flex items-center gap-3 px-5 py-4 border text-left transition-colors ${
                          selectedSavedId === addr.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-transparent text-foreground hover:border-foreground"
                        }`}
                      >
                        <Home className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold">{addr.label}</p>
                          <p className="text-xs truncate opacity-70">{addr.street}{addr.barangay ? `, ${addr.barangay}` : ''}</p>
                        </div>
                        {addr.isDefault && <span className="text-[9px] font-bold uppercase tracking-widest ml-auto shrink-0 opacity-70">Default</span>}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    placeholder="Street / Unit Number"
                    value={street}
                    disabled={addressMode !== 'custom'}
                    onBlur={() => handleBlur('street')}
                    onChange={(e) => { setStreet(e.target.value); clearError('street'); }}
                    className={`h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-50 disabled:cursor-not-allowed ${errors.street ? 'border-red-500 bg-red-500/5' : ''}`}
                    aria-invalid={Boolean(errors.street)}
                    aria-describedby={errors.street ? 'street-error' : undefined}
                    required
                  />
                  {errors.street && <p id="street-error" className="text-xs font-semibold text-red-500">{errors.street}</p>}
                  
                  <Input
                    placeholder="Barangay"
                    value={barangay}
                    disabled={addressMode !== 'custom'}
                    onBlur={() => handleBlur('barangay')}
                    onChange={(e) => { setBarangay(e.target.value); clearError('barangay'); }}
                    className={`h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-50 disabled:cursor-not-allowed ${errors.barangay ? 'border-red-500 bg-red-500/5' : ''}`}
                    aria-invalid={Boolean(errors.barangay)}
                    aria-describedby={errors.barangay ? 'barangay-error' : undefined}
                    required
                  />
                  {errors.barangay && <p id="barangay-error" className="text-xs font-semibold text-red-500">{errors.barangay}</p>}
                  
                  <Input
                    placeholder="Landmark (Optional)"
                    value={landmark}
                    disabled={addressMode !== 'custom'}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Textarea
                    className="min-h-[100px] resize-none rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                    placeholder="Notes for rider (Gate code, instructions...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="pt-2">
                    <LazyDeliveryLocationPicker
                      value={deliveryPin}
                      onChange={setDeliveryPin}
                      disabled={addressMode !== 'custom'}
                      vendorCoords={
                        vendor
                          ? { lat: Number(vendor.latitude), lng: Number(vendor.longitude) }
                          : null
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  Payment Method
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["COD", "GCASH", "MAYA", "QRPH", "GEOPAY"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`h-14 font-bold tracking-widest border transition-colors ${
                        paymentMethod === method 
                          ? "bg-foreground text-background border-foreground" 
                          : "bg-transparent text-foreground border-border hover:bg-secondary/20"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {["GCASH", "MAYA", "QRPH"].includes(paymentMethod) && (
                <div className="space-y-6 bg-secondary/10 p-6 border border-border mb-12">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      Instructions
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {paymentMethod === "GCASH" && (
                        <>Send GCash payment to: <strong>0917 123 4567</strong></>
                      )}
                      {paymentMethod === "MAYA" && (
                        <>Send Maya payment to: <strong>0917 123 4567</strong></>
                      )}
                      {paymentMethod === "QRPH" && (
                        <>Scan the QR Code below with your app, then input the reference number.</>
                      )}
                    </p>
                  </div>

                  {paymentMethod === "QRPH" && (
                    <div className="flex justify-center p-6 border border-border bg-background">
                      <div className="h-32 w-32 border border-border flex items-center justify-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        [ QR CODE ]
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Reference Number
                    </label>
                    <Input
                      placeholder="e.g. 5013..."
                      value={paymentRef}
                      onBlur={() => handleBlur('paymentRef')}
                      onChange={(e) => { setPaymentRef(e.target.value.replace(/\D/g, "")); clearError('paymentRef'); }}
                      className={`h-14 rounded-none border-border bg-background shadow-none focus-visible:ring-0 focus-visible:border-foreground ${errors.paymentRef ? 'border-red-500 bg-red-500/5' : ''}`}
                      required
                    />
                    {errors.paymentRef && <p className="text-xs font-semibold text-red-500">{errors.paymentRef}</p>}
                  </div>
                </div>
              )}

              {paymentMethod === "GEOPAY" && (
                <div className="space-y-4 bg-secondary/10 p-6 border border-border mb-12">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    GeoPay Wallet
                  </p>
                  {wallet ? (
                    <>
                      <p className="text-xl font-medium tracking-tighter">
                        Balance: <strong>{formatCurrency(wallet.balance)}</strong>
                      </p>
                      {wallet.balance < total ? (
                        <p className="text-sm text-red-500 font-medium mt-2">
                          Insufficient funds. Top up {formatCurrency(total - wallet.balance)} to proceed.
                        </p>
                      ) : (
                        <p className="text-sm text-green-600 font-medium mt-2">
                          Sufficient funds available.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Checking balance...</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-16 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || (paymentMethod === "GEOPAY" && wallet !== null && wallet.balance < orderTotal)}
              >
                {isSubmitting ? "Processing..." : "Place order"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
