import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Printer, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { ORDER_STATUS_LABELS } from "@/utils/constants";
import type { Order } from "@/types";

const printStyles = `
  @media print {
    @page { margin: 0; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 80mm !important;
      overflow: hidden !important;
    }
    .no-print { display: none !important; }
    header.fixed.top-0 { display: none !important; }
    aside.fixed.inset-y-0.left-0 { display: none !important; }
    nav.fixed.inset-x-0.bottom-0 { display: none !important; }
    main.pb-20, main.pt-16 { padding: 0 !important; }
    [class*="md:ml-"] { margin-left: 0 !important; width: 80mm !important; }
    .min-h-screen { min-height: 0 !important; }
    .receipt-page {
      background: white !important;
      padding: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      display: block !important;
      width: 80mm !important;
      overflow: hidden !important;
    }
    .receipt-page > div {
      max-width: 80mm !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      width: 80mm !important;
    }
    .receipt-card {
      border: none !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      background: white !important;
      width: 72mm !important;
      margin: 0 auto !important;
      padding: 2mm 4mm !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 9pt !important;
      line-height: 1.35 !important;
      overflow: hidden !important;
    }
    .receipt-card > div:first-child { border-bottom: 1px dashed #000 !important; }
    .receipt-card > div:first-child * { color: #000 !important; }
    .receipt-card div { color: #000 !important; }
    .receipt-card span { color: #000 !important; }
    .receipt-card p { color: #000 !important; }
    .receipt-card h2 { color: #000 !important; }
    .receipt-card .text-muted-foreground { color: #000 !important; }
    .receipt-card .text-green-500 { color: #000 !important; }
    .receipt-card .border-border { border-color: #000 !important; }
    .receipt-card [class*="bg-"] { background: transparent !important; }
    .receipt-card .border-b { border-bottom-width: 1px !important; border-bottom-style: dashed !important; border-color: #000 !important; }
    .receipt-card .border-t { border-top-width: 1px !important; border-top-style: dashed !important; border-color: #000 !important; }
    .receipt-card .space-y-3 > *, .receipt-card .space-y-4 > *, .receipt-card .space-y-8 > * { margin-top: 0 !important; }
    .receipt-card .space-y-3, .receipt-card .space-y-4, .receipt-card .space-y-8 { display: block !important; }
    .receipt-card .space-y-3 > * + *, .receipt-card .space-y-4 > * + *, .receipt-card .space-y-8 > * + * { margin-top: 3pt !important; }
    .receipt-card .mb-4 { margin-bottom: 3pt !important; }
    .receipt-card .mb-6 { margin-bottom: 5pt !important; }
    .receipt-card .pb-6 { padding-bottom: 3pt !important; }
    .receipt-card .pt-6 { padding-top: 3pt !important; }
    .receipt-card .py-4 { padding-top: 2pt !important; padding-bottom: 2pt !important; }
    .receipt-card .p-8 { padding: 2mm 0 !important; }
    .receipt-card .gap-4 { gap: 4pt !important; }
    .receipt-card .h-12 { height: 20pt !important; width: 20pt !important; }
    .receipt-card .w-12 { width: 20pt !important; }
    .receipt-card .h-6 { height: 10pt !important; width: 10pt !important; }
    .receipt-card .w-6 { width: 10pt !important; }
    .receipt-card img, .receipt-card svg { display: none !important; }
    .receipt-card .text-2xl { font-size: 11pt !important; }
    .receipt-card .text-lg { font-size: 9pt !important; }
    .receipt-card .text-sm { font-size: 8pt !important; }
    .receipt-card .text-xs { font-size: 7pt !important; }
  }
`;

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

  const handlePrint = () => {
    window.print();
  };

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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground receipt-page">
      <style>{printStyles}</style>

      <div className="max-w-2xl mx-auto px-6 py-12 lg:px-12">
        {/* Print / PDF Actions */}
        <div className="flex gap-4 mb-8 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-border px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-border px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>

        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/30 p-8 md:p-12 text-center mb-8 no-print">
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
        <div className="border border-border bg-card backdrop-blur-xl receipt-card">
          <div className="p-8 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 print-text-black">Geobites</p>
                <p className="text-2xl font-bold tracking-tight print-text-black">Receipt</p>
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
        <div className="flex gap-4 mt-8 no-print">
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
        <p className="text-center text-xs text-muted-foreground mt-12 no-print">
          This is your official payment receipt. Please keep it for your records.
        </p>
      </div>
    </div>
  );
}
