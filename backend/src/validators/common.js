import { z } from 'zod';
import { CATEGORIES } from '../domain/categories.js';
import { inServiceArea, haversineKm } from '../utils/geo.js';
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid id');
export const idParams = z.object({ id: objectId });
const placeSchema = z
  .object({
    address: z.string().trim().min(2, 'Address is required').max(200),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .refine((p) => inServiceArea(p), { message: 'Location is outside the Lahore service area', path: ['lat'] });
const category = z.enum(CATEGORIES, {
  errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(', ')}` }),
});
const tripBase = z.object({ pickup: placeSchema, destination: placeSchema });
const differentPlaces = (t) => haversineKm(t.pickup, t.destination) >= 0.2;
const differentPlacesIssue = { message: 'Pickup and destination must be at least 200 m apart', path: ['destination'] };
export const estimateBody = tripBase.refine(differentPlaces, differentPlacesIssue);
export const createRideBody = tripBase.extend({ category }).refine(differentPlaces, differentPlacesIssue);
export const idempotencyKeyHeaders = z.object({
  'idempotency-key': z
    .string({ required_error: 'Idempotency-Key header is required' })
    .trim()
    .min(8, 'Idempotency-Key must be 8–128 characters')
    .max(128, 'Idempotency-Key must be 8–128 characters'),
});
export const driverActionBody = z.object({ driverId: objectId });
export const cancelBody = z.object({ reason: z.string().trim().max(200).optional() });
export const riderBody = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Phone must be 10–15 digits'),
});
export const availabilityBody = z.object({ status: z.enum(['available', 'offline']) });
