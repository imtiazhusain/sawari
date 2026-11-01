import { Router } from 'express';
import * as ctrl from '../controllers/ride.controller.js';
import { requireRider } from '../middlewares/requireRider.js';
import { validate } from '../middlewares/validate.js';
import {
  cancelBody,
  createRideBody,
  driverActionBody,
  estimateBody,
  idParams
} from '../validators/common.js';

const router = Router();

router.post('/estimate', validate({ body: estimateBody }), ctrl.estimate);

router.post('/', requireRider, validate({ body: createRideBody }), ctrl.create);

router.get('/:id', validate({ params: idParams }), ctrl.getOne);

router.post(
  '/:id/accept',
  validate({ params: idParams, body: driverActionBody }),
  ctrl.accept
);

router.post(
  '/:id/complete',
  validate({ params: idParams, body: driverActionBody }),
  ctrl.complete
);

router.post(
  '/:id/cancel',
  requireRider,
  validate({ params: idParams, body: cancelBody }),
  ctrl.cancel
);

export default router;
