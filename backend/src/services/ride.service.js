import { createHash } from 'crypto';
import { env } from '../config/env.js';
import { CATEGORIES } from '../domain/categories.js';
import { canTransition, statusesAllowing } from '../domain/rideStateMachine.js';
import { Driver } from '../models/Driver.js';
import { Ride } from '../models/Ride.js';
import { Rider } from '../models/Rider.js';
import { fromPoint, toPoint } from '../models/shared.js';
import { AppError, errors } from '../utils/AppError.js';
import { haversineKm } from '../utils/geo.js';
import { logger } from '../utils/logger.js';
import { calculateFare, estimateRoadDistanceKm, etaMinutesFor } from './fare.service.js';
import { findNearestAvailableDriver } from './matching.service.js';


// The hash is a fingerprint used to check whether a retried request contains the same booking details.


//Idempotency key	“Is this the same booking attempt?”
//Request hash	“Does it contain the same booking details?”
const hashRequest = (i) =>
  createHash('sha256')
    .update(
      JSON.stringify([
        i.category,
        i.pickup.address,
        i.pickup.lat,
        i.pickup.lng,
        i.destination.address,
        i.destination.lat,
        i.destination.lng,
      ]),
    )
    .digest('hex');
export const getRideById = async (id) => {
  const ride = await Ride.findById(id).populate('driver');
  if (!ride) throw errors.notFound('Ride');
  return ride;
};
/** Frees a driver, but only if they are still bound to this specific ride. */
async function releaseDriver(driverId, rideId) {
  await Driver.updateOne(
    { _id: driverId, currentRide: rideId, status: 'busy' },
    { $set: { status: 'available', currentRide: null } },
  );
}
/**
 * Called after a conditional update matched nothing. Works out *why* so the caller gets
 * an accurate, actionable error instead of a generic failure.
 */
async function explainFailure(rideId, to, ownership) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw errors.notFound('Ride');
  if (ownership?.rider && String(ride.rider) !== ownership.rider)
    throw errors.forbidden('This ride belongs to another rider');
  if (!canTransition(ride.status, to)) throw errors.invalidTransition(ride.status, to);
  if (ownership?.driver) throw errors.forbidden('You are not the driver assigned to this ride');
  throw errors.conflict('CONCURRENT_UPDATE', 'The ride was changed by another request. Please retry.');
}
export async function estimateRide(input) {
  const distanceKm = estimateRoadDistanceKm(input.pickup, input.destination);
  const options = await Promise.all(
    CATEGORIES.map(async (category) => {
      const match = await findNearestAvailableDriver(input.pickup, category);
      return {
        category,
        fare: calculateFare(category, distanceKm),
        etaMinutes: match ? etaMinutesFor(match.distanceKm) : null,// This ETA estimates time for the driver to reach pickup
        available: Boolean(match),
      };
    }),
  );
  return { distanceKm, options };
}
export async function createRide(riderId, idempotencyKey, input) {
  const requestHash = hashRequest(input);
  const replay = async () => {
    const existing = await Ride.findOne({ rider: riderId, idempotencyKey });
    if (!existing) return null;
    if (existing.requestHash !== requestHash) {
      throw new AppError(
        422,
        'IDEMPOTENCY_KEY_REUSED',
        'This Idempotency-Key was already used with a different request',
      );
    }
    return { ride: await getRideById(String(existing._id)), replayed: true };
  };
  // Fast path: a retry of a request we already handled returns the original result.
  const earlier = await replay();
  if (earlier) return earlier;
  if (!(await Rider.exists({ _id: riderId }))) throw errors.notFound('Rider');
  const match = await findNearestAvailableDriver(input.pickup, input.category);
  if (!match) throw errors.conflict('NO_DRIVERS_AVAILABLE', 'No drivers are available nearby right now');
  const distanceKm = estimateRoadDistanceKm(input.pickup, input.destination);
  try {
    const created = await Ride.create({
      rider: riderId,
      category: input.category,
      pickup: { address: input.pickup.address, location: toPoint(input.pickup) },
      destination: { address: input.destination.address, location: toPoint(input.destination) },
      distanceKm,
      etaMinutes: etaMinutesFor(match.distanceKm),
      fare: calculateFare(input.category, distanceKm),
      idempotencyKey,
      requestHash,
    });
    logger.info({ rideId: String(created._id), riderId, category: input.category }, 'ride requested');
    return { ride: await getRideById(String(created._id)), replayed: false };
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Unique-index violation: either a concurrent duplicate of this same request (replay it)
    // or the rider already has another active ride.
    const raced = await replay();
    if (raced) return raced;
    throw errors.conflict('RIDER_HAS_ACTIVE_RIDE', 'You already have an active ride. Finish or cancel it first.');
  }
}
/**
 * Driver accepts a ride. Two atomic steps, each a conditional single-document update:
 *   1. claim the driver  (available -> busy)   — a driver can hold only one ride
 *   2. claim the ride    (requested -> accepted) — a ride can have only one driver
 * If step 2 loses, step 1 is compensated. No read-then-write races.
 */
