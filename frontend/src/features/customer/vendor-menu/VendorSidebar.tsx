import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, MapPin, ShoppingBag } from 'lucide-react';
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
    <div className="space-y-8 xl:sticky xl:top-8 xl:self-start">
      <div className="border border-border p-8 bg-background">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Your Cart</p>
        <h2 className="text-4xl font-medium tracking-tighter text-foreground mb-8">
          {cartCount} item(s)
        </h2>
        
        <div className="border-t border-border pt-6 space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Subtotal</span>
            <span className="text-2xl font-medium tracking-tighter text-foreground">
              {formatCurrency(cartTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Vendor</span>
            <span className="text-sm font-bold text-foreground text-right max-w-[150px] truncate">{vendor.name}</span>
          </div>
        </div>

        {cartCount > 0 ? (
          <Link to="/cart" className="flex items-center justify-center gap-2 w-full border border-border bg-foreground text-background py-4 px-6 font-bold uppercase tracking-widest hover:opacity-90 transition-colors">
            <ShoppingBag className="h-5 w-5" />
            Go to checkout
          </Link>
        ) : (
          <button disabled className="flex items-center justify-center gap-2 w-full border border-border bg-secondary/50 text-muted-foreground py-4 px-6 font-bold uppercase tracking-widest cursor-not-allowed">
            <ShoppingBag className="h-5 w-5" />
            Go to checkout
          </button>
        )}
      </div>

      <div className="border border-border p-8 bg-background">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-medium tracking-tighter">Location</h2>
          <span className="text-xs font-bold uppercase tracking-widest bg-foreground text-background px-3 py-1">
            {vendorMeta?.neighborhood || 'Local shop'}
          </span>
        </div>

        <div className="relative h-64 overflow-hidden border border-border mb-8">
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
                  <span className="inline-flex h-4 w-4 rounded-full border-2 border-background bg-primary" />
                  <span className="inline-flex border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
                    Shop
                  </span>
                </div>
              </MarkerContent>
              <MarkerPopup closeButton className="min-w-[200px] border border-border bg-background p-4 rounded-none shadow-none">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Pickup point
                  </p>
                  <p className="text-base font-medium tracking-tighter text-foreground">
                    {vendor.name}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {vendor.address}
                  </p>
                </div>
              </MarkerPopup>
            </MapMarker>
            <MapControls position="bottom-right" showZoom showCompass showFullscreen />
          </Map>

          <div className="absolute right-2 top-2 z-10">
            <MapStyleSelect value={style} onChange={onStyleChange} />
          </div>
        </div>

        <div className="space-y-4 text-sm font-bold text-muted-foreground">
          <p className="text-foreground">{vendor.address}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{vendorMeta?.neighborhood || 'Santa Maria'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <span>{vendorMeta?.etaMinutes || '20-35 min'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
