import { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, ArrowDownRight, Banknote, Percent, FileDown } from 'lucide-react';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders } from '@/services/orderService';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';

export function SellerPayouts() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await getOrders({ page: 1, limit: 200 });
      setOrders(response.data);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useVisiblePolling(loadOrders, 30000);

  const payouts = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'delivered');
    const pendingOrders = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering'].includes(o.status));

    const grossRevenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalDeliveryFees = completedOrders.reduce((s, o) => s + (o.deliveryFee ?? 0), 0);
    const totalPlatformFees = completedOrders.reduce((s, o) => s + (o.platformFee ?? 0), 0);
    const netPayout = grossRevenue - totalPlatformFees;

    const commissions = completedOrders
      .filter((o) => o.vendor?.commissionRate != null)
      .map((o) => ({
        orderId: o.id,
        gross: o.totalAmount,
        commissionRate: o.vendor!.commissionRate!,
        commissionAmount: o.totalAmount * o.vendor!.commissionRate!,
        net: o.totalAmount - (o.totalAmount * o.vendor!.commissionRate!),
      }));

    const totalCommissionAmount = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    const netAfterCommission = grossRevenue - totalPlatformFees - totalCommissionAmount;

    return {
      grossRevenue,
      totalDeliveryFees,
      totalPlatformFees,
      netPayout,
      totalCommissionAmount,
      netAfterCommission,
      completedCount: completedOrders.length,
      pendingAmount: pendingOrders.reduce((s, o) => s + o.totalAmount, 0),
      pendingCount: pendingOrders.length,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Payouts</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Revenue breakdown, fee deductions, and settlement details for your completed orders.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-12 rounded-none border border-foreground font-bold uppercase tracking-widest text-xs"
            onClick={() => {
              const csv = [
                ['Order ID', 'Gross', 'Delivery Fee', 'Platform Fee', 'Commission', 'Net'],
                ...orders
                  .filter((o) => o.status === 'delivered')
                  .map((o) => [
                    o.id,
                    o.totalAmount.toFixed(2),
                    (o.deliveryFee ?? 0).toFixed(2),
                    (o.platformFee ?? 0).toFixed(2),
                    (o.totalAmount * (o.vendor?.commissionRate ?? 0.25)).toFixed(2),
                    (o.totalAmount - (o.platformFee ?? 0) - o.totalAmount * (o.vendor?.commissionRate ?? 0.25)).toFixed(2),
                  ]),
              ].map((row) => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {error ? (
          <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)] mb-8">
            {error}
          </div>
        ) : null}

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-12">
          <div className="border border-border p-6 bg-background">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" />
              Gross revenue
            </span>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {formatCurrency(payouts.grossRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{payouts.completedCount} completed orders</p>
          </div>

          <div className="border border-border p-6 bg-background">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
              <ArrowDownRight className="h-4 w-4 text-danger" />
              Platform fees
            </span>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              -{formatCurrency(payouts.totalPlatformFees)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Processing & service fees</p>
          </div>

          <div className="border border-border p-6 bg-background">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
              <Percent className="h-4 w-4 text-orange-500" />
              Seller commission
            </span>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              -{formatCurrency(payouts.totalCommissionAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Based on your commission rate</p>
          </div>

          <div className="border border-border p-6 bg-background">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
              <Banknote className="h-4 w-4 text-emerald-500" />
              Net payout
            </span>
            <p className="text-3xl font-semibold tracking-tight text-emerald-500">
              {formatCurrency(payouts.netAfterCommission)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Amount payable to you</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="border border-border mb-12">
          <div className="border-b border-border px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detailed breakdown</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: 'Gross revenue from sales', value: payouts.grossRevenue, type: 'positive' as const },
              { label: 'Delivery fees collected', value: payouts.totalDeliveryFees, type: 'positive' as const },
              { label: 'Platform service fees', value: payouts.totalPlatformFees, type: 'negative' as const },
              { label: 'Seller commission deductions', value: payouts.totalCommissionAmount, type: 'negative' as const },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-bold ${
                  row.type === 'positive' ? 'text-emerald-500' : 'text-danger'
                }`}>
                  {row.type === 'positive' ? '+' : '-'}{formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-4 bg-secondary/10">
              <span className="text-sm font-bold uppercase tracking-widest text-foreground">Net payout</span>
              <span className="text-lg font-bold text-emerald-500">
                {formatCurrency(payouts.netAfterCommission)}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="border border-border">
          <div className="border-b border-border px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending settlement</p>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Orders still in progress</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                These orders will be included once delivered.
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{payouts.pendingCount}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(payouts.pendingAmount)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
