import { env } from '../config/env.js';
import { Driver } from '../models/Driver.js';
import { Ride } from '../models/Ride.js';
import { errors } from '../utils/AppError.js';
export const listDrivers = () => Driver.find().sort({ name: 1 }).limit(100);
export async function setAvailability(driverId, status) {
  // Atomic: a busy driver can never be flipped by a stale client.
  const driver = await Driver.findOneAndUpdate(
    { _id: driverId, status: { $ne: 'busy' } },
    { $set: { status } },
    { new: true },
  );
  if (driver) return driver;
  if (!(await Driver.exists({ _id: driverId }))) throw errors.notFound('Driver');
  throw errors.conflict('DRIVER_BUSY', 'Finish your current ride before changing availability');
}
/** Open requests near an available driver, nearest first (2dsphere $near on pickup). */
export async function getOffers(driverId) {
  const driver = await Driver.findById(driverId);
  if (!driver) throw errors.notFound('Driver');
  if (driver.status !== 'available') return [];
  return Ride.find({
    status: 'requested',
    category: driver.category,
    'pickup.location': {
      $near: {
        $geometry: { type: 'Point', coordinates: driver.location.coordinates },
        $maxDistance: env.DRIVER_SEARCH_RADIUS_KM * 1000,
      },
    },
  }).limit(20);
}
