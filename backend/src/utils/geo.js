/** Rough bounding box of Lahore — our only service area. */
export const LAHORE_BOUNDS = { minLat: 31.3, maxLat: 31.7, minLng: 74.1, maxLng: 74.55 };
export const inServiceArea = ({ lat, lng }) =>
  lat >= LAHORE_BOUNDS.minLat &&
  lat <= LAHORE_BOUNDS.maxLat &&
  lng >= LAHORE_BOUNDS.minLng &&
  lng <= LAHORE_BOUNDS.maxLng;
const toRad = (d) => (d * Math.PI) / 180;
/** Great-circle distance in km. */
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
