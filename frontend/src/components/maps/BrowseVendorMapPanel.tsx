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
    <div className="absolute inset-0 z-0 w-full h-full">
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
                      isSelected ? 'bg-black scale-125' : 'bg-orange-500 hover:scale-110',
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
    </div>
  );
}
