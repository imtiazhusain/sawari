import { asyncHandler } from '../utils/asyncHandler.js';
import { toRideDTO } from '../serializers/ride.serializer.js';
import * as rides from '../services/ride.service.js';
import { idempotencyKeyHeaders } from '../validators/common.js';

export const estimate = asyncHandler(async (req, res) => {
  res.json({ data: await rides.estimateRide(req.body) });
});

export const create = asyncHandler(async (req, res) => {

  //  validting the idempotency key
  const key = idempotencyKeyHeaders.parse(
    {
      'idempotency-key': req.header(
        'idempotency-key'
      )
    }
  )['idempotency-key'];
  const { ride, replayed } = await rides.createRide(
    res.locals.riderId,
    key,
    req.body
  );

  if (replayed) {
    res.setHeader('Idempotent-Replayed', 'true');
  }

  res.status(replayed ? 200 : 201).json({ data: toRideDTO(ride) });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: toRideDTO(await rides.getRideById(req.params.id)) });
});

export const accept = asyncHandler(async (req, res) => {
  res.json({
    data: toRideDTO(await rides.acceptRide(req.params.id, req.body.driverId))
  });
});

export const complete = asyncHandler(async (req, res) => {
  res.json({
    data: toRideDTO(await rides.completeRide(req.params.id, req.body.driverId))
  });
});

export const cancel = asyncHandler(async (req, res) => {
  res.json({
    data: toRideDTO(
      await rides.cancelRide(
        req.params.id,
        res.locals.riderId,
        req.body.reason
      )
    )
  });
});
