import { haversineKm } from '../utils/geo.js';
const RATES = {
  economy: { baseFare: 100, ratePerKm: 35, minimumFare: 180 },
  comfort: { baseFare: 160, ratePerKm: 55, minimumFare: 300 },
};
/** Straight-line distance understates road distance; this factor is a cheap approximation. */
export const ROAD_FACTOR = 1.3;
export const AVERAGE_SPEED_KMH = 25;
const round1 = (n) => Math.round(n * 10) / 10;
const ceilTo10 = (n) => Math.ceil(n / 10) * 10;
export const estimateRoadDistanceKm = (a, b) => round1(haversineKm(a, b) * ROAD_FACTOR);
export function calculateFare(category, distanceKm) {
  const { baseFare, ratePerKm, minimumFare } = RATES[category];
  const total = Math.max(minimumFare, ceilTo10(baseFare + ratePerKm * distanceKm));
  return { currency: 'PKR', baseFare, ratePerKm, distanceKm, total };
}
/** Minutes for a driver `straightLineKm` away to reach the pickup. Never less than 2. */
export const etaMinutesFor = (straightLineKm) =>
  Math.max(2, Math.ceil(((straightLineKm * ROAD_FACTOR) / AVERAGE_SPEED_KMH) * 60));
