import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, MapPin } from 'lucide-react';
import { MapStyleSelect } from '@/components/maps/MapStyleSelect';
import { defaultMapStyle, mapStyles, type MapStyleKey } from '@/components/maps/map-styles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
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
};

function BrowseMapViewport({
  vendorPoints,
  centerPoint,
  is3D,
}: {
  vendorPoints: BrowseMapVendor[];
  centerPoint: { lat: number; lng: number };
  is3D: boolean;
}) {
  const { map, isLoaded } = useMap();

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

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return 'Santa Maria area';
  }

  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m away`
    : `${distanceKm.toFixed(1)} km away`;
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
  onSelectVendor: (vendorId: string) => void;
  onLocate: (coords: { lat: number; lng: number }) => void;
}) {
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

  return (
    <div className="panel-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Santa Maria shop map</h2>
          <p className="subtle-copy">
            A bigger map view with local pins, 3D mode, and a live selected-shop panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{vendors.length} pins</Badge>
          <Badge variant="success">{formatDistanceLabel(0)}</Badge>
        </div>
      </div>

      <div className="relative h-[min(76vh,760px)] min-h-[560px] overflow-hidden rounded-[28px] border border-[color:var(--color-border)]">
        <Map
          center={[centerPoint.lng, centerPoint.lat]}
          zoom={14.2}
          className="h-full w-full"
          styles={selectedStyle}
        >
          <BrowseMapViewport vendorPoints={vendors} centerPoint={centerPoint} is3D={is3D} />

          <MapMarker longitude={centerPoint.lng} latitude={centerPoint.lat} anchor="bottom" offset={[0, 6]}>
            <MarkerContent>
              <div className="pointer-events-none flex items-center gap-2">
                <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#223547] shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
                <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                  Anchor
                </span>
              </div>
            </MarkerContent>
            <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                  Browse center
                </p>
                <p className="text-sm font-semibold text-[color:var(--color-text)]">
                  Santa Maria, Bulacan
                </p>
                <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                  This is the default local anchor for distance sorting and browse focus.
                </p>
              </div>
            </MarkerPopup>
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
                  <div className="pointer-events-none flex items-center gap-2">
                    <span
                      className={cn(
                        'relative inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#eb6a2d] shadow-[0_12px_22px_rgba(15,23,42,0.22)] transition duration-200',
                        isSelected && 'scale-125 bg-[#223547]',
                      )}
                    />
                    {isSelected ? (
                      <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                        {vendor.name}
                      </span>
                    ) : null}
                  </div>
                </MarkerContent>
                <MarkerPopup closeButton className="min-w-[260px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                        {vendor.neighborhood || 'Santa Maria'}
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        {vendor.name}
                      </p>
                      <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                        {vendor.address}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(vendor.specialties || []).slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[color:var(--color-text-soft)]"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/vendor/${vendor.id}`}>Open menu</Link>
                    </Button>
                  </div>
                </MarkerPopup>
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

        <div className="absolute right-3 top-3 z-10">
          <MapStyleSelect value={style} onChange={setStyle} />
        </div>

        {selectedVendor ? (
          <div className="absolute bottom-4 left-4 z-10 hidden max-w-sm rounded-[24px] border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] p-4 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm md:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                  Highlighted shop
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                  {selectedVendor.name}
                </h3>
              </div>
              <Badge>{selectedVendor.spotlight || 'Nearby'}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-soft)]">
              {selectedVendor.description}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-[color:var(--color-text-soft)]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <span>{selectedVendor.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <span>{selectedVendor.etaMinutes || '20-35 min'}</span>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link to={`/vendor/${selectedVendor.id}`}>Open menu</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
