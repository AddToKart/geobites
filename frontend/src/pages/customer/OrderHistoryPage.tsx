import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { StaticRouteMap } from "@/components/custom/StaticRouteMap";
import { OrderCard } from "../../components/custom/OrderCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { MetricCard } from "@/components/layout/MetricCard";
import { Badge } from "@/components/ui/badge";
import { getOrders } from "../../services/orderService";
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

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");

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

  const spotlightOrder = useMemo(
    () =>
      orders.find((order) => activeStatuses.includes(order.status)) ??
      orders.find((order) => order.status === "delivered") ??
      null,
    [orders],
  );

  if (isLoading) {
    return (
      <div className="page-stack">
        <Skeleton className="h-44 rounded-[28px]" />
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <Skeleton className="h-32 rounded-[28px]" />
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-[28px]" />
              ))}
            </div>
          </div>
          <Skeleton className="h-[520px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          label="Total orders"
          value={metrics.total}
          description="Everything placed from this account"
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <MetricCard
          label="Active right now"
          value={metrics.active}
          description="Still being prepared or delivered"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Completed"
          value={metrics.delivered}
          description="Successfully delivered orders"
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <MetricCard
          label="Issues"
          value={metrics.issues}
          description="Rejected or cancelled orders"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </section>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-semibold text-foreground">No orders yet</h2>
            <p className="mx-auto mt-3 max-w-xl subtle-copy">
              Start exploring local restaurants and place your first order.
            </p>
            <div className="mt-6">
              <Button asChild className="rounded-full font-bold">
                <Link to="/browse"><ShoppingBag className="h-4 w-4 mr-2" /> Browse restaurants</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">History filters</h2>
                <p className="subtle-copy">
                  Search orders by ID, vendor, or address. Filter by status to focus on what matters.
                </p>
                  </div>
                  <Badge>{filteredOrders.length} shown</Badge>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
                    <Input
                      placeholder="Search by order, address, vendor, or item"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-11"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
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
                        type="button"
                        onClick={() => setFilter(option.key)}
                        className={
                          filter === option.key
                            ? "rounded-full border border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-primary-dark)]"
                            : "rounded-full border border-[color:var(--color-border)] bg-card px-4 py-2 text-sm font-medium text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]"
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-[color:var(--color-text-soft)]">
                  No orders matched the current filter and search.
                </CardContent>
              </Card>
            ) : (
              <section className="grid gap-5 md:grid-cols-2">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </section>
            )}
          </div>

          <div className="space-y-4">
            {spotlightOrder ? (
              <StaticRouteMap
                order={spotlightOrder}
                compact
              />
            ) : null}

            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="eyebrow">History summary</p>
                  <h2 className="mt-2 text-2xl font-semibold">Quick read</h2>
                  <p className="mt-2 subtle-copy">
                    Quick overview of your order activity at a glance.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      Most recent
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                      {orders[0]
                        ? `#${orders[0].id.slice(0, 8)}`
                        : "No orders yet"}
                    </p>
                  </div>
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      Live attention
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                      {metrics.active > 0
                        ? `${metrics.active} order(s) in motion`
                        : "No active orders"}
                    </p>
                  </div>
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      Delivery health
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                      {metrics.issues === 0
                        ? "No recent issues"
                        : `${metrics.issues} issue order(s)`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
