import { asyncHandler } from '../utils/asyncHandler.js';
import { listPlaces } from '../services/places.service.js';
import { upsertRider } from '../services/rider.service.js';
export const places = asyncHandler(async (_req, res) => {
  res.json({ data: listPlaces() });
});
export const createRider = asyncHandler(async (req, res) => {
  const rider = await upsertRider(req.body);
  res.json({ data: { id: String(rider._id), name: rider.name, phone: rider.phone } });
});
