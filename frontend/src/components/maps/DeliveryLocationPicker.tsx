import { useEffect, useState } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import { CheckCircle2, Loader2, LocateFixed, MapPinned } from 'lucide-react';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MapStyleSelect } from './MapStyleSelect';
import { defaultMapStyle, mapStyles, type MapStyleKey } from './map-styles';

const fallbackCenter = santaMariaBulacanCenter;

function DeliveryPickerInteractions({
  center,
  vendorCoords,
  draftCoords,
  is3D,
  hasFitBounds,
  onFitBounds,
  onPick,
}: {
  center: { lat: number; lng: number };
  vendorCoords?: { lat: number; lng: number } | null;
  draftCoords?: { lat: number; lng: number } | null;
  is3D: boolean;
  hasFitBounds: boolean;
  onFitBounds: () => void;
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    if (vendorCoords && draftCoords) {
      if (!hasFitBounds) {
        const lngs = [vendorCoords.lng, draftCoords.lng];
        const lats = [vendorCoords.lat, draftCoords.lat];
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          {
            padding: 80,
            duration: 0,
            maxZoom: 15.5,
          }
        );
        onFitBounds();
      }
    } else {
      map.jumpTo({
        center: [center.lng, center.lat],
        zoom: Math.max(map.getZoom(), 15),
      });
    }
  }, [isLoaded, map, center, vendorCoords, draftCoords, hasFitBounds, onFitBounds]);

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

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    const handleClick = (event: MapMouseEvent) => {
      onPick({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [isLoaded, map, onPick]);

  return null;
}

export function DeliveryLocationPicker({
  value,
  onChange,
  vendorCoords = null,
  title = 'Delivery pin',
  description = 'Open the map picker to place the exact drop-off point for the rider.',
  actionLabel = 'Use my location',
  markerLabel = 'Delivery pin',
  popupEyebrow = 'Delivery point',
  popupTitle = 'Exact drop-off location',
  popupDescription = 'Drag this pin to fine-tune the address the rider should follow.',
  selectedText = (coords) =>
    `Pin set at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
  emptyText = 'No delivery pin selected yet.',
  initialCenter = fallbackCenter,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  vendorCoords?: { lat: number; lng: number } | null;
  title?: string;
  description?: string;
  actionLabel?: string;
  markerLabel?: string;
  popupEyebrow?: string;
  popupTitle?: string;
  popupDescription?: string;
  selectedText?: (coords: { lat: number; lng: number }) => string;
  emptyText?: string;
  initialCenter?: { lat: number; lng: number };
}) {
  const [open, setOpen] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(value ?? initialCenter);
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lng: number } | null>(value);
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const [isLocating, setIsLocating] = useState(false);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (open) {
      setHasFitBounds(false);
    }
  }, [open]);

  useEffect(() => {
    if (!vendorCoords || !draftCoords) {
      setRouteCoords([]);
      return;
    }

    const controller = new AbortController();

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${vendorCoords.lng},${vendorCoords.lat};${draftCoords.lng},${draftCoords.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('OSRM request failed');
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates as [number, number][];
          setRouteCoords(coords);
        } else {
          setRouteCoords([
            [vendorCoords.lng, vendorCoords.lat],
            [draftCoords.lng, draftCoords.lat]
          ]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setRouteCoords([
          [vendorCoords.lng, vendorCoords.lat],
          [draftCoords.lng, draftCoords.lat]
        ]);
      }
    };

    const timer = setTimeout(() => {
      void fetchRoute();
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [vendorCoords, draftCoords]);

  useEffect(() => {
    if (value) {
      setCenter(value);
      if (!open) {
        setDraftCoords(value);
      }
      return;
    }

    if (open) {
      setDraftCoords(null);
    }

    if (!navigator.geolocation) {
      setCenter(initialCenter);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCenter({
          lat: coords.latitude,
          lng: coords.longitude,
        });
      },
      () => {
        setCenter(initialCenter);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }, [initialCenter, open, value]);

  useEffect(() => {
    if (!open) {
      setDraftCoords(value);
      return;
    }

    if (value) {
      setDraftCoords(value);
      setCenter(value);
    }
  }, [open, value]);

  const applyDraftCoords = (coords: { lat: number; lng: number }) => {
    setCenter(coords);
    setDraftCoords(coords);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        applyDraftCoords({
          lat: coords.latitude,
          lng: coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  };

  const confirmSelection = () => {
    if (!draftCoords) {
      return;
    }

    onChange(draftCoords);
    setOpen(false);
  };

  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
            value 
              ? 'border-green-500/30 bg-green-500/10 text-green-500' 
              : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
          }`}>
            {value ? 'Pin ready' : 'Pin needed'}
          </span>
        </div>

        <div className="border border-border bg-secondary/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {value ? selectedText(value) : emptyText}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <DialogTrigger asChild>
            <button
              type="button"
              className="h-11 px-5 border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors duration-150 shrink-0"
            >
              <MapPinned className="h-4 w-4" />
              {value ? 'Edit pin' : 'Open map'}
            </button>
          </DialogTrigger>
        </div>
      </div>

      <DialogContent className="max-w-[min(100vw-2rem,72rem)] gap-0 overflow-hidden rounded-none border border-border bg-background p-0 sm:max-w-[min(100vw-2rem,72rem)]">
        <div className="space-y-5 p-5 md:p-6">
          <DialogHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-medium tracking-tighter text-foreground">
                  {title}
                </DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Click anywhere on the map, drag the pin, or use your current location to set the exact point that shows up in tracking.
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  draftCoords 
                    ? 'border-green-500/30 bg-green-500/10 text-green-500' 
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                }`}>
                  {draftCoords ? 'Draft pin ready' : 'Pick a point'}
                </span>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={isLocating}
                  className="h-10 px-4 border border-border bg-transparent text-foreground hover:bg-secondary font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                  {actionLabel}
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="relative overflow-hidden border border-border rounded-none">
            <Map
              center={[center.lng, center.lat]}
              zoom={15}
              className="h-[min(70vh,36rem)] w-full"
              styles={selectedStyle}
            >
              <DeliveryPickerInteractions
                center={center}
                vendorCoords={vendorCoords}
                draftCoords={draftCoords}
                is3D={is3D}
                hasFitBounds={hasFitBounds}
                onFitBounds={() => setHasFitBounds(true)}
                onPick={applyDraftCoords}
              />

              {routeCoords.length > 0 ? (
                <MapRoute
                  coordinates={routeCoords}
                  color="#4285F4"
                  width={6}
                  opacity={0.85}
                  interactive={false}
                />
              ) : null}

              {vendorCoords ? (
                <MapMarker
                  longitude={vendorCoords.lng}
                  latitude={vendorCoords.lat}
                  anchor="bottom"
                  offset={[0, 6]}
                >
                  <MarkerContent>
                    <div className="pointer-events-none flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-foreground shadow-lg" />
                      <span className="inline-flex rounded-none border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-md backdrop-blur-sm">
                        Store
                      </span>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton className="min-w-[220px] rounded-none border border-border p-4 bg-background">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Pickup point
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        Restaurant
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        The vendor where your food will be freshly prepared.
                      </p>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ) : null}

              {draftCoords ? (
                <MapMarker
                  longitude={draftCoords.lng}
                  latitude={draftCoords.lat}
                  anchor="bottom"
                  draggable
                  offset={[0, 6]}
                  onDragEnd={({ lat, lng }) => applyDraftCoords({ lat, lng })}
                >
                  <MarkerContent>
                    <div className="pointer-events-none flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-primary shadow-lg" />
                      <span className="inline-flex rounded-none border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-md backdrop-blur-sm">
                        {markerLabel}
                      </span>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton className="min-w-[220px] rounded-none border border-border p-4 bg-background">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {popupEyebrow}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {popupTitle}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {popupDescription}
                      </p>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ) : null}

              <MapControls
                position="bottom-right"
                showZoom
                showCompass
                showLocate
                showFullscreen
                onLocate={({ latitude, longitude }) =>
                  applyDraftCoords({
                    lat: latitude,
                    lng: longitude,
                  })
                }
              />
            </Map>

            <div className="absolute right-3 top-3 z-10">
              <MapStyleSelect value={style} onChange={setStyle} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-secondary/5 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {draftCoords ? selectedText(draftCoords) : emptyText}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The pin is only saved when you confirm it here.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-12 px-6 border border-border bg-transparent text-foreground hover:bg-secondary font-bold uppercase tracking-widest text-xs transition-colors rounded-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSelection}
              disabled={!draftCoords}
              className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary-dark font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 rounded-none"
            >
              <CheckCircle2 className="h-4 w-4" />
              Use this pin
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
