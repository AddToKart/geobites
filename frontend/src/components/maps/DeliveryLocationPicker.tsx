import { useEffect, useState } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import { CheckCircle2, Loader2, LocateFixed, MapPinned } from 'lucide-react';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  is3D,
  onPick,
}: {
  center: { lat: number; lng: number };
  is3D: boolean;
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    map.jumpTo({
      center: [center.lng, center.lat],
      zoom: Math.max(map.getZoom(), 15),
    });
  }, [center, isLoaded, map]);

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
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-[color:var(--color-text-soft)]">{description}</p>
            </div>
            <Badge variant={value ? 'success' : 'warning'}>
              {value ? 'Pin ready' : 'Pin needed'}
            </Badge>
          </div>

          <div className="panel-muted space-y-2 px-4 py-4">
            <p className="text-sm text-[color:var(--color-text)]">
              {value ? selectedText(value) : emptyText}
            </p>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              The modal picker traps focus properly and keeps the full map accessible without stretching the page layout.
            </p>
          </div>

          <DialogTrigger asChild>
            <Button type="button">
              <MapPinned className="h-4 w-4" />
              {value ? 'Edit pin on map' : 'Open map picker'}
            </Button>
          </DialogTrigger>
        </CardContent>
      </Card>

      <DialogContent className="max-w-[min(100vw-2rem,72rem)] gap-0 overflow-hidden rounded-[28px] border border-[color:var(--color-shell-border)] bg-[color:var(--color-card)] p-0 sm:max-w-[min(100vw-2rem,72rem)]">
        <div className="space-y-5 p-5 md:p-6">
          <DialogHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold text-[color:var(--color-text)]">
                  {title}
                </DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-6 text-[color:var(--color-text-soft)]">
                  Click anywhere on the map, drag the pin, or use your current location to set the exact point that shows up in tracking.
                </DialogDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{draftCoords ? 'Draft pin ready' : 'Pick a point'}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={useMyLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                  {actionLabel}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--color-border)]">
            <Map
              center={[center.lng, center.lat]}
              zoom={15}
              className="h-[min(70vh,36rem)] w-full"
              styles={selectedStyle}
            >
              <DeliveryPickerInteractions center={center} is3D={is3D} onPick={applyDraftCoords} />

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
                      <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[color:var(--color-primary-dark)] shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
                      <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                        {markerLabel}
                      </span>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                        {popupEyebrow}
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        {popupTitle}
                      </p>
                      <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
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

        <div className="flex flex-col gap-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/76 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[color:var(--color-text)]">
              {draftCoords ? selectedText(draftCoords) : emptyText}
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
              The pin is only saved when you confirm it here.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSelection} disabled={!draftCoords}>
              <CheckCircle2 className="h-4 w-4" />
              Use this pin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
