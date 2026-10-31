import { Schema, model } from 'mongoose';
import { CATEGORIES } from '../domain/categories.js';
import { RIDE_STATUSES } from '../domain/rideStateMachine.js';
import { placeSchema } from './shared.js';
const rideSchema = new Schema(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true },
    driver: { type: Schema.Types.ObjectId, ref: 'Driver', default: null },
    category: { type: String, enum: [...CATEGORIES], required: true },
    status: { type: String, enum: [...RIDE_STATUSES], default: 'requested', required: true },
    /** true while requested/accepted. Backs the "one active ride per rider" partial unique index. */
    isActive: { type: Boolean, default: true, required: true },
    pickup: { type: placeSchema, required: true },
    destination: { type: placeSchema, required: true },
    distanceKm: { type: Number, required: true },
    etaMinutes: { type: Number, required: true },
    fare: {
      currency: { type: String, default: 'PKR' },
      baseFare: { type: Number, required: true },
      ratePerKm: { type: Number, required: true },
      distanceKm: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    idempotencyKey: { type: String, required: true },
    requestHash: { type: String, required: true },
    acceptedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['rider', 'driver', 'system'] },
    cancelReason: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);
// Duplicate-request protection: the same rider + key can only ever create one ride.
rideSchema.index({ rider: 1, idempotencyKey: 1 }, { unique: true, name: 'rider_idempotency_key' });
// Data-integrity guard: a rider can have at most one active ride, enforced by the database.
rideSchema.index(
  { rider: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: 'one_active_ride_per_rider' },
);
rideSchema.index({ status: 1, category: 1 });
rideSchema.index({ 'pickup.location': '2dsphere' });
export const Ride = model('Ride', rideSchema);
