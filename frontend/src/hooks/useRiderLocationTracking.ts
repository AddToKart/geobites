import { useEffect, useRef, useState } from 'react';
import { updateDeliveryLocation } from '@/services/riderService';

function hasMovedEnough(
  previous: { lat: number; lng: number } | null,
  next: { lat: number; lng: number },
) {
  if (!previous) {
    return true;
  }

  const latDelta = Math.abs(previous.lat - next.lat);
  const lngDelta = Math.abs(previous.lng - next.lng);

  return latDelta > 0.00008 || lngDelta > 0.00008;
}

export function useRiderLocationTracking({
  orderId,
  enabled,
}: {
  orderId?: string;
  enabled: boolean;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSentAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !orderId || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords: position }) => {
        const nextCoords = {
          lat: position.latitude,
          lng: position.longitude,
        };

        setCoords(nextCoords);

        const now = Date.now();
        const enoughTimeElapsed = now - lastSentAtRef.current > 15000;

        if (!hasMovedEnough(lastSentRef.current, nextCoords) && !enoughTimeElapsed) {
          return;
        }

        lastSentRef.current = nextCoords;
        lastSentAtRef.current = now;
        void updateDeliveryLocation(orderId, {
          riderLat: nextCoords.lat,
          riderLng: nextCoords.lng,
        }).catch((error) => {
          console.warn('Failed to update rider location', error);
        });
      },
      (error) => {
        console.warn('Rider geolocation error', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, orderId]);

  return coords;
}
