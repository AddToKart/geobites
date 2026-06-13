/**
 * Computes the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 * @returns Distance in kilometres.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const BASE_FEE = 25;
const RATE_PER_KM = 8;
const MAX_FEE = 120;

/**
 * Calculates the delivery fee based on km distance.
 * Formula: ₱25 base + ₱8/km, capped at ₱120.
 */
export function calculateDeliveryFee(distanceKm: number): number {
  const fee = BASE_FEE + distanceKm * RATE_PER_KM;
  return Math.min(Math.round(fee * 100) / 100, MAX_FEE);
}