export async function acceptRide(rideId, driverId) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw errors.notFound('Ride');
  if (!canTransition(ride.status, 'accepted')) throw errors.invalidTransition(ride.status, 'accepted');
  const candidate = await Driver.findById(driverId);
  if (!candidate) throw errors.notFound('Driver');
  if (candidate.category !== ride.category) {
    throw new AppError(
      403,
      'DRIVER_NOT_ELIGIBLE',
      `This is a ${ride.category} ride; the driver is registered for ${candidate.category}`,
    );
  }
  if (haversineKm(fromPoint(ride.pickup.location), fromPoint(candidate.location)) > env.DRIVER_SEARCH_RADIUS_KM) {
    throw errors.conflict('DRIVER_TOO_FAR', 'The driver is too far from the pickup point');
  }
  const claimed = await Driver.findOneAndUpdate(
    { _id: driverId, status: 'available', category: ride.category },
    { $set: { status: 'busy', currentRide: ride._id } },
    { new: true },
  );
  if (!claimed) throw errors.conflict('DRIVER_UNAVAILABLE', 'The driver is not available for new rides');
  let assigned;
  try {
    assigned = await Ride.findOneAndUpdate(
      { _id: rideId, status: { $in: statusesAllowing('accepted') } },
      { $set: { status: 'accepted', driver: claimed._id, acceptedAt: new Date() } },
      { new: true },
    );
  } catch (err) {
    await releaseDriver(claimed._id, ride._id);
    throw err;
  }
  if (!assigned) {
    await releaseDriver(claimed._id, ride._id);
    return explainFailure(rideId, 'accepted');
  }
  logger.info({ rideId, driverId }, 'ride accepted');
  return getRideById(rideId);
}
export async function completeRide(rideId, driverId) {
  const done = await Ride.findOneAndUpdate(
    { _id: rideId, driver: driverId, status: { $in: statusesAllowing('completed') } },
    { $set: { status: 'completed', isActive: false, completedAt: new Date() } },
    { new: true },
  );
  if (!done) return explainFailure(rideId, 'completed', { driver: driverId });
  await releaseDriver(driverId, rideId);
  logger.info({ rideId, driverId }, 'ride completed');
  return getRideById(rideId);
}
export async function cancelRide(rideId, riderId, reason) {
  const cancelled = await Ride.findOneAndUpdate(
    { _id: rideId, rider: riderId, status: { $in: statusesAllowing('cancelled') } },
    {
      $set: {
        status: 'cancelled',
        isActive: false,
        cancelledAt: new Date(),
        cancelledBy: 'rider',
        cancelReason: reason,
      },
    },
    { new: true },
  );
  if (!cancelled) return explainFailure(rideId, 'cancelled', { rider: riderId });
  if (cancelled.driver) await releaseDriver(cancelled.driver, rideId);
  logger.info({ rideId, riderId }, 'ride cancelled');
  return getRideById(rideId);
}
