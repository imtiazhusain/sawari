import { env } from '../config/env.js';
import { Driver } from '../models/Driver.js';
import { fromPoint, toPoint } from '../models/shared.js';
import { haversineKm } from '../utils/geo.js';
/**
 * Nearest *available* driver of the right category within the search radius.
 * Uses the 2dsphere index ($near sorts by distance). This is a read-only hint:
 * the authoritative claim happens atomically in ride.service#acceptRide.
 */
export async function findNearestAvailableDriver(origin, category, radiusKm = env.DRIVER_SEARCH_RADIUS_KM) {
  const driver = await Driver.findOne({
    status: 'available',
    category,
    location: { $near: { $geometry: toPoint(origin), $maxDistance: radiusKm * 1000 } },
  });
  if (!driver) return null;
  return { driver, distanceKm: haversineKm(origin, fromPoint(driver.location)) };
}
