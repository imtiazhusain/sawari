import { env } from '../config/env.js';
import { Driver } from '../models/Driver.js';
import { fromPoint, toPoint } from '../models/shared.js';
import { haversineKm } from '../utils/geo.js';

//Find the nearest available driver in this category within the search radius of the pickup.

// Find the closest available Economy driver within 5 km of Liberty Market.

export async function findNearestAvailableDriver(
  origin,
  category,
  radiusKm = env.DRIVER_SEARCH_RADIUS_KM,
) {
  //A nearby driver who is busy will not qualify. An available Comfort driver will not qualify for an Economy search.
  const driver = await Driver.findOne({
    status: 'available',
    category,
    location: {
      $near: {
        $geometry: toPoint(origin),
        $maxDistance: radiusKm * 1000,
      },
    }, // Apply a geographic proximity search to the driver's location field.
  });

  if (!driver) {
    return null;
  }

  return {
    driver,
    distanceKm: haversineKm(origin, fromPoint(driver.location))
  };
}
