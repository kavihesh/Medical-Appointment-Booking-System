import { OBJECT_ID_PATTERN, toValidationErrors } from '@mab/shared';
import { AppError } from '../lib/AppError.js';

function validationError(zodError) {
  const { formErrors, fieldErrors } = toValidationErrors(zodError);
  return new AppError(400, 'VALIDATION_ERROR', formErrors[0] ?? 'Please correct the highlighted fields', fieldErrors);
}

/** Replaces req.body with the parsed (trimmed, normalised) body, or responds 400. */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) throw validationError(result.error);
  req.body = result.data;
  next();
};

/** Express 5 makes req.query read-only, so the parsed query goes to res.locals.query. */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) throw validationError(result.error);
  res.locals.query = result.data;
  next();
};

/** Use with router.param('id', ...): malformed ids get a 404 instead of a database CastError. */
export function checkObjectId(req, res, next, id) {
  next(OBJECT_ID_PATTERN.test(id) ? undefined : AppError.notFound('Record'));
}
