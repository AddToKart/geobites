import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Printer, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { ORDER_STATUS_LABELS } from "@/utils/constants";
import type { Order } from "@/types";

export function PaymentReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    getOrder(orderId)
      .then(setOrder)
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Failed to load receipt");
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-6 py-12 lg:px-12">
        <Skeleton className="h-64 rounded-none border border-border" />
        <Skeleton className="h-48 rounded-none border border-border mt-8" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-medium tracking-tighter mb-4 text-red-500">Receipt not found</h1>
        <p className="text-lg text-muted-foreground">{error || "Could not retrieve receipt details."}</p>
        <Link to="/orders" className="mt-8 bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest">
          View all orders
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12 lg:px-12">
        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/30 p-8 md:p-12 text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-green-500 mb-2">Payment Successful</h1>
          <p className="text-lg text-muted-foreground">
            Order #{order.id.slice(0, 8)} confirmed via {order.paymentMethod}
          </p>
        </div>

        {/* Receipt Card */}
        <div className="border border-border bg-card backdrop-blur-xl">
          <div className="p-8 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Geobites</p>
                <p className="text-2xl font-bold tracking-tight">Receipt</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Vendor Info */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-secondary/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{order.vendor?.name || "Shop"}</p>
                <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center py-4 border-t border-border">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Status</span>
              <span className="text-sm font-bold uppercase tracking-widest text-green-500">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {/* Items */}
            <div className="border-t border-border pt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Items</p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.name}{" "}
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? "Free" : formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.platformFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>{formatCurrency(order.platformFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold tracking-tight border-t border-border pt-3">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-border pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              {order.paymentSessionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium font-mono text-xs">{order.paymentSessionId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <span className={`font-medium uppercase tracking-widest text-xs ${
                  order.paymentStatus === "paid" ? "text-green-500" : "text-orange-500"
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Link
            to={`/orders/${order.id}`}
            className="flex-1 bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Track Order
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/browse"
            className="flex-1 border border-border px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-foreground hover:text-background transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Order Again
          </Link>
        </div>

        {/* Print-friendly hint */}
        <p className="text-center text-xs text-muted-foreground mt-12">
          This is your official payment receipt. Please keep it for your records.
        </p>
      </div>
    </div>
  );
}
