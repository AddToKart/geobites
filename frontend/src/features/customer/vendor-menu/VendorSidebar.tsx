import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, MapPin, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapStyleSelect } from '@/components/maps/MapStyleSelect';
import { mapStyles, type MapStyleKey } from '@/components/maps/map-styles';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import type { DemoVendor } from '@/data/demoVendors';
import type { Vendor } from '@/types';
import { formatCurrency } from '@/utils/helpers';

function VendorMapCamera({
  vendor,
  is3D,
}: {
  vendor: Vendor;
  is3D: boolean;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    map.jumpTo({
      center: [vendor.longitude, vendor.latitude],
      zoom: 15.1,
    });
  }, [isLoaded, map, vendor.latitude, vendor.longitude]);

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

export function VendorSidebar({
  cartCount,
  cartTotal,
  vendor,
  vendorMeta,
  style,
  onStyleChange,
}: {
  cartCount: number;
  cartTotal: number;
  vendor: Vendor;
  vendorMeta: DemoVendor | null;
  style: MapStyleKey;
  onStyleChange: (value: MapStyleKey) => void;
}) {
  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

  return (
    <div className="space-y-4 xl:sticky xl:top-8 xl:self-start">
      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <p className="eyebrow">Cart</p>
            <h2 className="mt-2 text-2xl font-semibold">{cartCount} item(s)</h2>
            <p className="subtle-copy">
              Keep everything from one vendor together and check out when you are ready.
            </p>
          </div>
          <div className="panel-muted space-y-3 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-text-soft)]">Current subtotal</span>
              <span className="font-semibold text-[color:var(--color-text)]">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-text-soft)]">Vendor</span>
              <span className="font-medium text-[color:var(--color-text)]">{vendor.name}</span>
            </div>
          </div>
          {cartCount > 0 ? (
            <Button asChild>
              <Link to="/cart">
                <ShoppingBag className="h-4 w-4" />
                Go to cart
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <ShoppingBag className="h-4 w-4" />
              Go to cart
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Shop map</h2>
              <p className="subtle-copy">See the pickup point customers and riders use.</p>
            </div>
            <Badge>{vendorMeta?.neighborhood || 'Local shop'}</Badge>
          </div>

          <div className="relative h-72 overflow-hidden rounded-[24px] border border-[color:var(--color-border)]">
            <Map
              center={[vendor.longitude, vendor.latitude]}
              zoom={15}
              className="h-full w-full"
              styles={selectedStyle}
            >
              <VendorMapCamera vendor={vendor} is3D={is3D} />
              <MapMarker longitude={vendor.longitude} latitude={vendor.latitude} anchor="bottom" offset={[0, 6]}>
                <MarkerContent>
                  <div className="pointer-events-none flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#eb6a2d] shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
                    <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                      Shop
                    </span>
                  </div>
                </MarkerContent>
                <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                      Pickup point
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--color-text)]">
                      {vendor.name}
                    </p>
                    <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                      {vendor.address}
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
              <MapControls position="bottom-right" showZoom showCompass showFullscreen />
            </Map>

            <div className="absolute right-3 top-3 z-10">
              <MapStyleSelect value={style} onChange={onStyleChange} />
            </div>
          </div>

          <div className="panel-muted space-y-2 px-4 py-4 text-sm text-[color:var(--color-text-soft)]">
            <p>{vendor.address}</p>
            <p>
              {vendorMeta?.priceBand || '₱₱'} • {vendorMeta?.etaMinutes || '20-35 min'}
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span>{vendorMeta?.neighborhood || 'Santa Maria'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span>{vendorMeta?.etaMinutes || '20-35 min'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
