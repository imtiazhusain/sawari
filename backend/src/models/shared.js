import { Schema } from 'mongoose';

/** GeoJSON Point — coordinates are [lng, lat]. */
export const pointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => {
          return v.length === 2;
        },
        message: 'coordinates must be [lng, lat]'
      },
    },
  },
  { _id: false },
);

export const placeSchema = new Schema(
  {
    address: { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: pointSchema, required: true },
  },
  { _id: false },
);

// This format is called GeoJSON.
export const toPoint = (c) => {
  return ({ type: 'Point', coordinates: [c.lng, c.lat] });
};

export const fromPoint = (p) => {
  return ({ lat: p.coordinates[1], lng: p.coordinates[0] });
};
