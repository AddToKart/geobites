import { useEffect, useMemo, useState } from 'react';
import { Map, MapControls, MapMarker, MapRoute, MarkerContent, MarkerPopup, useMap } from '@/components/ui/map';
import { Order, Vendor } from '@/types';
import { MapStyleSelect } from './MapStyleSelect';
import { defaultMapStyle, mapStyles, type MapStyleKey } from './map-styles';
import { OSRM_BASE_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

type RouteVendor = Pick<Vendor, 'name' | 'address' | 'latitude' | 'longitude'>;

type OrderWithRoute = Pick<
  Order,
  | 'status'
  | 'deliveryAddress'
  | 'deliveryLat'
  | 'deliveryLng'
  | 'riderLat'
  | 'riderLng'
> & {
  vendor?: RouteVendor | null;
};

type RoutePoint = {
  lat: number;
  lng: number;
  label: 'Shop' | 'Customer' | 'Rider' | 'Available Rider';
  title: string;
  subtitle: string;
  color: string;
};

const fallbackCenter: [number, number] = [120.9842, 14.5995]; // Manila, PH

function statusLabel(status: OrderWithRoute['status']) {
  return status.replaceAll('_', ' ');
}

function getProgressRiderPoint(order: OrderWithRoute) {
  const riderLat = order.riderLat != null ? Number(order.riderLat) : null;
  const riderLng = order.riderLng != null ? Number(order.riderLng) : null;

  if (riderLat !== null && riderLng !== null && !isNaN(riderLat) && !isNaN(riderLng)) {
    return {
      lat: riderLat,
      lng: riderLng,
    };
  }

  const vendorLat = order.vendor?.latitude != null ? Number(order.vendor.latitude) : null;
  const vendorLng = order.vendor?.longitude != null ? Number(order.vendor.longitude) : null;
  const vendor =
    vendorLat !== null && vendorLng !== null && !isNaN(vendorLat) && !isNaN(vendorLng)
      ? { lat: vendorLat, lng: vendorLng }
      : null;

  const deliveryLat = order.deliveryLat != null ? Number(order.deliveryLat) : null;
  const deliveryLng = order.deliveryLng != null ? Number(order.deliveryLng) : null;
  const customer =
    deliveryLat !== null && deliveryLng !== null && !isNaN(deliveryLat) && !isNaN(deliveryLng)
      ? { lat: deliveryLat, lng: deliveryLng }
      : null;

  if (!vendor || !customer) {
    return null;
  }

  if (['accepted', 'preparing', 'ready_for_pickup', 'picked_up'].includes(order.status)) {
    return vendor;
  }

  if (order.status === 'delivering') {
    return {
      lat: vendor.lat + (customer.lat - vendor.lat) * 0.55,
      lng: vendor.lng + (customer.lng - vendor.lng) * 0.55,
    };
  }

  if (order.status === 'delivered') {
    return customer;
  }

  return null;
}

function RouteViewportController({
  points,
  is3D,
}: {
  points: RoutePoint[];
  is3D: boolean;
}) {
  const { map, isLoaded } = useMap();
  const viewportKey = useMemo(() => {
    const structuralPoints = points.filter((point) => point.label !== 'Rider' && point.label !== 'Available Rider');
    const focusPoints = structuralPoints.length ? structuralPoints : points;

    return focusPoints
      .map((point) => `${point.label}:${point.lat.toFixed(4)}:${point.lng.toFixed(4)}`)
      .join('|');
  }, [points]);

  useEffect(() => {
    if (!isLoaded || !map || points.length === 0) {
      return;
    }

    const structuralPoints = points.filter((point) => point.label !== 'Rider' && point.label !== 'Available Rider');
    const focusPoints = structuralPoints.length ? structuralPoints : points;

    if (focusPoints.length === 1) {
      map.jumpTo({
        center: [focusPoints[0].lng, focusPoints[0].lat],
        zoom: 15.4,
      });
      return;
    }

    const lngs = focusPoints.map((point) => point.lng);
    const lats = focusPoints.map((point) => point.lat);

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 72,
        duration: 0,
        maxZoom: 15.2,
      },
    );
  }, [isLoaded, map, points, viewportKey]);

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    map.easeTo({
      bearing: is3D ? -18 : 0,
      pitch: is3D ? 60 : 0,
      duration: 260,
    });
  }, [is3D, isLoaded, map]);

  return null;
}

