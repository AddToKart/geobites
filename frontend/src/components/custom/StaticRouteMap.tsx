import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/types";

interface StaticRouteMapProps {
  order: Pick<
    Order,
    "id" | "status" | "deliveryAddress" | "deliveryLat" | "deliveryLng"
  > & {
    vendor?: Pick<
      NonNullable<Order["vendor"]>,
      "name" | "address" | "latitude" | "longitude"
    > | null;
  };
  compact?: boolean;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getZoomLevel(distKm: number): number {
  if (distKm < 0.3) return 17;
  if (distKm < 0.8) return 16;
  if (distKm < 3) return 15;
  if (distKm < 8) return 14;
  return 13;
}

function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number,
) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

  const cLatRad = (centerLat * Math.PI) / 180;
  const cx = ((centerLng + 180) / 360) * n;
  const cy = (1 - Math.log(Math.tan(cLatRad) + 1 / Math.cos(cLatRad)) / Math.PI) / 2 * n;

  const scale = 256;
  return {
    x: width / 2 + (x - cx) * scale,
    y: height / 2 + (cy - y) * scale,
  };
}

export function StaticRouteMap({ order, compact = false }: StaticRouteMapProps) {
  const { shop, delivery, distKm, zoom, centerLat, centerLng } = useMemo(() => {
    const s =
      order.vendor?.latitude != null && order.vendor?.longitude != null
        ? { lat: Number(order.vendor.latitude), lng: Number(order.vendor.longitude), name: order.vendor.name || "Shop" }
        : null;
    const d = order.deliveryLat != null && order.deliveryLng != null
      ? { lat: order.deliveryLat, lng: order.deliveryLng }
      : null;

    if (!s || !d) return { shop: null, delivery: null, distKm: 0, zoom: 15, centerLat: 0, centerLng: 0 };

    const dist = haversineKm(s.lat, s.lng, d.lat, d.lng);
    return {
      shop: s,
      delivery: d,
      distKm: dist,
      zoom: getZoomLevel(dist),
      centerLat: (s.lat + d.lat) / 2,
      centerLng: (s.lng + d.lng) / 2,
    };
  }, [order]);

  const viewW = 400;
  const viewH = compact ? 200 : 260;

  const { sp, dp } = useMemo(() => {
    if (!shop || !delivery) return { sp: null, dp: null };
    const spRaw = latLngToPixel(shop.lat, shop.lng, centerLat, centerLng, zoom, viewW, viewH);
    const dpRaw = latLngToPixel(delivery.lat, delivery.lng, centerLat, centerLng, zoom, viewW, viewH);

    const clamp = (v: number, lo: number, hi: number) => Math.round(Math.min(Math.max(v, lo), hi));
    const sp = { x: clamp(spRaw.x, 30, viewW - 30), y: clamp(spRaw.y, 30, viewH - 30), name: shop.name };
    const dp = { x: clamp(dpRaw.x, 30, viewW - 30), y: clamp(dpRaw.y, 30, viewH - 30) };
    return { sp, dp };
  }, [shop, delivery, zoom, centerLat, centerLng, viewW, viewH]);

  if (!sp || !dp) {
    return (
      <Link
        to={`/orders/${order.id}`}
        className="block rounded-[28px] border border-border shadow-[var(--shadow-card)] overflow-hidden transition-all hover:shadow-[var(--shadow-panel)]"
      >
        <div className="p-5 text-center text-sm font-medium text-text-muted">
          <p className="font-semibold text-foreground">
            {order.vendor?.name || "Shop"} → {order.deliveryAddress || "You"}
          </p>
          <p className="mt-1 text-xs capitalize">{order.status.replaceAll("_", " ")}</p>
        </div>
      </Link>
    );
  }

  const distText = distKm < 1 ? `${(distKm * 1000).toFixed(0)} m` : `${distKm.toFixed(1)} km`;

  const midX = (sp.x + dp.x) / 2;
  const midY = (sp.y + dp.y) / 2;
  const cpx = midX;
  const cpy = midY - Math.abs(dp.x - sp.x) * 0.25;

  const shopLabel = sp.name.length > 14 ? sp.name.slice(0, 14) + "..." : sp.name;

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block rounded-[28px] border border-border shadow-[var(--shadow-card)] overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)] group"
    >
      <div className="px-5 pt-4 pb-2">
        <p className="text-sm font-bold tracking-tight text-foreground">
          {order.vendor?.name || "Shop"}
          <span className="font-normal text-text-muted"> → </span>
          {order.deliveryAddress || "You"}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs font-medium text-text-muted">
          <span className="capitalize">{order.status.replaceAll("_", " ")}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{distText}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full h-auto"
        style={{ display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="0" y="0" width={viewW} height={viewH} rx="0" fill="var(--color-muted)" opacity="0.3" />

        <g stroke="var(--color-border)" strokeWidth="0.5" opacity="0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(viewH / 7) * i} x2={viewW} y2={(viewH / 7) * i} strokeDasharray="3 5" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`} x1={(viewW / 7) * i} y1="0" x2={(viewW / 7) * i} y2={viewH} strokeDasharray="3 5" />
          ))}
        </g>

        <path
          d={`M${sp.x},${sp.y} Q${cpx},${cpy} ${dp.x},${dp.y}`}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
          opacity="0.5"
        />

        <circle cx={sp.x} cy={sp.y} r="7" fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth="2.5" />
        <text x={sp.x} y={sp.y + 21} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10" fontWeight="700">
          {shopLabel}
        </text>

        <circle cx={dp.x} cy={dp.y} r="7" fill="var(--color-success)" stroke="var(--color-card)" strokeWidth="2.5" />
        <text x={dp.x} y={dp.y + 21} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10" fontWeight="700">
          You
        </text>

        <text
          x={viewW / 2}
          y={viewH - 10}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize="11"
          fontWeight="600"
        >
          {distText} via local roads
        </text>
      </svg>
    </Link>
  );
}
