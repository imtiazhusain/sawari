import { Schema, model } from 'mongoose';
const riderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true },
);
export const Rider = model('Rider', riderSchema);
