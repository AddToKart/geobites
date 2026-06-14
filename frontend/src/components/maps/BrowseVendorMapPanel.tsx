import { useEffect, useState } from 'react';
import { ArrowRight, Star, Clock, X, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { defaultMapStyle, mapStyles, type MapStyleKey } from '@/components/maps/map-styles';
import { getVendorMenu } from '@/services/menuService';
import { formatCurrency } from '@/utils/helpers';
import type { MenuItem } from '@/types';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from '@/components/ui/map';
import { cn } from '@/lib/utils';

type BrowseMapVendor = {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  etaMinutes?: string;
  neighborhood?: string;
  specialties?: string[];
  spotlight?: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  priceBand?: string;
};

function BrowseMapViewport({
  vendorPoints,
  centerPoint,
  is3D,
  onDeselect,
}: {
  vendorPoints: BrowseMapVendor[];
  centerPoint: { lat: number; lng: number };
  is3D: boolean;
  onDeselect: () => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    const handleMapClick = (e: any) => {
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target && (target.closest('.maplibregl-marker') || target.closest('.maplibregl-ctrl'))) {
        return;
      }
      onDeselect();
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isLoaded, map, onDeselect]);

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    const points = vendorPoints.length
      ? vendorPoints.map((vendor) => ({ lat: vendor.latitude, lng: vendor.longitude }))
      : [centerPoint];

    if (points.length === 1) {
      map.jumpTo({
        center: [points[0].lng, points[0].lat],
        zoom: 14.3,
      });
      return;
    }

    const lngs = points.map((point) => point.lng);
    const lats = points.map((point) => point.lat);

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 88,
        duration: 0,
        maxZoom: 14.7,
      },
    );
  }, [centerPoint, isLoaded, map, vendorPoints]);

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

function BrowseVendorSidePanel({
  vendor,
  onClose,
}: {
  vendor: BrowseMapVendor;
  onClose: () => void;
}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getVendorMenu(vendor.id)
      .then((data) => {
        if (active) {
          setMenuItems(data.slice(0, 3));
        }
      })
      .catch((err) => {
        console.error('Failed to load menu for side panel:', err);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [vendor.id]);

  return (
    <div className="absolute bottom-4 left-4 z-10 w-[380px] max-h-[calc(100%-8rem)] md:max-h-[630px] bg-background border border-border flex flex-col text-foreground shadow-2xl animate-in slide-in-from-bottom duration-300 rounded-none">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 h-8 w-8 flex items-center justify-center border border-border bg-background hover:bg-secondary text-foreground transition-colors cursor-pointer"
        aria-label="Close details"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="h-32 w-full border-b border-border bg-secondary/10 relative overflow-hidden flex-shrink-0">
        {vendor.imageUrl ? (
          <img
            src={vendor.imageUrl}
            alt={vendor.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🍲
          </div>
        )}
        {vendor.spotlight && (
          <span className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            {vendor.spotlight}
          </span>
        )}
      </div>

      <div className="p-5 border-b border-border flex-shrink-0">
        <h2 className="text-2xl font-medium tracking-tighter mb-1 text-foreground pr-8 truncate">
          {vendor.name}
        </h2>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          <span className="flex items-center gap-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            {vendor.rating?.toFixed(1) || '0.0'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {vendor.etaMinutes || '20-30 min'}
          </span>
          <span>•</span>
          <span className="text-primary">{vendor.priceBand || '₱₱'}</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex items-start gap-1">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{vendor.address}</span>
        </p>

        <Link
          to={`/vendors/${vendor.id}`}
          className="w-full h-12 bg-primary hover:bg-primary-dark text-primary-foreground font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-colors rounded-none"
        >
          View Full Menu & Order
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {vendor.specialties && vendor.specialties.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-3">
              Specialties
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4">
            Menu Highlights
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : menuItems.length > 0 ? (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-start pb-4 border-b border-border/50 last:border-none last:pb-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-secondary/15 flex items-center justify-center text-2xl border border-border shrink-0">
                      🍲
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{item.name}</h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-sm font-bold mt-2 text-primary">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">
              No menu items highlighted yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrowseVendorMapPanel({
  vendors,
  selectedVendor,
  centerPoint,
  onSelectVendor,
  onLocate,
}: {
  vendors: BrowseMapVendor[];
  selectedVendor: BrowseMapVendor | null;
  centerPoint: { lat: number; lng: number };
  onSelectVendor: (vendorId: string | null) => void;
  onLocate: (coords: { lat: number; lng: number }) => void;
}) {
  const [style] = useState<MapStyleKey>(defaultMapStyle);
  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (selectedVendor) {
      setIsPanelOpen(true);
    }
  }, [selectedVendor]);

  return (
    <div className="absolute inset-0 z-0 w-full h-full relative">
      <Map
        center={[centerPoint.lng, centerPoint.lat]}
        zoom={14.2}
        className="h-full w-full"
        styles={selectedStyle}
      >
        <BrowseMapViewport
          vendorPoints={vendors}
          centerPoint={centerPoint}
          is3D={is3D}
          onDeselect={() => {
            onSelectVendor(null);
            setIsPanelOpen(false);
          }}
        />

        <MapMarker longitude={centerPoint.lng} latitude={centerPoint.lat} anchor="bottom" offset={[0, 6]}>
          <MarkerContent>
            <div className="pointer-events-none flex items-center gap-2">
              <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
              <span className="inline-flex rounded-full bg-black/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-md backdrop-blur-md">
                You are here
              </span>
            </div>
          </MarkerContent>
        </MapMarker>

        {vendors.map((vendor) => {
          const isSelected = vendor.id === selectedVendor?.id;

          return (
            <MapMarker
              key={vendor.id}
              longitude={vendor.longitude}
              latitude={vendor.latitude}
              anchor="bottom"
              offset={[0, 4]}
              onClick={() => onSelectVendor(vendor.id)}
            >
              <MarkerContent>
                <div className="pointer-events-none flex flex-col items-center">
                  {isSelected ? (
                    <span className="mb-1 inline-flex rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white shadow-xl transition-all duration-300 transform scale-110">
                      {vendor.name}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'relative inline-flex h-5 w-5 rounded-full border-[3px] border-white shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition-all duration-300',
                      isSelected ? 'bg-black scale-125' : 'bg-primary hover:scale-110',
                    )}
                  />
                </div>
              </MarkerContent>
            </MapMarker>
          );
        })}

        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
          onLocate={({ latitude, longitude }) => onLocate({ lat: latitude, lng: longitude })}
        />
      </Map>

      {/* Floating Side Info Panel */}
      {selectedVendor && isPanelOpen && (
        <BrowseVendorSidePanel
          vendor={selectedVendor}
          onClose={() => {
            setIsPanelOpen(false);
            onSelectVendor(null);
          }}
        />
      )}
    </div>
  );
}
