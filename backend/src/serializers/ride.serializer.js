import { fromPoint } from '../models/shared.js';

export function toDriverDTO(driver) {
  return {
    id: String(driver._id),
    name: driver.name,
    phone: driver.phone,
    category: driver.category,
    status: driver.status,
    vehicle: { model: driver.vehicle?.model, plate: driver.vehicle?.plate },
    location: fromPoint(driver.location),
    currentRideId: driver.currentRide ? String(driver.currentRide) : null,
  };
}

const isDriverDoc = (d) => {
  return !!d && typeof d === 'object' && 'name' in d;
};

/** Public representation of a ride. `driver` is only expanded when the query populated it. */
export function toRideDTO(ride) {
  const driver = isDriverDoc(ride.driver) ? toDriverDTO(ride.driver) : null;
  const fare = ride.fare; // required on every persisted ride
  return {
    id: String(ride._id),
    riderId: String(ride.rider),
    driverId: ride.driver ? String(
      isDriverDoc(ride.driver) ? ride.driver._id : ride.driver
    ) : null,
    status: ride.status,
    category: ride.category,
    pickup: {
      address: ride.pickup.address,
      ...fromPoint(ride.pickup.location)
    },
    destination: {
      address: ride.destination.address,
      ...fromPoint(ride.destination.location)
    },
    distanceKm: ride.distanceKm,
    etaMinutes: ride.etaMinutes,
    fare: {
      currency: fare.currency,
      baseFare: fare.baseFare,
      ratePerKm: fare.ratePerKm,
      distanceKm: fare.distanceKm,
      total: fare.total,
    },
    driver,
    createdAt: ride.createdAt,
    acceptedAt: ride.acceptedAt ?? null,
    completedAt: ride.completedAt ?? null,
    cancelledAt: ride.cancelledAt ?? null,
    cancelledBy: ride.cancelledBy ?? null,
    cancelReason: ride.cancelReason ?? null,
  };
}
