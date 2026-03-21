import { useEffect, useState } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

    map.easeTo({
      center: [center.lng, center.lat],
      zoom: Math.max(map.getZoom(), 15),
      bearing: is3D ? -18 : 0,
      pitch: is3D ? 60 : 0,
      duration: 900,
    });
  }, [center, is3D, isLoaded, map]);

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
  description = 'Click the map or drag the pin to set the exact drop-off point.',
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
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(value);
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);

  useEffect(() => {
    if (value) {
      setCenter(value);
      return;
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
  }, [initialCenter, value]);

  const applyCoords = (coords: { lat: number; lng: number }) => {
    setCenter(coords);
    onChange(coords);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        applyCoords({
          lat: coords.latitude,
          lng: coords.longitude,
        });
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  };

  const mapCenter = center ?? initialCenter;
  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-[color:var(--color-text-soft)]">{description}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={useMyLocation}>
            {actionLabel}
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--color-border)]">
          <Map
            center={[mapCenter.lng, mapCenter.lat]}
            zoom={15}
            className="h-72 w-full"
            styles={selectedStyle}
          >
            <DeliveryPickerInteractions center={mapCenter} is3D={is3D} onPick={applyCoords} />

            {value ? (
              <MapMarker
                longitude={value.lng}
                latitude={value.lat}
                anchor="bottom"
                draggable
                offset={[0, 6]}
                onDragEnd={({ lat, lng }) => applyCoords({ lat, lng })}
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

            <MapControls position="bottom-right" showZoom showCompass showFullscreen />
          </Map>

          <div className="absolute right-3 top-3 z-10">
            <MapStyleSelect value={style} onChange={setStyle} />
          </div>
        </div>

        {value ? (
          <p className="text-xs text-[color:var(--color-text-muted)]">{selectedText(value)}</p>
        ) : (
          <p className="text-xs text-[color:var(--color-text-muted)]">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}
