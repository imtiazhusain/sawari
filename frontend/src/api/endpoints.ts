import type {
  Driver,
  Estimate,
  Place,
  Ride,
  RideCategory,
  Rider,
  TripPayload
} from '../types';
import { request } from './client';

export const ensureRider = (input: { name: string; phone: string }) => {
  return request<Rider>('/riders', { method: 'POST', body: input });
};

export const fetchPlaces = () => {
  return request<Place[]>('/places');
};

export const estimateRide = (trip: TripPayload) => {
  return request<Estimate>('/rides/estimate', { method: 'POST', body: trip });
};

/** `idempotencyKey` makes retries safe: the server returns the original ride instead of creating a duplicate. */
export const createRide = (
  trip: TripPayload & { category: RideCategory },
  idempotencyKey: string
) => {
  return request<Ride>(
    '/rides',
    {
      method: 'POST',
      body: trip,
      headers: { 'Idempotency-Key': idempotencyKey }
    }
  );
};

export const fetchRide = (id: string) => {
  return request<Ride>(`/rides/${id}`);
};

export const cancelRide = (id: string, reason?: string) => {
  return request<Ride>(
    `/rides/${id}/cancel`,
    { method: 'POST', body: { reason } }
  );
};

export const fetchDrivers = () => {
  return request<Driver[]>('/drivers');
};

export const fetchOffers = (driverId: string) => {
  return request<Ride[]>(`/drivers/${driverId}/offers`);
};

export const setDriverAvailability = (driverId: string, status: 'available' | 'offline') => {
  return request<Driver>(
    `/drivers/${driverId}/availability`,
    { method: 'PATCH', body: { status } }
  );
};

export const acceptRide = (rideId: string, driverId: string) => {
  return request<Ride>(
    `/rides/${rideId}/accept`,
    { method: 'POST', body: { driverId } }
  );
};

export const completeRide = (rideId: string, driverId: string) => {
  return request<Ride>(
    `/rides/${rideId}/complete`,
    { method: 'POST', body: { driverId } }
  );
};
