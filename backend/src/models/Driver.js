import { Schema, model } from 'mongoose';
import { CATEGORIES } from '../domain/categories.js';
import { pointSchema } from './shared.js';

export const DRIVER_STATUSES = ['offline', 'available', 'busy'];

const driverSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: [...CATEGORIES], required: true },
    vehicle: {
      model: { type: String, required: true },
      plate: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [...DRIVER_STATUSES],
      default: 'offline',
      required: true
    },
    location: { type: pointSchema, required: true },
    /** Set while busy. Lets us release a driver only if they are still bound to *this* ride. */
    currentRide: { type: Schema.Types.ObjectId, ref: 'Ride', default: null },
  },
  { timestamps: true },
);

// This creates a geographic index on location when the model’s indexes are built.
//A 2dsphere index lets MongoDB perform geographic searches using locations on a sphere.
driverSchema.index({ location: '2dsphere' });

driverSchema.index({ status: 1, category: 1 });

export const Driver = model('Driver', driverSchema);