function RouteMarker({ point }: { point: RoutePoint }) {
  return (
    <MapMarker
      longitude={point.lng}
      latitude={point.lat}
      anchor="bottom"
      offset={[0, 6]}
    >
      <MarkerContent>
        <div className="pointer-events-none flex items-center gap-2">
          <span
            className="inline-flex h-4.5 w-4.5 rounded-full border-[3px] border-white shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
            style={{ backgroundColor: point.color }}
          />
          <span className="inline-flex rounded-none border border-border bg-background/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-md backdrop-blur-sm">
            {point.label}
          </span>
        </div>
      </MarkerContent>
      <MarkerPopup closeButton className="min-w-[220px] rounded-none border border-border p-4 bg-background">
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
            {point.label}
          </p>
          <p className="text-sm font-bold text-foreground tracking-tight">{point.title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{point.subtitle}</p>
        </div>
      </MarkerPopup>
    </MapMarker>
  );
}

import { AvailableRider } from '@/services/orderService';

export function OrderRouteMap({
  order,
  availableRiders = [],
  title = 'Delivery map',
  description = 'Shop, customer pin, and rider progress appear here when coordinates are available.',
  className,
  compact = false,
}: {
  order: OrderWithRoute;
  availableRiders?: AvailableRider[];
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const is3D = style === 'openstreetmap3d';
  const selectedStyle = mapStyles[style];

  const vendorPoint = useMemo<RoutePoint | null>(() => {
    const lat = order.vendor?.latitude != null ? Number(order.vendor.latitude) : null;
    const lng = order.vendor?.longitude != null ? Number(order.vendor.longitude) : null;

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      label: 'Shop',
      title: order.vendor?.name || 'Shop',
      subtitle: order.vendor?.address || 'Pickup point',
      color: '#ff5a00',
    };
  }, [order.vendor?.address, order.vendor?.latitude, order.vendor?.longitude, order.vendor?.name]);

  const customerPoint = useMemo<RoutePoint | null>(() => {
    const lat = order.deliveryLat != null ? Number(order.deliveryLat) : null;
    const lng = order.deliveryLng != null ? Number(order.deliveryLng) : null;

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      label: 'Customer',
      title: 'Delivery point',
      subtitle: order.deliveryAddress,
      color: '#3b82f6',
    };
  }, [order.deliveryAddress, order.deliveryLat, order.deliveryLng]);

  const riderPoint = useMemo<RoutePoint | null>(() => {
    const progressPoint = getProgressRiderPoint(order);

    if (!progressPoint) {
      return null;
    }

    return {
      lat: progressPoint.lat,
      lng: progressPoint.lng,
      label: 'Rider',
      title: 'Delivery progress',
      subtitle: `Status: ${statusLabel(order.status)}`,
      color: '#10b981',
    };
  }, [order]);

  const riderPoints = useMemo<RoutePoint[]>(() => {
    return availableRiders
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => {
        const lat = Number(r.lat);
        const lng = Number(r.lng);
        return {
          lat,
          lng,
          label: 'Available Rider' as const,
          title: r.name,
          subtitle: `Rider Status: ${r.status.toUpperCase()}${r.phone ? ` • ${r.phone}` : ''}`,
          color: r.status === 'available' ? '#8b5cf6' : '#6b7280',
        };
      });
  }, [availableRiders]);

  const points = useMemo(
    () => [vendorPoint, customerPoint, riderPoint, ...riderPoints].filter(Boolean) as RoutePoint[],
    [customerPoint, riderPoint, vendorPoint, riderPoints],
  );

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [remainingCoordinates, setRemainingCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!vendorPoint || !customerPoint) {
      setRouteCoordinates([]);
      return;
    }

    const controller = new AbortController();
    const fetchRoute = async () => {
      try {
        const url = `${OSRM_BASE_URL}/route/v1/driving/${vendorPoint.lng},${vendorPoint.lat};${customerPoint.lng},${customerPoint.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('OSRM request failed');
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          setRouteCoordinates(data.routes[0].geometry.coordinates as [number, number][]);
        } else {
          setRouteCoordinates([
            [vendorPoint.lng, vendorPoint.lat],
            [customerPoint.lng, customerPoint.lat],
          ]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setRouteCoordinates([
          [vendorPoint.lng, vendorPoint.lat],
          [customerPoint.lng, customerPoint.lat],
        ]);
      }
    };

    void fetchRoute();
    return () => controller.abort();
  }, [vendorPoint?.lat, vendorPoint?.lng, customerPoint?.lat, customerPoint?.lng]);

  useEffect(() => {
    if (!riderPoint || !customerPoint) {
      setRemainingCoordinates([]);
      return;
    }

    if (riderPoint.lng === customerPoint.lng && riderPoint.lat === customerPoint.lat) {
      setRemainingCoordinates([]);
      return;
    }

    const controller = new AbortController();
    const fetchRoute = async () => {
      try {
        const url = `${OSRM_BASE_URL}/route/v1/driving/${riderPoint.lng},${riderPoint.lat};${customerPoint.lng},${customerPoint.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('OSRM request failed');
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          setRemainingCoordinates(data.routes[0].geometry.coordinates as [number, number][]);
        } else {
          setRemainingCoordinates([
            [riderPoint.lng, riderPoint.lat],
            [customerPoint.lng, customerPoint.lat],
          ]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setRemainingCoordinates([
          [riderPoint.lng, riderPoint.lat],
          [customerPoint.lng, customerPoint.lat],
        ]);
      }
    };

    void fetchRoute();
    return () => controller.abort();
  }, [riderPoint?.lat, riderPoint?.lng, customerPoint?.lat, customerPoint?.lng]);

  const initialCenter: [number, number] = points[0]
    ? [points[0].lng, points[0].lat]
    : fallbackCenter;

  if (points.length === 0) {
    return (
      <div className={cn("p-6 md:p-8 space-y-4 text-foreground", className)}>
        <div>
          <h3 className="text-2xl font-medium tracking-tighter">{title}</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">{description}</p>
        </div>
        <div className="border border-border bg-secondary/5 px-6 py-8 text-sm text-muted-foreground font-medium rounded-none">
          This order does not have enough location data yet. Set a delivery pin during checkout to enable map tracking.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 md:p-8 space-y-6 text-foreground", className)}>
      {(title || description) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-2xl font-medium tracking-tighter">{title}</h3>}
            {description && <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">{description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shop</span>
            <span className="border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">Rider</span>
            <span className="border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">Customer</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative overflow-hidden border border-border bg-background rounded-none",
          compact ? "h-64" : "h-[400px]"
        )}
      >
        <Map
          center={initialCenter}
          zoom={13.8}
          className="h-full w-full"
          styles={selectedStyle}
        >
          <RouteViewportController points={points} is3D={is3D} />

          {routeCoordinates.length >= 2 ? (
            <MapRoute
              coordinates={routeCoordinates}
              color="#3b82f6"
              width={6}
              opacity={0.85}
              interactive={false}
            />
          ) : null}

          {remainingCoordinates.length >= 2 ? (
            <MapRoute
              coordinates={remainingCoordinates}
              color="#ff5a00"
              width={6}
              opacity={0.95}
              interactive={false}
            />
          ) : null}

          {points.map((point) => (
            <RouteMarker
              key={`${point.label}-${point.lat.toFixed(5)}-${point.lng.toFixed(5)}`}
              point={point}
            />
          ))}

          <MapControls
            position="bottom-right"
            showZoom
            showCompass
            showLocate
            showFullscreen
          />
        </Map>

        <div className="absolute right-3 top-3 z-10">
          <MapStyleSelect value={style} onChange={setStyle} />
        </div>
      </div>
    </div>
  );
}
