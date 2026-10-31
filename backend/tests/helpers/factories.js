import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Driver } from '../../src/models/Driver.js';
import { Rider } from '../../src/models/Rider.js';
import { toPoint } from '../../src/models/shared.js';
export const app = createApp();
export const api = () => request(app);
export const LIBERTY = { address: 'Liberty Market, Gulberg III', lat: 31.5106, lng: 74.3446 };
export const PACKAGES = { address: 'Packages Mall', lat: 31.4707, lng: 74.3547 };
const NEAR_LIBERTY = { lat: 31.512, lng: 74.345 };
export const FAR_AWAY = { lat: 31.3732, lng: 74.1892 }; // Bahria Town, > 5 km from Liberty
let counter = 0;
export const createRider = (name = 'Test Rider') =>
  Rider.create({ name, phone: `+92300${String(1000000 + counter++)}` });
export const createDriver = (over = {}) =>
  Driver.create({
    name: `Driver ${counter}`,
    phone: `+92311${String(1000000 + counter++)}`,
    category: over.category ?? 'economy',
    status: over.status ?? 'available',
    vehicle: { model: 'Suzuki Cultus', plate: `LEA-${counter}` },
    location: toPoint(over.at ?? NEAR_LIBERTY),
  });
export const rideBody = (over = {}) => ({
  pickup: LIBERTY,
  destination: PACKAGES,
  category: 'economy',
  ...over,
});
export const bookRide = (riderId, opts = {}) =>
  api()
    .post('/api/v1/rides')
    .set('X-Rider-Id', riderId)
    .set('Idempotency-Key', opts.key ?? randomUUID())
    .send(opts.body ?? rideBody());
export const acceptRide = (rideId, driverId) => api().post(`/api/v1/rides/${rideId}/accept`).send({ driverId });
export const completeRide = (rideId, driverId) => api().post(`/api/v1/rides/${rideId}/complete`).send({ driverId });
export const cancelRide = (rideId, riderId) =>
  api().post(`/api/v1/rides/${rideId}/cancel`).set('X-Rider-Id', riderId).send({ reason: 'Changed my mind' });
