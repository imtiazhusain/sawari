/** Rough bounding box of Lahore — our only service area. */
export const LAHORE_BOUNDS = { minLat: 31.3, maxLat: 31.7, minLng: 74.1, maxLng: 74.55 };
export const inServiceArea = ({ lat, lng }) =>
  lat >= LAHORE_BOUNDS.minLat &&
  lat <= LAHORE_BOUNDS.maxLat &&
  lng >= LAHORE_BOUNDS.minLng &&
  lng <= LAHORE_BOUNDS.maxLng;

  // 	Converts degrees into radians for trigonometric functions
const toRad = (d) => (d * Math.PI) / 180;
/** This is the Haversine formula. It calculates distance between two latitude/longitude points on a spherical Earth. */
export function haversineKm(a, b) {
  const R = 6371; //	Approximate Earth radius in kilometres
  const dLat = toRad(b.lat - a.lat); //	Difference in latitude, in radians
  const dLng = toRad(b.lng - a.lng); //Difference in longitude, in radians
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
