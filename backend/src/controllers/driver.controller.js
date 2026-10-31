import { asyncHandler } from '../utils/asyncHandler.js';
import { toDriverDTO, toRideDTO } from '../serializers/ride.serializer.js';
import * as drivers from '../services/driver.service.js';
export const list = asyncHandler(async (_req, res) => {
  res.json({ data: (await drivers.listDrivers()).map(toDriverDTO) });
});
export const setAvailability = asyncHandler(async (req, res) => {
  res.json({ data: toDriverDTO(await drivers.setAvailability(req.params.id, req.body.status)) });
});
export const offers = asyncHandler(async (req, res) => {
  res.json({ data: (await drivers.getOffers(req.params.id)).map(toRideDTO) });
});
