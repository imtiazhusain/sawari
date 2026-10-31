import { Router } from 'express';
import * as ctrl from '../controllers/driver.controller.js';
import { validate } from '../middlewares/validate.js';
import { availabilityBody, idParams } from '../validators/common.js';
const router = Router();
router.get('/', ctrl.list);
router.get('/:id/offers', validate({ params: idParams }), ctrl.offers);
router.patch('/:id/availability', validate({ params: idParams, body: availabilityBody }), ctrl.setAvailability);
export default router;
