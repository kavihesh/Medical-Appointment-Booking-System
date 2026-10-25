import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../lib/AppError.js';

export function requestId(req, res, next) {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

export function notFound(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.path}`));
}

/** Maps known errors to safe JSON responses; anything unexpected is logged and returned as a generic 500. */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their 4 arguments
export function errorHandler(err, req, res, next) {
  const error = toAppError(err);
  if (error.status >= 500) {
    console.error(`[${req.id}] ${req.method} ${req.originalUrl}`, err);
  }
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.fieldErrors && { fieldErrors: error.fieldErrors }),
      requestId: req.id,
    },
  });
}

// Readable names for fields with a unique index, used in "already registered" messages.
const UNIQUE_FIELD_LABELS = { email: 'email', registrationNo: 'SLMC registration number', nic: 'NIC number' };

function toAppError(err) {
  if (err instanceof AppError) return err;

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    const message = `This ${UNIQUE_FIELD_LABELS[field] ?? field} is already registered`;
    return AppError.conflict('DUPLICATE', message, { [field]: message });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const fieldErrors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return new AppError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields', fieldErrors);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, 'INVALID_VALUE', `Invalid value for ${err.path}`);
  }
  // Errors raised by express.json() for malformed or oversized bodies.
  if (err.type === 'entity.parse.failed') return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  if (err.type === 'entity.too.large') return new AppError(413, 'BODY_TOO_LARGE', 'Request body is too large');

  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}
