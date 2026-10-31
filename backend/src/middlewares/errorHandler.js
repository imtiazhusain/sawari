import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
const requestIdOf = (req) => String(req.id ?? '');
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.path}`, requestId: requestIdOf(req) },
  });
};
/** One consistent error envelope: { error: { code, message, details?, requestId } } */
export const errorHandler = (err, req, res, _next) => {
  const requestId = requestIdOf(req);
  const send = (status, code, message, details) =>
    res.status(status).json({ error: { code, message, ...(details !== undefined && { details }), requestId } });
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return send(400, 'VALIDATION_ERROR', 'Some fields are invalid', details);
  }
  if (err instanceof AppError) return send(err.status, err.code, err.message, err.details);
  if (err?.type === 'entity.parse.failed') return send(400, 'INVALID_JSON', 'Request body is not valid JSON');
  if (err?.type === 'entity.too.large') return send(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  if (err instanceof mongoose.Error.CastError) return send(400, 'VALIDATION_ERROR', `Invalid ${err.path}`);
  logger.error({ err, requestId }, 'Unhandled error');
  return send(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
};
