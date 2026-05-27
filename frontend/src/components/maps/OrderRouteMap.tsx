import { useEffect, useMemo, useState } from 'react';
import { Map, MapControls, MapMarker, MapRoute, MarkerContent, MarkerPopup, useMap } from '@/components/ui/map';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Order, Vendor } from '@/types';
import { MapStyleSelect } from './MapStyleSelect';
import { defaultMapStyle, mapStyles, type MapStyleKey } from './map-styles';

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
  label: 'Shop' | 'Customer' | 'Rider';
  title: string;
  subtitle: string;
  color: string;
};

const fallbackCenter: [number, number] = [120.9842, 14.5995]; // Manila, PH

function statusLabel(status: OrderWithRoute['status']) {
  return status.replaceAll('_', ' ');
}

function getProgressRiderPoint(order: OrderWithRoute) {
  if (typeof order.riderLat === 'number' && typeof order.riderLng === 'number') {
    return {
      lat: order.riderLat,
      lng: order.riderLng,
    };
  }

  const vendor =
    typeof order.vendor?.latitude === 'number' && typeof order.vendor?.longitude === 'number'
      ? { lat: Number(order.vendor.latitude), lng: Number(order.vendor.longitude) }
      : null;
  const customer =
    typeof order.deliveryLat === 'number' && typeof order.deliveryLng === 'number'
      ? { lat: order.deliveryLat, lng: order.deliveryLng }
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
    const structuralPoints = points.filter((point) => point.label !== 'Rider');
    const focusPoints = structuralPoints.length ? structuralPoints : points;

    return focusPoints
      .map((point) => `${point.label}:${point.lat.toFixed(4)}:${point.lng.toFixed(4)}`)
      .join('|');
  }, [points]);

  useEffect(() => {
    if (!isLoaded || !map || points.length === 0) {
      return;
    }

    const structuralPoints = points.filter((point) => point.label !== 'Rider');
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
            className="inline-flex h-4 w-4 rounded-full border-[3px] border-white shadow-[0_12px_22px_rgba(15,23,42,0.26)]"
            style={{ backgroundColor: point.color }}
          />
          <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
            {point.label}
          </span>
        </div>
      </MarkerContent>
      <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
            {point.label}
          </p>
          <p className="text-sm font-semibold text-[color:var(--color-text)]">{point.title}</p>
          <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">{point.subtitle}</p>
        </div>
      </MarkerPopup>
    </MapMarker>
  );
}

export function OrderRouteMap({
  order,
  title = 'Delivery map',
  description = 'Shop, customer pin, and rider progress appear here when coordinates are available.',
  className,
  compact = false,
}: {
  order: OrderWithRoute;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const is3D = style === 'openstreetmap3d';
  const selectedStyle = mapStyles[style];

  const vendorPoint = useMemo<RoutePoint | null>(() => {
    if (typeof order.vendor?.latitude !== 'number' || typeof order.vendor?.longitude !== 'number') {
      return null;
    }

    return {
      lat: Number(order.vendor.latitude),
      lng: Number(order.vendor.longitude),
      label: 'Shop',
      title: order.vendor?.name || 'Shop',
      subtitle: order.vendor?.address || 'Pickup point',
      color: '#eb6a2d',
    };
  }, [order.vendor?.address, order.vendor?.latitude, order.vendor?.longitude, order.vendor?.name]);

  const customerPoint = useMemo<RoutePoint | null>(() => {
    if (typeof order.deliveryLat !== 'number' || typeof order.deliveryLng !== 'number') {
      return null;
    }

    return {
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      label: 'Customer',
      title: 'Delivery point',
      subtitle: order.deliveryAddress,
      color: '#223547',
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
      color: '#1f8c56',
    };
  }, [order]);

  const points = useMemo(
    () => [vendorPoint, customerPoint, riderPoint].filter(Boolean) as RoutePoint[],
    [customerPoint, riderPoint, vendorPoint],
  );

  const routeCoordinates = useMemo<[number, number][]>(
    () =>
      vendorPoint && customerPoint
        ? [
            [vendorPoint.lng, vendorPoint.lat],
            [customerPoint.lng, customerPoint.lat],
          ]
        : [],
    [customerPoint, vendorPoint],
  );

  const remainingCoordinates = useMemo<[number, number][]>(
    () =>
      riderPoint &&
      customerPoint &&
      (riderPoint.lng !== customerPoint.lng || riderPoint.lat !== customerPoint.lat)
        ? [
            [riderPoint.lng, riderPoint.lat],
            [customerPoint.lng, customerPoint.lat],
          ]
        : [],
    [customerPoint, riderPoint],
  );

  const initialCenter: [number, number] = points[0]
    ? [points[0].lng, points[0].lat]
    : fallbackCenter;

  if (points.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="space-y-3 p-5">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-[color:var(--color-text-soft)]">{description}</p>
          </div>
          <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
            This order does not have enough location data yet. Set a delivery pin during checkout to enable map tracking.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-[color:var(--color-text-soft)]">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Shop</Badge>
            <Badge variant="success">Rider</Badge>
            <Badge variant="warning">Customer</Badge>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-[24px] border border-[color:var(--color-border)] ${compact ? 'h-64' : 'h-80'}`}
        >
          <Map
            center={initialCenter}
            zoom={13.8}
            className="h-full w-full"
            styles={selectedStyle}
          >
            <RouteViewportController points={points} is3D={is3D} />

            {routeCoordinates.length === 2 ? (
              <MapRoute
                coordinates={routeCoordinates}
                color="#d6b487"
                width={4}
                opacity={0.82}
                dashArray={[2, 2]}
                interactive={false}
              />
            ) : null}

            {remainingCoordinates.length === 2 ? (
              <MapRoute
                coordinates={remainingCoordinates}
                color="#1f8c56"
                width={4}
                opacity={0.9}
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
      </CardContent>
    </Card>
  );
}
