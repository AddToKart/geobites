import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock3, Star, Percent, ChefHat } from 'lucide-react';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders } from '@/services/orderService';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/helpers';


function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
}) {
  return (
    <div className="border border-border p-6 bg-background">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-danger" />
          )}
          <span className={`text-xs font-bold uppercase tracking-widest ${
            trend === 'up' ? 'text-emerald-500' : 'text-danger'
          }`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function BarChart({ data, label }: { data: Record<number, number>; label: string }) {
  const maxVal = Math.max(...Object.values(data), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="border border-border p-6 bg-background">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">{label}</p>
      <div className="flex items-end gap-1 h-32">
        {hours.map((hour) => {
          const val = data[hour] ?? 0;
          const height = (val / maxVal) * 100;
          return (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/60 hover:bg-primary transition-colors rounded-t"
                style={{ height: `${Math.max(height, val > 0 ? 4 : 0)}%` }}
                title={`${hour}:00 - ${val} orders`}
              />
              {hour % 4 === 0 && (
                <span className="text-[7px] text-muted-foreground">{hour}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SellerAnalytics() {
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

  const analytics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const todaysOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === todayStr);

    const completedOrders = orders.filter((o) => o.status === 'delivered');
    const todayCompleted = todaysOrders.filter((o) => o.status === 'delivered');

    const totalRevenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
    const todayRevenue = todayCompleted.reduce((s, o) => s + o.totalAmount, 0);
    const totalFees = completedOrders.reduce((s, o) => s + (o.platformFee ?? 0), 0);
    const netRevenue = totalRevenue - totalFees;

    const prepTimes = orders
      .filter((o) => o.prepStartTime && o.prepCompleteTime)
      .map((o) => Math.floor(
        (new Date(o.prepCompleteTime!).getTime() - new Date(o.prepStartTime!).getTime()) / 60000,
      ));
    const avgPrepTime = prepTimes.length > 0
      ? Math.round(prepTimes.reduce((s, t) => s + t, 0) / prepTimes.length)
      : 0;

    const ratings = orders.filter((o) => o.customerRating != null).map((o) => o.customerRating as number);
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
      : 'N/A';

    const ordersByHour: Record<number, number> = {};
    orders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      ordersByHour[hour] = (ordersByHour[hour] ?? 0) + 1;
    });

    return {
      totalOrders: orders.length,
      todaysOrders: todaysOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      todayRevenue,
      totalFees,
      netRevenue,
      avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      avgPrepTime,
      avgRating,
      ordersByHour,
      completionRate: orders.length > 0
        ? ((completedOrders.length / orders.length) * 100).toFixed(1)
        : '0.0',
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Performance metrics, order trends, and operational insights for your shop.
            </p>
          </div>
        </div>

        {error ? (
          <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)] mb-8">
            {error}
          </div>
        ) : null}

        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-12">
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Gross revenue"
            value={formatCurrency(analytics.todayRevenue)}
            trend={analytics.todayRevenue > 0 ? 'up' : undefined}
            trendLabel={analytics.todayRevenue > 0 ? 'Today' : undefined}
          />
          <StatCard
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Today's orders"
            value={String(analytics.todaysOrders)}
            trend={analytics.todaysOrders > 0 ? 'up' : undefined}
            trendLabel={analytics.todaysOrders > 0 ? 'Current period' : undefined}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Avg prep time"
            value={`${analytics.avgPrepTime} min`}
          />
          <StatCard
            icon={<Percent className="h-4 w-4" />}
            label="Completion rate"
            value={`${analytics.completionRate}%`}
          />
        </div>

        {/* Order Volume by Hour */}
        <div className="mb-12">
          <BarChart data={analytics.ordersByHour} label="Order volume by hour (all time)" />
        </div>

        {/* Deeper Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="All-time gross revenue"
            value={formatCurrency(analytics.totalRevenue)}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Net revenue (after fees)"
            value={formatCurrency(analytics.netRevenue)}
          />
          <StatCard
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Avg order value"
            value={formatCurrency(analytics.avgOrderValue)}
          />
          <StatCard
            icon={<Star className="h-4 w-4" />}
            label="Avg customer rating"
            value={String(analytics.avgRating)}
          />
          <StatCard
            icon={<ChefHat className="h-4 w-4" />}
            label="Total orders placed"
            value={String(analytics.totalOrders)}
          />
          <StatCard
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Completed orders"
            value={String(analytics.completedOrders)}
          />
        </div>
      </div>
    </div>
  );
}
