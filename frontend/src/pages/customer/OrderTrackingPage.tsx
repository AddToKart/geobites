import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Ban, MapPin, PackageCheck, RefreshCw, ShoppingBag, Star, X } from "lucide-react";
import { LazyOrderRouteMap } from "@/components/maps/LazyOrderRouteMap";
import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { updateOrderStatus, getPaymentStatus } from "../../services/orderService";
import { Order } from "../../types";
import { ORDER_STATUS_LABELS } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { RatingDialog } from "@/components/custom/RatingDialog";

const CANCELLATION_REASONS = [
  "Changed my mind",
  "Found a better option",
  "Order takes too long",
  "Delivery address is wrong",
  "Payment issue",
  "Duplicate order",
  "Other",
] as const;

const CANCELLABLE_STATUSES = ["pending", "accepted", "preparing"];

const timeline: string[] = [
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "delivering",
  "delivered",
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelCustomReason, setCancelCustomReason] = useState("");

  useEffect(() => {
    const refreshInitialOrder = async () => {
      if (!id) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await getPaymentStatus(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load order",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void refreshInitialOrder();
  }, [id]);

  useVisiblePolling(
    async () => {
      if (!id) {
        return;
      }

      try {
        const response = await getPaymentStatus(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load order",
        );
      }
    },
    15000,
    { enabled: Boolean(id), runOnMount: false },
  );

  const cancelOrder = async (reason: string) => {
    if (!order) return;
    setIsCancelling(true);
    setShowCancelDialog(false);
    try {
      const updated = await updateOrderStatus(order.id, "cancelled", reason);
      setOrder((current) =>
        current
          ? {
              ...current,
              ...updated,
              items: current.items,
              vendor: current.vendor,
            }
          : updated,
      );
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to cancel order",
      );
    } finally {
      setIsCancelling(false);
      setCancelReason("");
      setCancelCustomReason("");
    }
  };

  const handleCancelClick = () => {
    setCancelReason("");
    setCancelCustomReason("");
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    const finalReason = cancelReason === "Other"
      ? cancelCustomReason.trim() || "Cancelled by customer"
      : cancelReason || "Cancelled by customer";
    void cancelOrder(finalReason);
  };

  const displayTimeline = useMemo(() => {
    if (!order) {
      return timeline;
    }

    if (order.status === "cancelled" || order.status === "rejected") {
      return ["pending", order.status];
    }

    return timeline;
  }, [order]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <Skeleton className="h-44 rounded-none border-b border-border" />
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-none border border-border" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-none border border-border mt-8" />
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1.15fr)_420px] mt-12">
          <Skeleton className="h-96 rounded-none border border-border" />
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-none border border-border" />
            <Skeleton className="h-32 rounded-none border border-border" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center border-b border-border bg-secondary/5">
        <h1 className="text-4xl font-medium tracking-tighter mb-4 text-red-500">Order not found</h1>
        <p className="text-lg text-muted-foreground">{error || "Could not retrieve order details."}</p>
      </div>
    );
  }

  const currentStep = displayTimeline.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-2 border-foreground pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tracking</p>
            <h1 className="text-5xl font-medium tracking-tighter">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Placed {formatDate(order.createdAt)}. Track live status, payment, and delivery progress.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="border border-border bg-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </div>
            {CANCELLABLE_STATUSES.includes(order.status) ? (
              <Button
                variant="outline"
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="rounded-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Ban className="h-4 w-4 mr-2" />
                {isCancelling ? "Cancelling..." : "Cancel order"}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Cancellation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-background border border-border p-8 md:p-12 mx-4">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Cancel Order</p>
                  <h2 className="text-3xl font-medium tracking-tighter">Why are you cancelling?</h2>
                </div>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="h-10 w-10 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-muted-foreground mb-6">This action cannot be undone. Select a reason for cancelling.</p>
              <div className="space-y-2 mb-8">
                {CANCELLATION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason === cancelReason ? "" : reason)}
                    className={`w-full text-left px-5 py-4 border text-sm font-medium transition-colors ${
                      cancelReason === reason
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-transparent text-foreground hover:border-foreground"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {cancelReason === "Other" && (
                <Input
                  placeholder="Tell us more..."
                  value={cancelCustomReason}
                  onChange={(e) => setCancelCustomReason(e.target.value)}
                  className="mb-8 h-14 rounded-none border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground transition-colors shadow-none"
                />
              )}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-xs"
                >
                  Keep order
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason || isCancelling}
                  className="flex-1 h-14 rounded-none bg-red-500 text-white hover:bg-red-600 font-bold uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling..." : "Yes, cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="border border-red-500 bg-red-500/10 p-6 mb-8 text-sm font-bold text-red-500">
            {error}
          </div>
        ) : null}

        {order.paymentMethod !== "COD" && order.paymentStatus === "pending" && (
          <div className="border-l-4 border-orange-500 bg-secondary/5 p-6 md:p-8 flex items-start gap-6 mb-8">
            <div className="flex h-12 w-12 items-center justify-center bg-orange-500/10 text-orange-500 shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-medium tracking-tighter text-orange-500">
                Payment Pending Verification ({order.paymentMethod})
              </h3>
              <p className="text-lg font-medium text-muted-foreground mt-2">
                Reference Number: <strong className="text-foreground">{order.paymentSessionId || "N/A"}</strong>
              </p>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-4">
                The seller is verifying your transfer. Your order will be prepared once confirmed.
              </p>
            </div>
          </div>
        )}

        {order.paymentMethod !== "COD" && order.paymentStatus === "paid" && (
          <div className="border-l-4 border-green-500 bg-secondary/5 p-6 md:p-8 flex items-start gap-6 mb-8">
            <div className="flex h-12 w-12 items-center justify-center bg-green-500/10 text-green-500 shrink-0">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-medium tracking-tighter text-green-500">
                Payment Verified ({order.paymentMethod})
              </h3>
              <p className="text-lg font-medium text-muted-foreground mt-2">
                Reference Number: <strong className="text-foreground">{order.paymentSessionId || "N/A"}</strong>
              </p>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-4">
                Your payment of {formatCurrency(order.totalAmount)} was successfully verified by the seller.
              </p>
            </div>
          </div>
        )}

        {/* Rating Callout */}
        {order.status === "delivered" && !ratingDone && (
          <div className="border border-border bg-secondary/5 p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center bg-yellow-500/10 text-yellow-500 shrink-0">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">How was your order?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rate your experience with {order.vendor?.name || "the shop"} and help others decide.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowRating(true)}
                className="h-12 px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs rounded-none shrink-0"
              >
                <Star className="h-4 w-4 mr-2" />
                Rate this order
              </Button>
            </div>
          </div>
        )}

        {(order.status === "cancelled" || order.status === "rejected") && order.paymentMethod !== "COD" && (
          <div className="border-l-4 border-blue-500 bg-secondary/5 p-6 md:p-8 flex items-start gap-6 mb-8">
            <div className="flex h-12 w-12 items-center justify-center bg-blue-500/10 text-blue-500 shrink-0">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-medium tracking-tighter text-blue-500">
                {order.paymentMethod === "GEOPAY"
                  ? "Refund Issued"
                  : "Payment Pending Refund"}
              </h3>
              <p className="text-lg font-medium text-muted-foreground mt-2">
                {order.paymentMethod === "GEOPAY"
                  ? `₱${Number(order.totalAmount).toFixed(2)} has been returned to your GeoPay wallet.`
                  : `Your ${order.paymentMethod} payment of ₱${Number(order.totalAmount).toFixed(2)} will be refunded within 3-5 business days.`}
              </p>
              {order.cancellationReason && (
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-4">
                  Reason: {order.cancellationReason}
                </p>
              )}
            </div>
          </div>
        )}

        {showRating && (
          <RatingDialog
            orderId={order.id}
            vendorName={order.vendor?.name}
            onClose={() => setShowRating(false)}
            onComplete={() => { setShowRating(false); setRatingDone(true); }}
          />
        )}

        <Stagger
          className="grid gap-6 md:grid-cols-3 mb-12"
          delayChildren={0.04}
          stagger={0.06}
        >
          <StaggerItem>
            <div className="flex items-center gap-6 p-8 border border-border bg-background">
              <div className="flex h-12 w-12 items-center justify-center bg-secondary/20 shrink-0 text-muted-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="text-3xl font-medium tracking-tighter mt-1">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="flex items-center gap-6 p-8 border border-border bg-background">
              <div className="flex h-12 w-12 items-center justify-center bg-secondary/20 shrink-0 text-muted-foreground">
                <PackageCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Items</p>
                <p className="text-3xl font-medium tracking-tighter mt-1">{order.items?.length || 0}</p>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="flex items-center gap-6 p-8 border border-border bg-background">
              <div className="flex h-12 w-12 items-center justify-center bg-secondary/20 shrink-0 text-muted-foreground">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Address</p>
                <p className="text-lg font-medium tracking-tight mt-1 line-clamp-1">{order.street} {order.barangay}</p>
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.08} className="mb-16 border border-border bg-background">
          <LazyOrderRouteMap
            order={order}
            title="Live route"
            description="This map shows the shop, your pinned drop-off point, and rider progress whenever rider coordinates are available."
          />
        </Reveal>

        <section className="grid gap-12 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <Reveal>
            <div className="border border-border bg-background p-8 md:p-12">
              <div className="mb-12 border-b border-border pb-6">
                <h2 className="text-4xl font-medium tracking-tighter">Progress</h2>
                <p className="text-muted-foreground mt-4 text-lg">Track your order from placement to delivery.</p>
              </div>
              <ol className="space-y-6">
                {displayTimeline.map((status, index) => {
                  const active = index <= currentStep;
                  const current = status === order.status;

                  return (
                    <li
                      key={status}
                      className={`p-6 border transition-colors ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary/5 text-muted-foreground opacity-70"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className={`text-2xl font-medium tracking-tighter ${active ? "text-background" : ""}`}>
                            {ORDER_STATUS_LABELS[status] ?? status}
                          </p>
                          <p className={`mt-2 text-xs font-bold uppercase tracking-widest ${current ? "text-primary" : active ? "text-background/70" : "text-muted-foreground"}`}>
                            {current ? "Current step" : active ? "Completed" : "Waiting"}
                          </p>
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${active ? "text-background/50" : "text-muted-foreground/50"}`}>
                          Step {index + 1}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Reveal>

          <Reveal className="space-y-12" delay={0.1}>
            <div className="border border-border bg-background p-8">
              <h2 className="text-2xl font-medium tracking-tighter mb-8 border-b border-border pb-4">Summary</h2>
              <div className="space-y-4">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-6 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <span className="font-medium text-lg leading-snug">
                      <span className="text-primary font-bold">{item.quantity}x</span>{" "}
                      {item.name}
                    </span>
                    <span className="font-bold text-lg tracking-tighter shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border bg-background p-8">
              <h2 className="text-2xl font-medium tracking-tighter mb-6 border-b border-border pb-4">Notes</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {order.notes || "No delivery notes were provided for this order."}
              </p>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
