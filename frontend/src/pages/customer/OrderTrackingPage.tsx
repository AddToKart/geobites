import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, PackageCheck, ShoppingBag } from "lucide-react";
import { LazyOrderRouteMap } from "@/components/maps/LazyOrderRouteMap";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { updateOrderStatus, getPaymentStatus } from "../../services/orderService";
import { Order } from "../../types";
import { ORDER_STATUS_LABELS } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

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

  const cancelOrder = async () => {
    if (!order) {
      return;
    }
    setIsCancelling(true);
    try {
      const updated = await updateOrderStatus(order.id, "cancelled");
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
    }
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
      <div className="page-stack">
        <Skeleton className="h-44 rounded-[28px]" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[28px]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[32px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <Skeleton className="h-96 rounded-[32px]" />
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-[32px]" />
            <Skeleton className="h-32 rounded-[32px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-[color:var(--color-danger)]">
          {error || "Order not found"}
        </CardContent>
      </Card>
    );
  }

  const currentStep = displayTimeline.indexOf(order.status);

  return (
    <div className="page-stack">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <p className="eyebrow">Tracking</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="subtle-copy mt-2 max-w-2xl">
            Placed {formatDate(order.createdAt)}. Track live status, payment, and delivery progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {order.status === "pending" ? (
            <Button
              variant="destructive"
              onClick={() => void cancelOrder()}
              disabled={isCancelling}
              className="rounded-[18px]"
            >
              {isCancelling ? "Cancelling..." : "Cancel order"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {order.paymentMethod !== "COD" && order.paymentStatus === "pending" && (
        <Card className="rounded-[28px] border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/50 shadow-sm overflow-hidden mb-2">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-950 dark:text-orange-200">
                Payment Pending Verification ({order.paymentMethod})
              </h3>
              <p className="text-sm font-medium text-orange-700/80 dark:text-orange-400/80 mt-0.5">
                Reference Number: <strong className="text-text font-mono">{order.paymentSessionId || "N/A"}</strong>
              </p>
              <p className="text-xs font-semibold text-text-muted mt-1">
                The seller is verifying your transfer. Your order will be prepared once confirmed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {order.paymentMethod !== "COD" && order.paymentStatus === "paid" && (
        <Card className="rounded-[28px] border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 shadow-sm overflow-hidden mb-2">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 shrink-0">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-200">
                Payment Verified ({order.paymentMethod})
              </h3>
              <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                Reference Number: <strong className="text-text font-mono">{order.paymentSessionId || "N/A"}</strong>
              </p>
              <p className="text-xs font-semibold text-text-muted mt-1">
                Your payment of {formatCurrency(order.totalAmount)} was successfully verified by the seller.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Stagger
        className="grid gap-6 md:grid-cols-3"
        delayChildren={0.04}
        stagger={0.06}
      >
        <Card className="rounded-[28px] border border-border shadow-[var(--shadow-card)]">
          <CardContent className="flex items-center gap-5 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary-soft text-primary shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Total
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-border shadow-[var(--shadow-card)]">
          <CardContent className="flex items-center gap-5 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary-soft text-primary shrink-0">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Items
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {order.items?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-border shadow-[var(--shadow-card)]">
          <CardContent className="flex items-center gap-5 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary-soft text-primary shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Address
              </p>
              <p className="line-clamp-2 text-sm font-semibold text-foreground mt-0.5">
                {order.street} {order.barangay}
              </p>
            </div>
          </CardContent>
        </Card>
      </Stagger>

      <Reveal delay={0.08}>
        <LazyOrderRouteMap
          order={order}
          title="Live route"
          description="This map shows the shop, your pinned drop-off point, and rider progress whenever rider coordinates are available."
        />
      </Reveal>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <Reveal>
          <Card className="rounded-[32px] border border-border shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-6 p-6 md:p-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Progress
                </h2>
                <p className="text-sm font-medium text-text-muted mt-2">
                  Track your order from placement to delivery.
                </p>
              </div>
              <ol className="space-y-4">
                {displayTimeline.map((status, index) => {
                  const active = index <= currentStep;
                  const current = status === order.status;

                  return (
                    <li
                      key={status}
                      className={
                        active
                          ? "rounded-[24px] bg-primary text-primary-foreground px-6 py-5 shadow-glow transition-all transform hover:-translate-y-1"
                          : "rounded-[24px] border border-border bg-muted px-6 py-5 transition-all opacity-80"
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className={`text-lg font-bold tracking-tight ${active ? "text-white" : "text-text-soft"}`}
                          >
                            {ORDER_STATUS_LABELS[status] ?? status}
                          </p>
                          <p
                            className={`mt-1 text-[11px] font-bold uppercase tracking-widest ${active ? "text-white/80" : "text-text-muted"}`}
                          >
                            {current
                              ? "Current step"
                              : active
                                ? "Completed"
                                : "Waiting"}
                          </p>
                        </div>
                        <span
                          className={
                            active
                              ? "rounded-full bg-white/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md"
                              : "rounded-full bg-card border border-border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted shadow-sm"
                          }
                        >
                          Step {index + 1}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="rounded-[32px] border border-border shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-6 p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Summary
              </h2>
              <div className="space-y-3 rounded-[24px] border border-border bg-muted p-5">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-semibold text-text-soft">
                      <span className="text-primary">{item.quantity}x</span>{" "}
                      {item.name}
                    </span>
                    <span className="font-bold text-foreground tracking-tight">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-border shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-4 p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Notes
              </h2>
              <p className="text-sm font-medium leading-relaxed text-text-muted">
                {order.notes ||
                  "No delivery notes were provided for this order."}
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
