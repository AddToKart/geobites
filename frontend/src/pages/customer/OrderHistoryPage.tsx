import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { LazyOrderRouteMap } from "@/components/maps/LazyOrderRouteMap";
import { OrderCard } from "../../components/custom/OrderCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { getOrders, completeOrder } from "../../services/orderService";
import { getVendorMenu } from "../../services/menuService";
import { Order } from "../../types";

type HistoryFilter = "all" | "active" | "delivered" | "issues";

const activeStatuses = [
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "delivering",
];
const issueStatuses = ["cancelled", "rejected"];
const deliverableStatuses = ["ready_for_pickup", "picked_up", "delivering"];

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const { addItem, clearCart, vendorId: cartVendorId } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [, setReorderingId] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getOrders({ page: 1, limit: 20 });
        setOrders(response.data);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load orders",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const activeCount = orders.filter((order) =>
      activeStatuses.includes(order.status),
    ).length;
    const deliveredCount = orders.filter(
      (order) => order.status === "delivered",
    ).length;
    const issueCount = orders.filter((order) =>
      issueStatuses.includes(order.status),
    ).length;

    return {
      total: orders.length,
      active: activeCount,
      delivered: deliveredCount,
      issues: issueCount,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (filter === "active" && !activeStatuses.includes(order.status)) {
        return false;
      }

      if (filter === "delivered" && order.status !== "delivered") {
        return false;
      }

      if (filter === "issues" && !issueStatuses.includes(order.status)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        order.id,
        order.deliveryAddress,
        order.vendor?.name,
        ...order.items.map((item) => item.name),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [filter, orders, search]);

  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
    try {
      const vendorMenu = await getVendorMenu(order.vendorId);
      if (vendorMenu.length === 0) {
        toast.error("This vendor has no menu items available right now");
        return;
      }
      if (cartVendorId && cartVendorId !== order.vendorId) {
        clearCart();
      }
      let addedCount = 0;
      for (const orderItem of order.items) {
        const menuItem = vendorMenu.find((m) => m.id === orderItem.menuItemId);
        if (menuItem && menuItem.isAvailable) {
          for (let i = 0; i < orderItem.quantity; i++) {
            addItem(menuItem);
          }
          addedCount++;
        }
      }
      if (addedCount === 0) {
        toast.error("None of the previous items are available for reorder");
        return;
      }
      toast.success(`${addedCount} item(s) re-added to cart`, {
        action: { label: "View Cart", onClick: () => navigate('/cart') },
      });
    } catch {
      toast.error("Failed to reorder. Please try again.");
    } finally {
      setReorderingId(null);
    }
  };

  const handleStartRating = (orderId: string) => {
    setRatingOrderId(orderId);
    setRatingScore(0);
    setRatingFeedback("");
  };

  const handleSubmitRating = async () => {
    if (!ratingOrderId) return;
    if (ratingScore < 1) { toast.error("Please select a rating"); return; }
    setIsSubmittingRating(true);
    try {
      await completeOrder(ratingOrderId, { score: ratingScore, feedback: ratingFeedback || undefined });
      toast.success("Order marked as delivered!");
      setRatingOrderId(null);
      setRatingScore(0);
      setRatingFeedback("");
      const response = await getOrders({ page: 1, limit: 20 });
      setOrders(response.data);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Failed to complete order");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const spotlightOrder = useMemo(
    () =>
      orders.find((order) => activeStatuses.includes(order.status)) ??
      orders.find((order) => order.status === "delivered") ??
      null,
    [orders],
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <Skeleton className="h-32 rounded-none border border-border" />
        <div className="grid gap-6 md:grid-cols-4 mt-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-none border border-border" />
          ))}
        </div>
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_420px] mt-12">
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-none border border-border" />
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-none border border-border" />
              ))}
            </div>
          </div>
          <Skeleton className="h-[520px] rounded-none border border-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b border-border pb-6 mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Orders</p>
          <h1 className="text-4xl font-bold tracking-tight">Order history.</h1>
          <p className="text-base text-muted-foreground mt-2">Review past orders, track active ones, and check issues.</p>
        </div>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="border border-border p-8 bg-background flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-5xl font-medium tracking-tighter">{metrics.total}</p>
          </div>
          <div className="border border-border p-8 bg-background flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Active</span>
              <Clock3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-5xl font-medium tracking-tighter text-primary">{metrics.active}</p>
          </div>
          <div className="border border-border p-8 bg-background flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed</span>
              <PackageCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-5xl font-medium tracking-tighter">{metrics.delivered}</p>
          </div>
          <div className="border border-border p-8 bg-background flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Issues</span>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-5xl font-medium tracking-tighter">{metrics.issues}</p>
          </div>
        </section>

        {error ? (
          <div className="border border-red-500 bg-red-500/10 p-6 mb-8 text-sm font-bold text-red-500">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 bg-secondary/5 border border-border">
            <h2 className="text-4xl font-medium tracking-tighter mb-4">No orders yet</h2>
            <p className="text-lg text-muted-foreground mb-8">Start exploring local restaurants and place your first order.</p>
            <Link to="/browse" className="bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-colors flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" />
              Browse restaurants
            </Link>
          </div>
        ) : (
          <section className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-12">
              <div className="border border-border p-8 bg-background">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-medium tracking-tighter mb-2">History filters</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">
                      {filteredOrders.length} shown
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="relative w-full">
                    <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by order, address, vendor, or item..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-16 h-16 rounded-none border border-border bg-transparent text-lg focus-visible:ring-0 focus-visible:border-foreground transition-colors shadow-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        { key: "all", label: "All orders" },
                        { key: "active", label: "Active" },
                        { key: "delivered", label: "Delivered" },
                        { key: "issues", label: "Issues" },
                      ] as Array<{ key: HistoryFilter; label: string }>
                    ).map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setFilter(option.key)}
                        className={`border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                          filter === option.key
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="border border-border p-12 text-center text-lg text-muted-foreground bg-secondary/5">
                  No orders matched the current filter and search.
                </div>
              ) : (
                <section className="grid gap-6 md:grid-cols-2">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onReorder={
                        order.status === 'delivered' || order.status === 'cancelled' || order.status === 'rejected'
                          ? () => void handleReorder(order)
                          : undefined
                      }
                      onDeliver={
                        deliverableStatuses.includes(order.status)
                          ? () => handleStartRating(order.id)
                          : undefined
                      }
                    />
                  ))}
                </section>
              )}
            </div>

            <div className="space-y-8 xl:sticky xl:top-12 xl:self-start">
              {spotlightOrder ? (
                <div className="border border-border bg-background p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Spotlight Order</p>
                      <h3 className="text-2xl font-medium tracking-tighter">#{spotlightOrder.id.slice(0, 8)}</h3>
                    </div>
                    <StatusBadge status={spotlightOrder.status} />
                  </div>
                  
                  <div className="relative h-64 border border-border overflow-hidden">
                    <LazyOrderRouteMap
                      order={spotlightOrder}
                      compact
                      title=""
                      description=""
                      className="p-0 space-y-0"
                    />
                  </div>
                  
                  <Link
                    to={`/orders/${spotlightOrder.id}`}
                    className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 w-full py-3.5 bg-background border border-border"
                  >
                    Track live order
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </Link>
                </div>
              ) : null}

              <div className="border border-border p-8 bg-background">
                <h2 className="text-2xl font-medium tracking-tighter mb-8 border-b border-border pb-4">Quick Read</h2>

                <div className="space-y-6">
                  <div className="flex justify-between items-start pb-4 border-b border-border/50">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Most recent</p>
                    <p className="text-base font-medium tracking-tighter">
                      {orders[0] ? `#${orders[0].id.slice(0, 8)}` : "None"}
                    </p>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-border/50">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Live attention</p>
                    <p className="text-base font-medium tracking-tighter">
                      {metrics.active > 0 ? `${metrics.active} active` : "None"}
                    </p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Issues</p>
                    <p className="text-base font-medium tracking-tighter">
                      {metrics.issues === 0 ? "None" : `${metrics.issues} recent`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <Dialog open={!!ratingOrderId} onOpenChange={(open) => { if (!open) setRatingOrderId(null); }}>
          <DialogContent className="sm:max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-medium tracking-tighter">Rate your order</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                How was your experience? Tap a star to rate.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-2 py-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= ratingScore
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Optional feedback..."
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              className="rounded-none min-h-[80px]"
            />
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-none"
                onClick={() => setRatingOrderId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-none"
                disabled={ratingScore < 1 || isSubmittingRating}
                onClick={() => void handleSubmitRating()}
              >
                {isSubmittingRating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit rating"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
