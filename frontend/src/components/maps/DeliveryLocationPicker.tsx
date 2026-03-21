import { useEffect, useState } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
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

const fallbackCenter = { lat: 11.5564, lng: 104.9282 };

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
}: {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(value);
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);

  useEffect(() => {
    if (value) {
      setCenter(value);
      return;
    }

    if (!navigator.geolocation) {
      setCenter(fallbackCenter);
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
        setCenter(fallbackCenter);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }, [value]);

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

  const mapCenter = center ?? fallbackCenter;
  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Delivery pin</h3>
            <p className="text-sm text-[color:var(--color-text-soft)]">
              Click the map or drag the pin to set the exact drop-off point.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={useMyLocation}>
            Use my location
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--color-border)]">
          <Map
            center={[mapCenter.lng, mapCenter.lat]}
            zoom={15}
            className="h-72 w-full"
            styles={
              selectedStyle
                ? { light: selectedStyle, dark: selectedStyle }
                : undefined
            }
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
                    <span className="inline-flex rounded-full border border-white/85 bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                      Delivery pin
                    </span>
                  </div>
                </MarkerContent>
                <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-white/70 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                      Delivery point
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--color-text)]">
                      Exact drop-off location
                    </p>
                    <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                      Drag this pin to fine-tune the address the rider should follow.
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
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Pin set at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs text-[color:var(--color-text-muted)]">
            No delivery pin selected yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
