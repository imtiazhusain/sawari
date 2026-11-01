import { AppError } from '../utils/AppError.js';

/**
 * Stand-in for real authentication: the rider is identified by an X-Rider-Id header.
 * In production this is replaced by a verified JWT / session (see docs/ARCHITECTURE.md).
 */
export const requireRider = (req, res, next) => {
  const id = req.header('x-rider-id');

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return next(
      new AppError(
        401,
        'UNAUTHENTICATED',
        'A valid X-Rider-Id header is required'
      )
    );
  }

  res.locals.riderId = id;
  next();
};
